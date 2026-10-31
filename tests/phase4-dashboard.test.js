// Package 2, Phase 4: Weakness Dashboard model.
const boot = require('./harness.js');
let pass=0, fail=0; const ok=(n,c,x="")=>{ if(c){pass++;console.log("PASS",n,x);} else {fail++;console.log("FAIL",n,x);} };
const T0 = Date.UTC(2026,9,22,17,0,0);
const iso = n => new Date(T0 - n * 864e5).toISOString().slice(0, 10);
// history from a plan of [daysAgo, rating]
const setH = (A, id, plan, due) => { A.progress.cards[id] = { status:"review", writing:false, last:iso(plan[plan.length-1][0]), due: due || iso(-5), interval:5, reps:1, total:plan.length, good:0, bad:0, history:plan.map(([d, r], i) => ({ d:iso(d), r, t:T0 - d * 864e5 + i })) }; };
const sub = (A, name) => A.dashModel().subs.find(s => s.name === name);
const idsOf = (A, name) => { const ix = A.META.st.findIndex(s => s[1] === name); return A.CARDS.map(c => c[3]).filter(id => A.META.c[id] && A.META.c[id][0] === ix); };
const conceptsOf = (A, ids) => new Set(ids.map(id => A.META.c[id][1]));
const mk = () => { const h = boot({ clock:T0 }); return { h, A:h.api }; };

