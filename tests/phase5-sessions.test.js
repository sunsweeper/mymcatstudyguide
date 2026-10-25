// Package 2, Phase 5: targeted sessions, interleaving, performance-informed reinforcement.
const boot = require('./harness.js');
let pass=0, fail=0; const ok=(n,c,x="")=>{ if(c){pass++;console.log("PASS",n,x);} else {fail++;console.log("FAIL",n,x);} };
const T0 = Date.UTC(2026,9,22,17,0,0), iso = n => new Date(T0 - n * 864e5).toISOString().slice(0, 10);
const setH = (A, id, plan, due) => { A.progress.cards[id] = { status:"review", writing:false, last:iso(plan[plan.length-1][0]), due: due || iso(-5), interval:5, reps:1, total:plan.length, good:0, bad:0, history:plan.map(([d, r], i) => ({ d:iso(d), r, t:T0 - d * 864e5 + i })) }; };
const mk = () => { const h = boot({ clock:T0 }); const A = h.api; A.setView("q"); return { h, A }; };
const KNOWN = [[60, "good"], [57, "good"], [46, "good"], [20, "good"]];
const idsOf = (A, cat) => A.CARDS.filter(c => c[3].startsWith(cat + "-")).map(c => c[3]);

/* 5.2 interleaving */
{ const { A } = mk();
  const fam = [...idsOf(A, "1A").slice(0, 8), ...idsOf(A, "1B").slice(0, 8), ...idsOf(A, "2A").slice(0, 8)]; fam.forEach(id => setH(A, id, KNOWN));
  const unf = [...idsOf(A, "3A").slice(0, 6), ...idsOf(A, "3B").slice(0, 6)];
  const out = A.interleave(A.CARDS.map(c => c[3]).filter(id => fam.includes(id) || unf.includes(id)));
  ok("I1 every card kept exactly once", out.length === fam.length + unf.length && new Set(out).size === out.length);
  const famSeq = out.filter(id => fam.includes(id)); let adjSame = 0;
  for(let i = 1; i < famSeq.length; i++) if(A.conceptOf(famSeq[i]) === A.conceptOf(famSeq[i-1]) || A.nearDup(famSeq[i], famSeq[i-1])) adjSame++;
  ok("I2 familiar cards: never the same concept or a near-duplicate back to back", adjSame === 0, adjSame);
  let switches = 0; for(let i = 1; i < famSeq.length; i++) if(A.subOf(famSeq[i]) !== A.subOf(famSeq[i-1])) switches++;
  ok("I3 familiar cards are mixed across subtopics", switches >= famSeq.length * 0.6, `${switches}/${famSeq.length - 1}`);
  const runs = []; let cur = null; out.forEach(id => { if(unf.includes(id)){ const sb = A.subOf(id); if(cur && cur.sb === sb && cur.end === out.indexOf(id) - 1){ cur.n++; cur.end++; } else { cur = { sb, n:1, end:out.indexOf(id) }; runs.push(cur); } } });
  ok("I4 new cards stay in small blocks of one subtopic (up to 4), not scattered one at a time", runs.every(r => r.n <= 4) && runs.filter(r => r.n >= 2).length >= 2, runs.map(r => r.n).join(","));
}
{ const { A } = mk(); const pair = A.META.d[0];
  const out = A.interleave([pair[0], pair[1]]);
  ok("I5 a near-duplicate pair is still both included", out.length === 2); }

/* 5.1 targeted sessions */
{ const { A } = mk(); const ids = idsOf(A, "4B"); // 4B Fluids and gases
  setH(A, ids[0], [[30, "good"], [3, "good"]], iso(1));                          // due (overdue)
  setH(A, ids[1], [[30, "good"], [20, "again"], [10, "again"], [4, "again"]]);   // repeated failures, not due
  setH(A, ids[2], [[30, "good"], [5, "hard"]]);                                  // missed, not due
  ids.slice(3, 9).forEach(id => setH(A, id, KNOWN, iso(-40)));                   // strong
  A.startFocus(ids, "4B practice"); A.start(true); const d = A.deck.map(A.idOf);
  ok("F1 due/overdue cards come first", d[0] === ids[0]);
  ok("F2 then repeated misses, then missed cards", d.indexOf(ids[1]) < d.indexOf(ids[2]) && d.indexOf(ids[2]) < Math.min(...ids.slice(9).map(id => d.indexOf(id)).filter(i => i >= 0)));
  ok("F3 at least one stronger card is included for periodic review", ids.slice(3, 9).some(id => d.includes(id)));
  const per = {}; d.forEach(id => { const c = A.conceptOf(id); per[c] = (per[c] || 0) + 1; });
  ok("F4 no more than 3 cards from any one concept", Object.values(per).every(n => n <= 3), JSON.stringify(per));
  ok("F5 never both cards of a near-duplicate pair", A.META.d.every(([a, b]) => !(d.includes(a) && d.includes(b))));
  const unseen = d.filter(id => !A.st(id)).length;
  ok("F6 unseen cards limited to about 40% when there's other material", unseen <= 20 || d.length - unseen < 10, `${unseen}/${d.length}`); }
{ const { A } = mk();   // prerequisite weakness pulled in: Fluids depends on Conservation of energy
  const fluids = A.CARDS.map(c => c[3]).filter(id => A.META.c[id] && A.META.st[A.META.c[id][0]][1] === "Fluids");
  const preC = new Set(); fluids.forEach(id => (A.META.p[A.META.c[id][1]] || []).forEach(c => preC.add(c)));
  const preIds = A.CARDS.map(c => c[3]).filter(id => A.META.c[id] && preC.has(A.META.c[id][1]) && !fluids.includes(id));
  preIds.forEach(id => setH(A, id, [[20, "good"], [6, "again"]]));
  A.startFocus(fluids, "Fluids"); A.start(true);
  ok("F7 missed prerequisite cards are included in a targeted session", preIds.length > 0 && A.deck.some(k => preIds.includes(A.idOf(k))), preIds.join(",")); }

