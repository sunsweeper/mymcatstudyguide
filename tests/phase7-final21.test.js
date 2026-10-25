// Package 2, Phase 7: Final 21 exam readiness mode.
const boot = require('./harness.js');
let pass=0, fail=0; const ok=(n,c,x="")=>{ if(c){pass++;console.log("PASS",n,x);} else {fail++;console.log("FAIL",n,x);} };
const T0 = new Date(2026, 9, 22, 10, 0, 0).getTime();
const ds = n => { const d = new Date(T0); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const setH = (A, id, plan, due) => { A.progress.cards[id] = { status:"review", writing:false, last:ds(-plan[plan.length-1][0]), due: due || ds(5), interval:5, reps:1, total:plan.length, good:0, bad:0, history:plan.map(([d, r], i) => ({ d:ds(-d), r, t:T0 - d * 864e5 + i })) }; };
const KNOWN = [[90, "good"], [87, "good"], [76, "good"], [40, "good"]];
const mk = days => { const h = boot({ clock:T0 }); const A = h.api; if(days !== undefined) A.progress.testDate = ds(days); A.show("welcome"); return { h, A }; };
const scr = h => h.els.screen.innerHTML;
// some history so the stages have material
const seedStudy = A => { const ids = A.CARDS.map(c => c[3]);
  ids.slice(0, 120).forEach((id, i) => setH(A, id, i % 5 === 0 ? [[30, "good"], [20, "again"], [10, "again"], [3, "again"]] : i % 5 === 1 ? [[30, "good"], [4, "hard"]] : KNOWN, i % 7 === 0 ? ds(-1) : ds(20))); };

{ for(const [d, label] of [[undefined, "no date"], [30, "30 days out"], [22, "22 days out"], [0, "MCAT day"], [-3, "after the exam"]]){ const { h, A } = mk(d);
    ok(`W1 no Final 21 offer: ${label}`, A.f21State() === null && !scr(h).includes("Final 21")); } }
{ const { h, A } = mk(21);
  ok("W2 at 21 days the mode is offered", A.f21State() === "offer" && scr(h).includes("Final 21: Exam Readiness Mode") && scr(h).includes("Turn on Final 21") && scr(h).includes("No thanks"));
  ok("W3 the offer says nothing is reset and it can be turned off", scr(h).includes("Nothing in your history or schedule is reset"));
  h.els.f21No.onclick();
  ok("W4 declining is remembered and leaves only a quiet way back", A.f21State() === "declined" && !scr(h).includes("Begin Today") && scr(h).includes("Final 21 is off"));
  A.saveDate(ds(18), false); A.show("welcome");
  ok("W5 a new MCAT date inside the window asks again", A.f21State() === "offer"); }
{ const { h, A } = mk(18); seedStudy(A); const before = JSON.stringify(A.progress.cards);
  A.setF21(true); A.show("welcome");
  ok("W6 turning it on shows today's stage and the Begin button", scr(h).includes("Final 21 · 18 days to go · Find the gaps") && scr(h).includes("Begin Today&#39;s Final 21 Review".replace("&#39;", "'")));
  ok("W7 turning it on doesn't touch history or schedules", JSON.stringify(A.progress.cards) === before);
  const html = scr(h);
  ok("W8 readiness readout covers coverage, mastered concepts, retention, gaps, unseen, overdue, assessment confidence", ["Curriculum covered", "mastered", "Holding up after a day+", "Significant gaps", "Important material not seen yet", "Overdue reviews", "How clear the picture is"].every(x => html.includes(x)));
  ok("W9 ...labeled as an estimate, not a score prediction", html.includes("It is not an MCAT score prediction") && !/\b(score of|predicted score|\d{3} on the MCAT)\b/i.test(html));
  h.els.f21Go.onclick(); A.start(true);
  const d = A.deck.map(A.idOf), dueIds = A.CARDS.map(c => c[3]).filter(id => A.st(id) && A.st(id).due <= ds(0));
  ok("W10 days 21–15: due reviews first", dueIds.length > 0 && d.slice(0, dueIds.length).every(id => dueIds.includes(id)));
  ok("W11 ...then important unseen material is a big share", d.filter(id => !A.st(id) && A.META.c[id][3] === 3).length >= 10, d.filter(id => !A.st(id)).length);
  ok("W12 ...and at least one mastered-card check", d.some(id => ["mastered", "provisional"].includes(A.levelOf(id)))); }
{ const { h, A } = mk(10); seedStudy(A); A.setF21(true); A.pick("f21"); A.start(true);
  const d = A.deck.map(A.idOf);
  ok("W13 days 14–8: repeatedly missed cards are prioritized", d.filter(id => A.cardFacts(id).fails >= 2).length >= 5);
  ok("W14 ...with harder conceptual / application questions", d.some(id => A.META.c[id][4] >= 1 || A.META.c[id][5] >= 3)); }
{ const { h, A } = mk(5); seedStudy(A); A.setF21(true); A.pick("f21"); A.start(true);
  const d = A.deck.map(A.idOf);
  ok("W15 days 7–4: retention checks on mastered material", d.filter(id => ["mastered", "provisional"].includes(A.levelOf(id))).length >= 10); }
{ const { h, A } = mk(2); seedStudy(A); A.setF21(true); A.show("welcome");
  ok("W16 days 3–1: the light-review stage", scr(h).includes("Light, high-value review"));
  A.pick("f21"); A.start(true);
  ok("W17 ...with a shorter session (25 at most), no quota", A.deck.length <= 25 && !/cards a day|must complete|quota/i.test(scr(h))); }
{ const { h, A } = mk(12); seedStudy(A); A.setF21(true); A.pick("f21"); A.start(true);
  const k = A.deck[0], before = JSON.stringify(A.progress.cards);
  A.saveDate(ds(60), false); A.show("welcome");
  ok("W18 rescheduling beyond the window turns Final 21 off by itself", A.f21State() === null && !scr(h).includes("Final 21 ·"));
  ok("W19 ...drops today's Final 21 session (rebuilt if the date comes back)", !A.progress.open.f21);
  ok("W20 ...and keeps every card's history (only the test-date cap rule ran)", Object.keys(JSON.parse(before)).every(id => JSON.stringify(JSON.parse(before)[id].history) === JSON.stringify(A.progress.cards[id].history))); }
{ const { h, A } = mk(12); seedStudy(A); A.setF21(true); A.pick("f21"); A.start(true);
  const k = A.deck.find(x => A.st(x) && A.st(x).due > ds(0) && !A.memOf(x).needs);
  if(k){ A.deck.splice(A.deck.indexOf(k), 1); A.deck.unshift(k); A.resetCard(); A.show("cards"); const due0 = A.st(k).due; A.reveal(); A.chooseRating("good");
    ok("W21 a Got it on a not-yet-due card in Final 21 doesn't move its schedule", A.st(k).due === due0 && A.st(k).history.slice(-1)[0].e === 1); }
  else ok("W21 (setup) found a not-due studied card", false); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
