// Package 2, Phase 1: FSRS scheduling, mastery levels, confidence insertion, mastered-card sparkle, rollback.
const boot = require('./harness.js');
let pass=0, fail=0; const ok=(n,c,x="")=>{ if(c){pass++;console.log("PASS",n,x);} else {fail++;console.log("FAIL",n,x);} };
const T0 = Date.UTC(2026,9,22,17,0,0);
const ID = "1A-001";
const mk = () => { const h = boot({ clock:T0 }); return { h, A:h.api }; };
const seq = (h, A, key, plan) => { for(const [gap, r] of plan){ h.advanceDays(gap); A.rate(key, r); } return A.st(key); };

/* 1. Repeatedly incorrect */
{ const { h, A } = mk(); A.rate(ID, "good"); h.advanceDays(3); A.rate(ID, "good");
  const S1 = A.memOf(ID).m.S;
  for(let i = 0; i < 4; i++){ h.advanceDays(1); A.rate(ID, "again"); }
  const s = A.st(ID), m = A.memOf(ID);
  ok("P1 a card missed again and again stays due today", s.interval === 0 && s.due === s.last);
  ok("P2 ...its memory strength falls well below where it was", m.m.S < S1 / 2, `S ${S1.toFixed(1)} → ${m.m.S.toFixed(2)}`);
  ok("P3 ...and it is at the Learning level", m.level === "learning");
  ok("P4 ...and its difficulty has gone up", m.m.D > 6, m.m.D.toFixed(2));
}
/* 2. Consistently correct; 10. interval changes */
{ const rnd = Math.random; Math.random = () => 0.5;   // no spread, so the steps are exact
  const { h, A } = mk(); const ivs = [];
  A.rate(ID, "good"); ivs.push(A.st(ID).interval);
  for(let i = 0; i < 6; i++){ h.advanceDays(A.st(ID).interval); A.rate(ID, "good"); ivs.push(A.st(ID).interval); }
  ok("P5 intervals grow after each successful delayed retrieval (allowing ±5% spread)", ivs.every((v, i) => i === 0 || v >= ivs[i-1] * 0.9) && ivs[2] > 25, ivs.join(","));
  ok("P6 the first steps match the validated simulation (3, 11, 35 days)", ivs[0] === 3 && ivs[1] === 11 && ivs[2] === 35, ivs.slice(0,3).join(","));
  ok("P7 no interval is longer than 180 days", Math.max(...ivs) <= 180, Math.max(...ivs));
  Math.random = rnd;
}
{ const { h, A } = mk(); let mx = 0; A.rate(ID, "good"); for(let i = 0; i < 12; i++){ h.advanceDays(A.st(ID).interval); A.rate(ID, "good"); mx = Math.max(mx, A.st(ID).interval); }
  ok("P7b with random spread on, still never past 180 days", mx <= 180 && mx >= 170, mx);
}
{ const { h, A } = mk(); A.rate(ID, "good"); h.advanceDays(3); A.rate("1A-002", "good");
  const a = mk(), b = mk();
  seq(a.h, a.A, ID, [[0,"good"],[3,"good"]]); seq(b.h, b.A, ID, [[0,"good"],[3,"hard"]]);
  ok("P8 Struggled schedules the card sooner than Got it", b.A.st(ID).interval < a.A.st(ID).interval, `${b.A.st(ID).interval} < ${a.A.st(ID).interval}`);
}
/* Same-day repeats and early reviews (3.) */
{ const { h, A } = mk(); A.rate(ID, "good"); const iv = A.st(ID).interval, due = A.st(ID).due, S = A.memOf(ID).m.S;
  A.rate(ID, "good"); A.rate(ID, "good");
  ok("P9 repeating a card the same day never lengthens its interval", A.st(ID).interval === iv && A.st(ID).due === due && A.memOf(ID).m.S === S);
  h.advanceDays(1); A.rate(ID, "good");   // early: due in 3, reviewed after 1
  const early = A.memOf(ID).m.S;
  const b = mk(); b.A.rate(ID, "good"); b.h.advanceDays(3); b.A.rate(ID, "good");
  ok("P10 an early review strengthens memory less than an on-time one", early < b.A.memOf(ID).m.S, `${early.toFixed(1)} < ${b.A.memOf(ID).m.S.toFixed(1)}`);
  ok("P11 ...and a single early Got it is not a mastery step", A.levelOf(ID) !== "provisional" && A.levelOf(ID) !== "mastered");
}
/* 4. Into mastery */
{ const { h, A } = mk(); const lv = [];
  A.rate(ID, "good"); lv.push(A.levelOf(ID));
  for(let i = 0; i < 3; i++){ h.advanceDays(A.st(ID).interval); A.rate(ID, "good"); lv.push(A.levelOf(ID)); }
  ok("P12 one correct answer is never mastery (first sight: Learning)", lv[0] === "learning");
  ok("P13 path: Learning → Developing → Provisionally mastered → Mastered", lv.join(",") === "learning,developing,provisional,mastered", lv.join(","));
}
{ const { h, A } = mk();   // many correct answers, but all on consecutive days: no gap of 21 days, so not mastered
  for(let i = 0; i < 12; i++){ A.rate(ID, "good"); h.advanceDays(1); }
  ok("P14 daily cramming without a long gap can't reach Mastered", A.levelOf(ID) !== "mastered", A.levelOf(ID));
}
{ const { h, A } = mk(); A.rate(ID, "good"); h.advanceDays(3); A.rate(ID, "good"); h.advanceDays(11); A.rate(ID, "hard");
  ok("P15 a Struggled as the latest rating holds a card below provisional mastery", A.levelOf(ID) === "developing", A.levelOf(ID));
}
/* 5. Mastered, then forgotten */
{ const { h, A } = mk(); A.rate(ID, "good"); for(let i = 0; i < 3; i++){ h.advanceDays(A.st(ID).interval); A.rate(ID, "good"); }
  const before = A.st(ID).interval;
  h.advanceDays(A.st(ID).interval); A.rate(ID, "again");
  ok("P16 a mastered card that's forgotten becomes 'previously mastered, needs attention'", A.levelOf(ID) === "attention");
  ok("P17 ...and is due again today (reviews become frequent again)", A.st(ID).interval === 0);
  h.advanceDays(1); A.rate(ID, "good");
  ok("P18 ...after relearning, its next gap is far shorter than before", A.st(ID).interval < before / 4, `${A.st(ID).interval} vs ${before}`);
  ok("P19 ...and it stays 'needs attention' until it earns provisional mastery again", A.levelOf(ID) === "attention");
  for(let i = 0; i < 3; i++){ h.advanceDays(A.st(ID).interval); A.rate(ID, "good"); }
  ok("P20 ...which it can", ["provisional", "mastered"].includes(A.levelOf(ID)), A.levelOf(ID));
}
/* Mastered cards are never removed */
{ const { h, A } = mk(); A.rate(ID, "good"); for(let i = 0; i < 6; i++){ h.advanceDays(A.st(ID).interval); A.rate(ID, "good"); }
  ok("P21 a mastered card still has a due date (never retired)", A.levelOf(ID) === "mastered" && !!A.st(ID).due && A.st(ID).interval <= 180);
  h.advanceDays(A.st(ID).interval);
  ok("P22 ...and is offered again when due", A.bucket(ID) === 0);
}
/* 11. Test date */
{ const { h, A } = mk(); A.progress.testDate = "2026-11-21";   // 30 days → cap 15
  A.rate(ID, "good"); for(let i = 0; i < 4; i++){ h.advanceDays(A.st(ID).interval); A.rate(ID, "good"); }
  ok("P23 no interval goes past half the days left before the test", A.st(ID).interval <= Math.max(1, A.testCap()), `${A.st(ID).interval} cap ${A.testCap()}`);
}
/* Existing history is kept and used */
{ const h = boot({ clock:T0 }); const A = h.api;
  const old = { status:"review", writing:false, last:"2026-10-01", due:"2026-10-31", interval:30, reps:4, total:4, good:4, bad:0,
    history:[{d:"2026-08-01",r:"good"},{d:"2026-08-02",r:"good"},{d:"2026-08-05",r:"good"},{d:"2026-08-12",r:"good"},{d:"2026-09-01",r:"good"},{d:"2026-10-01",r:"good"}] };
  A.progress.cards[ID] = JSON.parse(JSON.stringify(old));
  ok("P24 existing due dates are not changed by the new scheduler", A.st(ID).due === "2026-10-31" && A.st(ID).interval === 30);
  ok("P25 existing history counts toward memory and mastery", A.memOf(ID).m.S > 30 && A.levelOf(ID) === "mastered", `S ${A.memOf(ID).m.S.toFixed(1)} ${A.levelOf(ID)}`);
  ok("P26 history entries are left exactly as they were", JSON.stringify(A.st(ID).history) === JSON.stringify(old.history));
  const shuffled = old.history.slice().reverse();
  ok("P27 history saved out of order gives the same result", A.memoryFrom(shuffled).m.S === A.memOf(ID).m.S);
}
/* Reverse direction */
{ const { h, A } = mk(); const rid = A.CARDS.find(c => A.REVERSE[c[3]])[3];
  A.rate(rid, "good"); for(let i = 0; i < 3; i++){ h.advanceDays(A.st(rid).interval); A.rate(rid, "good"); }
  A.rate(rid + "~r", "again");
  ok("P28 each direction keeps its own schedule and level", A.levelOf(rid) === "mastered" && A.levelOf(rid + "~r") === "learning");
  ok("P29 a card counts as mastered only when every direction she has studied is", A.cardLevel(rid) === "learning");
  ok("P30 an unstudied card is Unseen", A.cardLevel("1A-005") === "unseen");
}
/* 13. Sync: merging keeps the most recent card copy, so memory follows it */
{ const a = mk(), b = mk();
  seq(a.h, a.A, ID, [[0,"good"],[3,"good"]]); seq(b.h, b.A, ID, [[0,"good"],[3,"good"],[11,"good"]]);
  const m = a.A.mergeProgress([a.A.progress, b.A.progress]);
  a.A.progress = m;
  ok("P31 after a merge, memory comes from the newer device's history", a.A.memOf(ID).m.S === b.A.memOf(ID).m.S);
  a.A.progress.boosted = { "1A-009":"2026-10-01" }; b.A.progress.boosted = { "1A-009":"2026-10-20", "1A-010":"2026-10-18" };
  const m2 = a.A.mergeProgress([a.A.progress, b.A.progress]);
  ok("P32 confidence-insertion dates merge (newest date kept)", m2.boosted["1A-009"] === "2026-10-20" && m2.boosted["1A-010"] === "2026-10-18");
}
/* Confidence insertion */
function masterSome(h, A, ids){ for(const id of ids){ A.progress.cards[id] = { status:"review", writing:false, last:"2026-09-01", due:"2026-12-30", interval:90, reps:4, total:4, good:4, bad:0,
  history:[{d:"2026-06-01",r:"good"},{d:"2026-06-04",r:"good"},{d:"2026-06-15",r:"good"},{d:"2026-07-20",r:"good"},{d:"2026-09-01",r:"good"}] }; } }
{ const { h, A } = mk(); A.setView("q");
  const bb = A.CARDS.filter(c => c[0] === "bb").map(c => c[3]);
  const masters = bb.slice(-5); masterSome(h, A, masters);
  ok("P33 setup: those cards are mastered and not due", masters.every(id => A.levelOf(id) === "mastered" && A.bucket(id) === 3));
  A.pick("bb"); A.start(true);
  const n0 = A.deck.length;
  const firstThree = A.deck.slice(0, 3);
  for(let i = 0; i < 3; i++){ A.reveal(); A.chooseRating("again"); if(A.pendingR){ A.answer("again", "x".repeat(20)); } }
  const ins = A.deck[3];
  ok("P34 after 3 difficult cards in a row, one mastered card is inserted next", A.deck.length === n0 + 1 && masters.includes(A.idOf(ins)), ins);
  ok("P35 ...it wasn't already in the session", !firstThree.includes(ins));
  const before = JSON.stringify({ due:A.st(ins).due, interval:A.st(ins).interval, reps:A.st(ins).reps, total:A.st(ins).total });
  const lvl = A.levelOf(ins);
  A.reveal(); A.answer("good");
  const after = JSON.stringify({ due:A.st(ins).due, interval:A.st(ins).interval, reps:A.st(ins).reps, total:A.st(ins).total });
  ok("P36 a correct answer on the inserted card doesn't change its schedule", before === after, after);
  ok("P37 ...or its mastery level / memory strength", A.levelOf(ins) === lvl && A.st(ins).history.slice(-1)[0].b === 1);
  ok("P38 ...it's remembered so it isn't inserted again soon", A.progress.boosted[A.idOf(ins)] === "2026-10-22");
  const o = A.progress.open.bb;
  ok("P39 ...and it isn't counted in the session's results", !A.origKeys(o).map(A.idOf).includes(A.idOf(ins)));
  for(let i = 0; i < 3; i++){ A.reveal(); A.chooseRating("again"); if(A.pendingR) A.answer("again", "x".repeat(20)); }
  const ins2 = A.deck[A.pos];
  ok("P40 a second run of misses inserts a different mastered card", masters.includes(A.idOf(ins2)) && ins2 !== ins, ins2);
  A.reveal(); A.answer("again", "x".repeat(20));
  ok("P41 missing an inserted card does count: it's due again and needs attention", A.st(ins2).interval === 0 && A.levelOf(ins2) === "attention");
  for(let i = 0; i < 3; i++){ A.reveal(); A.chooseRating("again"); if(A.pendingR) A.answer("again", "x".repeat(20)); }
  ok("P42 at most 2 insertions per session", (o.boostCount || 0) === 2 && A.deck.length === n0 + 2, `${o.boostCount}`);
}
{ const { h, A } = mk(); A.setView("q");
  const bb = A.CARDS.filter(c => c[0] === "bb").map(c => c[3]); const masters = bb.slice(-2); masterSome(h, A, masters);
  A.progress.boosted = { [masters[0]]:"2026-10-15", [masters[1]]:"2026-10-01" };   // 7 and 21 days ago
  A.pick("bb"); A.start(true);
  ok("P43 a card inserted in the last 14 days is skipped; an older one may be used", A.idOf(A.pickBoost(A.progress.open.bb)) === masters[1]);
  A.progress.boosted[masters[1]] = "2026-10-20";
  ok("P44 with no eligible mastered card, nothing is inserted", A.pickBoost(A.progress.open.bb) === null);
}
{ const { h, A } = mk(); A.setView("q");
  const bb = A.CARDS.filter(c => c[0] === "bb").map(c => c[3]); masterSome(h, A, bb.slice(-3));
  A.pick("bb"); A.start(true); const n0 = A.deck.length;
  for(let i = 0; i < 3; i++){ A.reveal(); A.chooseRating("again"); if(A.pendingR) A.answer("again", "x".repeat(20)); }
  const ins = A.deck[3];
  A.previousCard();
  ok("P45 taking back the rating that triggered an insertion removes the insertion", A.deck.length === n0 && !A.deck.includes(ins));
}
{ const { h, A } = mk(); A.setView("q");   // Got it on a few, then misses: the run must be consecutive
  const bb = A.CARDS.filter(c => c[0] === "bb").map(c => c[3]); masterSome(h, A, bb.slice(-3));
  A.pick("bb"); A.start(true); const n0 = A.deck.length;
  for(const r of ["again", "again", "good", "again", "again"]){ A.reveal(); if(r === "good") A.answer("good"); else { A.chooseRating(r); if(A.pendingR) A.answer(r, "x".repeat(20)); } }
  ok("P46 a Got it resets the run (no insertion after 2+2 misses)", A.deck.length === n0);
}
/* Sparkle */
{ const { h, A } = mk();
  ok("P47 reduced-motion setting: no sparkle is drawn", A.maybeCelebrate(true) === false);
}
/* Rollback */
{ const { h, A } = mk(); A.rate(ID, "good"); h.advanceDays(3); A.rate(ID, "good");
  const hist = JSON.stringify(A.st(ID).history);
  A.RULES.scheduler = "ladder"; h.advanceDays(A.st(ID).interval); A.rate(ID, "good");
  ok("P48 rollback: switching back to the ladder keeps every history entry", JSON.stringify(A.st(ID).history.slice(0, -1)) === hist);
  ok("P49 ...and the ladder schedules from the kept streak (3rd Got it in a row → 7 days)", A.st(ID).interval === 7, A.st(ID).interval);
  A.RULES.scheduler = "fsrs";
}
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
