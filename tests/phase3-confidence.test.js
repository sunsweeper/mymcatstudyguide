// Package 2, Phase 3: confidence before the reveal, saved with the rating; calibration summary.
const boot = require('./harness.js');
let pass=0, fail=0; const ok=(n,c,x="")=>{ if(c){pass++;console.log("PASS",n,x);} else {fail++;console.log("FAIL",n,x);} };
const fresh = () => { const h = boot(); const A = h.api; A.setView("q"); A.pick("bb"); A.start(true); return { h, A, k:A.curKey }; };
{ const { h, A, k } = fresh();
  ok("CF1 nothing is preselected", A.conf === null);
  A.setConf(7); ok("CF2 picking a number sets it", A.conf === 7);
  A.setConf(7); ok("CF3 tapping the chosen number again clears it (optional)", A.conf === null);
  A.setConf(9); A.reveal(); A.setConf(2);
  ok("CF4 it can't be changed after the answer is revealed", A.conf === 9);
  A.chooseRating("good");
  ok("CF5 it's saved with that rating (the retrieval attempt)", A.st(k).history.slice(-1)[0].c === 9);
  ok("CF6 the next card starts with nothing selected", A.conf === null && h.els.confRow.hidden === false); }
{ const { h, A, k } = fresh(); A.reveal(); A.chooseRating("good");
  ok("CF7 skipping it is fine: no confidence is recorded", A.st(k).history.slice(-1)[0].c === undefined); }
{ const a = fresh(), b = fresh();
  a.A.setConf(10); a.A.reveal(); a.A.chooseRating("good");
  b.A.reveal(); b.A.chooseRating("good");
  ok("CF8 confidence never changes the schedule", a.A.st(a.k).due === b.A.st(b.k).due || Math.abs(a.A.st(a.k).interval - b.A.st(b.k).interval) <= 1); }
{ const { h, A, k } = fresh(); A.setConf(4);
  const h2 = boot({ store:h.store }); const B = h2.api; B.pick("bb"); B.start();
  ok("CF9 a picked number survives a refresh before the reveal", B.conf === 4 && B.curKey === k); }
{ const { h, A } = fresh();
  ok("CF10 calibration waits for at least 10 rated cards", A.confidenceStats().n === 0 && A.calibrationHTML().includes("After 10 or more"));
  const cards = A.CARDS.slice(0, 50).map(c => c[3]);
  cards.forEach((id, i) => { A.progress.cards[id] = { status:"review", writing:false, last:"2026-10-20", due:"2026-10-30", interval:3, reps:1, total:1, good:1, bad:0,
    history:[{ d:"2026-10-20", r: i < 20 ? (i % 4 ? "good" : "again") : i < 35 ? "hard" : (i % 3 ? "again" : "good"), t:i + 1, c: i < 20 ? 9 : i < 35 ? 5 : 2 }] }; });
  const c = A.confidenceStats();
  ok("CF11 bands count confidence 8–10, 4–7, 1–3", c.n === 50 && c.high.n === 20 && c.mid.n === 15 && c.low.n === 15);
  ok("CF12 surprises: sure-but-didn't-know and unsure-but-knew", c.surprises.highMiss === 5 && c.surprises.lowKnew === 5, JSON.stringify(c.surprises));
  const html = A.calibrationHTML();
  ok("CF13 the summary is labeled as self-rated, not graded", html.includes("not with graded answers") && html.includes("neither is a score"));
  ok("CF14 with 40+ ratings a trend line appears", c.trend !== null && /Lately|stayed about the same/.test(html));
  A.show("weakdash"); ok("CF15 it shows on My Weaknesses", h.els.screen.innerHTML.includes("Confidence check")); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
