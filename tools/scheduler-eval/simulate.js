// Historical-review simulation: current fixed ladder vs FSRS, on simulated students whose memory follows a model the
// schedulers don't know. 1,000 cards, daily 50-card sessions, MCAT 90 days out (the site's test-date cap applies to both).
'use strict';
const S = require('./sched.js');
function rng(seed){ let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function lognormal(r, mu, sigma){ const u = 1 - r(), v = r(); return Math.exp(mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)); }
// ---- ground-truth memory models ----
// GT-EXP: exponential forgetting, spacing-dependent gains (a different functional form from FSRS).
function gtExp(r){
  const ability = lognormal(r, 0, 0.25);
  return {
    name:'exponential forgetting',
    item: () => ({ d: lognormal(r, 0, 0.5), S: 0 }),
    p: (it, t) => it.S <= 0 ? 0 : Math.exp(-t / it.S),
    learn: (it) => { it.S = 2 * ability / it.d; },
    success: (it, p) => { it.S *= 1 + 3.0 * ability / Math.sqrt(it.d) * Math.pow(1 - p, 0.6) + 0.3; },
    fail: (it) => { it.S = Math.max(2 * ability / it.d, it.S * 0.35); },
  };
}
// GT-FSRS: FSRS's own memory model with each student's parameters perturbed (favors FSRS; reported separately).
function gtFsrs(r){
  const w = S.W.map(x => x * lognormal(r, 0, 0.2));
  return {
    name:'FSRS-like (perturbed)',
    item: () => ({ dOff: (r() - 0.5) * 4, m: null }),
    p: (it, t) => it.m ? Math.pow(1 + 19 / 81 * t / it.m.S, -0.5) : 0,
    learn: (it) => { it.m = { S: w[0] * 1.5, D: Math.min(10, Math.max(1, w[4] + it.dOff)) }; },
    success: (it, p) => { const m = it.m; m.S = m.S * (Math.exp(w[8]) * (11 - m.D) * Math.pow(m.S, -w[9]) * (Math.exp(w[10] * (1 - p)) - 1) + 1); },
    fail: (it, p) => { const m = it.m; m.S = Math.min(m.S, w[11] * Math.pow(m.D, -w[12]) * (Math.pow(m.S + 1, w[13]) - 1) * Math.exp(w[14] * (1 - p))); m.D = Math.min(10, m.D + 0.5); },
  };
}
// GT-ACTR: ACT-R-style memory (Pavlik & Anderson 2005): activation from all past exposures, each decaying as a power law,
// with faster decay for exposures crammed close together (spacing effect).
function gtActr(r){
  const c = 0.217, a = 0.177, sN = 0.255, tau = -0.704 + (r() - 0.5) * 0.4, SCALE = 86400 * 0.025;   // standard values; psychological time compressed between sessions
  const act = (it) => { let A = 0; for(const e of it.ex){ const age = Math.max(1 / 1440, it.now - e.t) * SCALE; A += Math.pow(age, -e.d); } return A > 0 ? Math.log(A) - it.dOff : -Infinity; };
  const add = (it) => { const m = act(it); it.ex.push({ t: it.now, d: m === -Infinity ? a : c * Math.exp(m) + a }); };
  return {
    name:'ACT-R power-law with spacing',
    item: () => ({ ex: [], dOff: (r() - 0.5) * 0.6, now: 0 }),
    p: (it) => { const m = act(it); return m === -Infinity ? 0 : 1 / (1 + Math.exp((tau - m) / sN)); },
    learn: (it) => { add(it); add(it); },
    success: (it) => add(it),
    fail: (it) => { add(it); add(it); },
  };
}
function run(gtMaker, scheduler, seed, opts){
  const r = rng(seed), gt = gtMaker(rng(seed * 7 + 1));
  const N = 1000, EXAM = +(process.env.EXAM||90), SESSION = +(process.env.SESSION||50);
  const items = Array.from({ length:N }, () => ({ truth: gt.item(), sched: null, last: null, hist: [] }));
  const studyDays = Array.from({ length:EXAM }, () => r() < 0.85);
  let reviews = 0, newSeen = 0, maxDue = 0; const preds = [];
  for(let day = 0; day < EXAM; day++){
    if(!studyDays[day]) continue;
    const cap = Math.max(1, Math.floor((EXAM - day) / 2));
    const due = items.filter(it => it.sched && it.sched.due <= day).sort((a, b) => a.sched.due - b.sched.due);
    maxDue = Math.max(maxDue, due.length);
    const fresh = items.filter(it => !it.sched);
    const queue = due.slice(0, SESSION).concat(fresh.slice(0, Math.max(0, SESSION - due.length)));
    const missed = [];
    for(const it of queue){
      let rating; it.truth.now = day;
      if(!it.sched){ gt.learn(it.truth); newSeen++; rating = r() < 0.35 ? 'good' : r() < 0.5 ? 'hard' : 'again'; }  // first sight: mostly not known
      else {
        const t = day - it.last, p = gt.p(it.truth, t);
        if(scheduler === 'fsrs'){ const pr = S.fsrsPredict(it.sched, day); if(pr !== null) preds.push([pr, 0]); }
        const recalled = r() < p;
        if(scheduler === 'fsrs' && preds.length) preds[preds.length - 1][1] = recalled ? 1 : 0;
        if(recalled){ gt.success(it.truth, p); rating = r() < Math.min(0.95, 0.3 + p) ? 'good' : 'hard'; }
        else { gt.fail(it.truth, p); rating = 'again'; }
      }
      reviews++;
      it.sched = scheduler === 'fsrs' ? S.fsrsNext(it.sched, rating, day, Object.assign({ cap, rand: r, fuzz: true }, opts)) : S.ladderNext(it.sched, rating, day, { cap });
      it.last = day; it.hist.push({ day, r: rating });
      if(rating === 'again') missed.push(it);
    }
    for(const it of missed){ it.truth.now = day + 0.02; // the site's optional second try at the end of the session (same day)
      const p = gt.p(it.truth, 0); const rating = r() < p ? 'good' : 'again'; reviews++;
      it.sched = scheduler === 'fsrs' ? S.fsrsNext(it.sched, rating, day, Object.assign({ cap, rand: r, fuzz: true }, opts)) : S.ladderNext(it.sched, rating, day, { cap });
    }
  }
  items.forEach(it => { it.truth.now = EXAM; });
  const byLevel = {};
  for(const it of items){ if(!it.sched) continue; const lv = S.memoryFrom(it.hist).level; const b = byLevel[lv] = byLevel[lv] || { n:0, exam:0, later:0 };
    b.n++; b.exam += gt.p(it.truth, EXAM - it.last); it.truth.now = EXAM + 30; b.later += gt.p(it.truth, EXAM + 30 - it.last); it.truth.now = EXAM; }
  const examRecall = items.reduce((a, it) => a + (it.sched ? gt.p(it.truth, EXAM - it.last) : 0), 0);
  const seenRecall = items.filter(it => it.sched).reduce((a, it) => a + gt.p(it.truth, EXAM - it.last), 0) / Math.max(1, newSeen);
  let ll = 0, brier = 0, base = 0; const mean = preds.reduce((a, x) => a + x[1], 0) / Math.max(1, preds.length);
  for(const [p, y] of preds){ const q = Math.min(0.999, Math.max(0.001, p)); ll -= y * Math.log(q) + (1 - y) * Math.log(1 - q); brier += (p - y) ** 2; base += (mean - y) ** 2; }
  return { byLevel, examRecall, seenRecall, newSeen, reviews, maxDue, preds: preds.length, logloss: ll / Math.max(1, preds.length), brier: brier / Math.max(1, preds.length), brierBase: base / Math.max(1, preds.length) };
}
const avg = (rs, k) => rs.reduce((a, x) => a + x[k], 0) / rs.length;
const out = {};
for(const [gname, gm] of [['GT-EXP', gtExp], ['GT-ACTR', gtActr], ['GT-FSRS', gtFsrs]]){
  for(const [label, sch, opts] of [['ladder (current)', 'ladder'], ['FSRS r=0.90', 'fsrs', { target:0.9 }], ['FSRS r=0.85', 'fsrs', { target:0.85 }], ['FSRS r=0.80', 'fsrs', { target:0.80 }]]){
    const rs = []; for(let s = 1; s <= 30; s++) rs.push(run(gm, sch, s * 101, opts));
    out[gname + ' | ' + label] = { cardsKnownOnExamDay: +avg(rs, 'examRecall').toFixed(1), recallOfSeenCards: +avg(rs, 'seenRecall').toFixed(3), cardsIntroduced: +avg(rs, 'newSeen').toFixed(0), totalReviews: +avg(rs, 'reviews').toFixed(0), knownPer100Reviews: +(avg(rs, 'examRecall') / avg(rs, 'reviews') * 100).toFixed(2), peakDueBacklog: +avg(rs, 'maxDue').toFixed(0), ...(sch === 'fsrs' ? { predictionLogLoss: +avg(rs, 'logloss').toFixed(3), brier: +avg(rs, 'brier').toFixed(4), brierIfAlwaysAverage: +avg(rs, 'brierBase').toFixed(4) } : {}) };
  }
}
console.table(out);
if(process.env.LEVELS){
  const lv = {};
  for(const [gname, gm] of [['GT-EXP', gtExp], ['GT-ACTR', gtActr], ['GT-FSRS', gtFsrs]]){
    const agg = {}; for(let s = 1; s <= 30; s++){ const res = run(gm, 'fsrs', s * 101, { target:0.9 }); for(const [k, b] of Object.entries(res.byLevel)){ const a = agg[k] = agg[k] || { n:0, exam:0, later:0 }; a.n += b.n; a.exam += b.exam; a.later += b.later; } }
    for(const k of ['learning', 'developing', 'attention', 'provisional', 'mastered']){ const a = agg[k]; if(a) lv[gname + ' | ' + k] = { cardsPerStudent: +(a.n / 30).toFixed(1), recallOnExamDay: +(a.exam / a.n).toFixed(3), recall30DaysLaterNoReview: +(a.later / a.n).toFixed(3) }; }
  }
  console.table(lv); require('fs').writeFileSync(__dirname + '/sim-levels.json', JSON.stringify(lv, null, 1));
}
require('fs').writeFileSync(__dirname + '/sim-results.json', JSON.stringify(out, null, 1));