/* targeted practice doesn't distort the schedule */
{ const { h, A } = mk(); const ids = idsOf(A, "1A").slice(0, 3); ids.forEach(id => setH(A, id, KNOWN, iso(-40)));
  const before = JSON.stringify({ due:A.st(ids[0]).due, interval:A.st(ids[0]).interval }), S0 = A.memOf(ids[0]).m.S, lv = A.levelOf(ids[0]);
  A.startFocus(ids, "practice"); A.start(true); A.deck.splice(0, A.deck.length, ...ids); A.resetCard(); A.show("cards");
  const k = A.curKey; A.reveal(); A.chooseRating("good");
  ok("P1 a Got it on a not-yet-due card in a targeted session leaves its due date and interval alone", JSON.stringify({ due:A.st(k).due, interval:A.st(k).interval }) === before);
  ok("P2 ...is recorded as practice (e) and doesn't add to memory strength or mastery", A.st(k).history.slice(-1)[0].e === 1 && A.memOf(k).m.S === S0 && A.levelOf(k) === lv);
  const k2 = A.curKey; A.reveal(); A.chooseRating("again");
  h.els.curAnswer.oninput({ target:{ value:"Writing out the correct answer here." } }); A.submitReinforce();
  ok("P3 a miss in targeted practice does count (forgetting is real): due again, memory strength cut", A.st(k2).history.slice(-1)[0].r === "again" && A.st(k2).interval === 0 && A.memOf(k2).m.S < S0); }
{ const { A } = mk(); const id = idsOf(A, "1A")[0]; setH(A, id, [[10, "good"], [7, "good"]], iso(-4));
  A.pick("bb"); A.start(true); A.deck.unshift(id); A.progress.open.bb.ids = A.deck.slice(); A.resetCard(); A.show("cards");
  const due0 = A.st(id).due; A.reveal(); A.chooseRating("good");
  ok("P4 in a normal session an early Got it still follows the scheduler (unchanged behavior)", !A.st(id).history.slice(-1)[0].e && A.st(id).due !== due0); }

/* 5.3 reinforcement */
{ const { h, A } = mk();
  const ids = idsOf(A, "1A").slice(0, 12);
  setH(A, ids[2], [[40, "good"], [30, "again"], [10, "good"]], iso(0));
  setH(A, ids[4], KNOWN, iso(0));
  A.pick("bb"); A.start(true); const o = A.progress.open.bb; o.ids = ids.slice(); o.orig = ids.slice(); A.show("welcome"); A.pick("bb"); A.start();
  let i = 0; while(A.mode === "cards" && i < 20){ A.render(); if(h.els.reveal.disabled) h.els.curAnswer.oninput({ target:{ value:"from memory" } }); A.reveal(); if(i === 1){ A.chooseRating("hard"); h.els.curAnswer.oninput({ target:{ value:"Writing out my answer properly." } }); A.submitReinforce(); } else A.chooseRating("good"); i++; }
  const picks = (A.progress.open.bb.rfPicks||[]).map(A.idOf);
  ok("R1 three different reinforcement cards", picks.length === 3 && new Set(picks).size === 3);
  ok("R2 one she struggled with this session", picks.includes(ids[1]));
  ok("R3 one with a history of forgetting", picks.includes(ids[2]));
  ok("R4 one she had already learned (retention check)", picks.includes(ids[4]));
  ok("R5 nothing from the last three cards when other choices exist", picks.every(id => ids.indexOf(id) < 9)); }
{ const { A } = mk(); A.pick("bb"); A.start(true); const order = A.progress.open.bb.ids.slice(); let i = 0; while(A.mode === "cards" && i < 60){ A.reveal(); A.chooseRating("good"); i++; }
  const picks = A.progress.open.bb.rfPicks;
  ok("R6 brand-new cards all known: falls back to positions 4–10", picks.length === 3 && picks.every(k => order.slice(3, 10).includes(k))); }
{ const { A } = mk(); const id = idsOf(A, "2A")[0]; setH(A, id, KNOWN, iso(1));
  A.pick("bb"); A.start(true);
  ok("N1 regular sessions still start with due reviews", A.idOf(A.deck[0]) === id); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