{ const { A } = mk();
  ok("D1 the embedded index covers all 1000 cards (plus the graphical-card drafts) and their subtopics", A.CARDS.length === 1000 && A.CARDS.every(c => A.META.c[c[3]]) && Object.keys(A.META.c).filter(id => !/-G\d\d$/.test(id)).length === 1000 && A.META.st.length >= 131);
  ok("D2 nothing studied: every subtopic 'unseen', no priorities", A.dashModel().subs.every(s => s.status === "unseen") && A.dashModel().top.length === 0); }
{ const { A } = mk(); const ids = idsOf(A, "Fluids");
  setH(A, ids[0], [[3, "again"]]);
  ok("D3 one card, one rating: 'insufficient evidence', not weak", sub(A, "Fluids").status === "thin"); }
{ const { A } = mk(); const ids = idsOf(A, "Fluids"); const byC = {}; ids.forEach(id => { const c = A.META.c[id][1]; (byC[c] = byC[c] || []).push(id); });
  const oneConcept = Object.values(byC).sort((a, b) => b.length - a.length)[0];
  oneConcept.slice(0, 2).forEach(id => setH(A, id, [[20, "good"], [15, "again"], [10, "again"], [5, "again"], [2, "again"]]));
  const s = sub(A, "Fluids");
  ok("D4 many misses on cards of a single concept count as one concept's evidence (can't inflate)", s.evidence <= 1 && s.status === "thin", `evidence ${s.evidence}`); }
{ const { A } = mk(); const ids = idsOf(A, "Fluids"); const cs = [...conceptsOf(A, ids)];
  const pick = cs.slice(0, 4).map(c => ids.find(id => A.META.c[id][1] === c));
  pick.forEach(id => setH(A, id, [[30, "good"], [25, "again"], [20, "again"], [12, "again"], [6, "again"], [2, "again"]]));
  ok("D5 repeated misses across 4 concepts, time-separated: persistent weakness", sub(A, "Fluids").status === "persistent", sub(A, "Fluids").status);
  const m = A.dashModel();
  ok("D6 ...and it is the top priority", m.top[0] && m.top[0].name === "Fluids");
  const acts = A.subActions(m.top[0]);
  ok("D7 recommendations point at real cards: missed cards first, then practice", acts[0].kind === "missed" && acts[0].ids.length === 4 && acts.every(a => a.ids.length && a.ids.every(id => A.META.c[id])));
  ok("D8 Fluids gets a prerequisite link (Conservation of energy) with real cards outside the subtopic", acts.some(a => a.kind === "prereq" && a.ids.length && a.ids.every(id => !ids.includes(id))), acts.map(a => a.label).join(" | "));
  const cat = A.categoryStatus(m.subs.filter(s => s.cat === "4B"));
  ok("D9 the 4B category is called weak only because the evidence spans several concepts", cat === "persistent", cat); }
{ const { A } = mk(); const ids = idsOf(A, "Fluids"); const cs = [...conceptsOf(A, ids)];
  cs.slice(0, 4).map(c => ids.find(id => A.META.c[id][1] === c)).forEach(id => setH(A, id, [[40, "again"], [35, "again"], [30, "again"], [9, "good"], [6, "good"], [2, "good"]]));
  ok("D10 misses early, then holding up: improving", sub(A, "Fluids").status === "improving", sub(A, "Fluids").status); }
{ const { A } = mk(); const ids = idsOf(A, "Fluids"); const cs = [...conceptsOf(A, ids)];
  cs.slice(0, 4).map(c => ids.find(id => A.META.c[id][1] === c)).forEach(id => setH(A, id, [[70, "good"], [67, "good"], [56, "good"], [21, "good"]], iso(-60)));
  ok("D11 repeated success across meaningful gaps: strong", sub(A, "Fluids").status === "strong", sub(A, "Fluids").status);
  ok("D12 a strong subtopic with nothing overdue isn't a priority", !A.dashModel().top.some(s => s.name === "Fluids")); }
{ const { A } = mk(); const ids = idsOf(A, "Fluids"); const cs = [...conceptsOf(A, ids)];
  cs.slice(0, 4).map(c => ids.find(id => A.META.c[id][1] === c)).forEach(id => setH(A, id, [[30, "good"], [20, "hard"], [10, "good"], [3, "again"]]));
  ok("D13 mixed results below 75%: emerging weakness", sub(A, "Fluids").status === "emerging", `${sub(A, "Fluids").status} rate ${sub(A, "Fluids").rate}`); }
{ const { A } = mk(); const ids = idsOf(A, "Fluids");
  const nopress = A.dashModel().subs.filter(s => !s.seen && s.priority > 0).length;
  A.progress.testDate = iso(-14);
  const press = A.dashModel(), unseenTop = press.top.filter(s => !s.seen);
  ok("D14 with the MCAT 2 weeks away, heavily tested unseen subtopics become priorities (not before)", nopress === 0 && unseenTop.length > 0 && unseenTop.every(s => s.weight >= 10), unseenTop.map(s => s.name).join(", ")); }
{ const { A } = mk(); const m0 = A.dashModel();
  ok("D15 thermometers start at stage 0 for every section", m0.secs.every(x => x.stage === 0) && m0.overallStage === 0);
  A.CARDS.filter(c => c[0] === "bb").forEach(c => setH(A, c[3], [[30, "good"], [20, "good"], [6, "good"]]));
  const m1 = A.dashModel(), bb = m1.secs.find(x => x.k === "bb");
  ok("D16 lots of time-separated evidence across Bio/Biochem fills its thermometer; others stay empty", bb.stage === 4 && m1.secs.filter(x => x.k !== "bb").every(x => x.stage === 0)); }
{ const { A } = mk(); const ids = idsOf(A, "Fluids").slice(0, 3); setH(A, ids[0], [[5, "again"]]);
  A.startFocus(ids, "Fluids: practice"); A.start(true);
  ok("D17 a recommendation opens a session of exactly those cards, missed first", A.deck.length === 3 && A.deck.every(k => ids.includes(A.idOf(k))) && A.idOf(A.deck[0]) === ids[0]);
  ok("D18 ...named after the recommendation", A.progress.open.focus.label === "Fluids: practice"); }
{ const { h, A } = mk(); const ids = idsOf(A, "Fluids"); const cs = [...conceptsOf(A, ids)];
  cs.slice(0, 4).map(c => ids.find(id => A.META.c[id][1] === c)).forEach(id => setH(A, id, [[30, "good"], [25, "again"], [20, "again"], [12, "again"], [6, "again"], [2, "again"]]));
  A.openSide("weakdash"); const html = h.els.screen.innerHTML;
  ok("D19 the screen labels everything as estimates from grades", html.includes("These are estimates, not practice-question scores") && html.includes("graded"));
  ok("D20 thermometer text explains it's evidence, not ability", html.includes("Keep studying! As you review more concepts") && html.includes("not how well you're doing") && !html.includes("1–10 confidence"));
  ok("D21 progress tiles: mastered, coverage, retention, due; plus activity line", html.includes("cards mastered") && html.includes("MCAT concepts covered") && html.includes("held up after a day+") && html.includes("cards due now") && html.includes("Time is shown for reference"));
  ok("D22 no exact evidence percentage is shown on the thermometers", !/th-word">\d+%/.test(html)); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
