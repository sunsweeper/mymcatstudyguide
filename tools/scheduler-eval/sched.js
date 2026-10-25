// Scheduler candidates for Package 2, Phase 1. Pure functions over a card direction's review history.
// History entries: { d: 'YYYY-MM-DD' | day number, r: 'good'|'hard'|'again' }. Only the first rating of each day counts
// toward memory strength (same-day repeats never lengthen an interval).
'use strict';
// ---------- current: fixed ladder ----------
const LADDER = [1, 3, 7, 14, 30, 60, 90];
function ladderNext(state, r, day, opts){
  // state: { reps, interval, due, last, misses(list of daily-first ratings) }
  const s = Object.assign({ reps:0, interval:0, due:day, last:null, daily:[] }, state);
  const firstToday = s.last !== day, early = s.last !== null && firstToday && s.due > day;
  const misses = s.daily.slice(-8).filter(x => x !== 'good').length;
  if(firstToday) s.daily = s.daily.concat([r]);
  if(r === 'again'){ s.reps = 0; s.interval = 0; s.due = day; }
  else if(r === 'hard'){ s.reps = 0; s.interval = 1; s.due = day + 1; }
  else if(!firstToday || early){ if(s.interval === 0){ s.interval = 1; s.due = day + 1; } }
  else { s.reps++; const base = LADDER[Math.min(s.reps - 1, LADDER.length - 1)]; const f = misses === 0 ? 1 : misses === 1 ? 0.6 : 0.4; s.interval = Math.max(1, Math.round(base * f)); if(opts && opts.cap) s.interval = Math.min(s.interval, opts.cap); s.due = day + s.interval; }
  s.last = day; return s;
}
// ---------- candidate: FSRS (FSRS-5 default parameters) ----------
const W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
const DECAY = -0.5, FACTOR = 19 / 81;
const G = { again:1, hard:2, good:3 };
const clampD = d => Math.min(10, Math.max(1, d));
const retrievability = (t, S) => Math.pow(1 + FACTOR * t / S, DECAY);
const D0 = g => clampD(W[4] - Math.exp(W[5] * (g - 1)) + 1);
function fsrsUpdate(m, g, elapsed){
  // m: { S, D } or null for the first review
  if(!m) return { S: W[g - 1], D: D0(g) };
  const R = retrievability(Math.max(0, elapsed), m.S);
  let S;
  if(g === 1) S = Math.min(m.S, W[11] * Math.pow(m.D, -W[12]) * (Math.pow(m.S + 1, W[13]) - 1) * Math.exp(W[14] * (1 - R)));
  else S = m.S * (Math.exp(W[8]) * (11 - m.D) * Math.pow(m.S, -W[9]) * (Math.exp(W[10] * (1 - R)) - 1) * (g === 2 ? W[15] : 1) + 1);
  const dD = -W[6] * (g - 3), Dp = m.D + dD * (10 - m.D) / 9;
  const D = clampD(W[7] * D0(4) + (1 - W[7]) * Dp);
  return { S: Math.max(0.1, S), D };
}
const intervalFor = (S, target) => S / FACTOR * (Math.pow(target, 1 / DECAY) - 1);
function fsrsNext(state, r, day, opts){
  // state: { m:{S,D}|null, lastDay, due, interval }
  const o = Object.assign({ target:0.9, maxInterval:180 }, opts || {});
  const s = Object.assign({ m:null, lastDay:null, due:day, interval:0 }, state);
  const firstToday = s.lastDay !== day;
  if(firstToday){
    s.m = fsrsUpdate(s.m, G[r], s.lastDay === null ? 0 : day - s.lastDay);
    s.lastDay = day;
    if(r === 'again'){ s.interval = 0; s.due = day; }
    else {
      let iv = Math.max(1, Math.round(intervalFor(s.m.S, o.target)));
      if(r === 'hard') iv = Math.max(1, Math.min(iv, Math.round(intervalFor(s.m.S, o.target) * 0.8)));
      if(o.fuzz && iv >= 4){ const f = Math.max(1, Math.round(iv * 0.05)); iv += Math.round((o.rand ? o.rand() : Math.random()) * 2 * f) - f; }
      iv = Math.min(iv, o.maxInterval);
      if(o.cap) iv = Math.min(iv, o.cap);
      s.interval = iv; s.due = day + iv;
    }
  } else {
    // Same-day repeat: never lengthens the interval. A same-day miss keeps the card due today.
    if(r === 'again'){ s.interval = 0; s.due = day; }
    else if(s.interval === 0){ s.interval = 1; s.due = day + 1; }
  }
  return s;
}
function fsrsPredict(state, day){ return state && state.m ? retrievability(day - state.lastDay, state.m.S) : null; }
// ---------- mastery (Package 2, Phase 1.2; criteria in docs/package-2/MASTERY_CRITERIA.md) ----------
const MASTERY = { provisional:{ succ:2, gap:7, S:21 }, mastered:{ succ:3, gap:21, S:60 } };
const RANK = { unseen:0, learning:1, developing:2, attention:2, provisional:3, mastered:4 };
// entries: [{ day:<number>, r, b? }] oldest first. Only the first counted rating of each day is used; a "good" on a
// confidence insertion (b) is never counted, so insertions can't move a card forward.
function memoryFrom(entries){
  let m = null, lastDay = null, succ = [], peak = 0, lastR = null;
  for(const e of entries){
    if((e.b || e.e) && e.r === 'good') continue;
    if(e.day === lastDay) continue;
    const gap = lastDay === null ? null : e.day - lastDay;
    m = fsrsUpdate(m, G[e.r], gap || 0);
    if(e.r === 'again') succ = [];
    else if(e.r === 'good' && gap !== null && gap >= 1) succ.push(gap);
    lastDay = e.day; lastR = e.r;
    const lv = levelOf(m, succ, lastR);
    if(RANK[lv] > peak) peak = RANK[lv];
  }
  let level = m ? levelOf(m, succ, lastR) : 'unseen';
  if(peak >= RANK.provisional && RANK[level] < RANK.provisional) level = 'attention';
  return { m, lastDay, level, peak, succ: succ.length };
}
function levelOf(m, succ, lastR){
  const meets = c => lastR === 'good' && succ.length >= c.succ && Math.max(0, ...succ) >= c.gap && m.S >= c.S;
  if(meets(MASTERY.mastered)) return 'mastered';
  if(meets(MASTERY.provisional)) return 'provisional';
  if(succ.length >= 1) return 'developing';
  return 'learning';
}
module.exports = { MASTERY, memoryFrom, LADDER, ladderNext, W, fsrsUpdate, fsrsNext, fsrsPredict, retrievability, intervalFor };
