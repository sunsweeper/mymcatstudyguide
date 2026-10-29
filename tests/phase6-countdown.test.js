// Package 2, Phase 6: MCAT countdown and MCAT date settings.
const boot = require('./harness.js');
let pass=0, fail=0; const ok=(n,c,x="")=>{ if(c){pass++;console.log("PASS",n,x);} else {fail++;console.log("FAIL",n,x);} };
const T0 = new Date(2026, 9, 22, 10, 0, 0).getTime();   // Oct 22, 2026, 10:00 local
const cd = h => h.els.countdown.hidden ? null : (h.els.cdN.textContent ? h.els.cdN.textContent + " " : "") + h.els.cdL.textContent;
const mk = () => { const h = boot({ clock:T0 }); h.api.show("welcome"); return { h, A:h.api }; };
{ const { h, A } = mk();
  ok("C1 no MCAT date: no countdown", cd(h) === null);
  ok("C2 ...and the home page offers to add one", h.els.screen.innerHTML.includes('id="addDate"'));
  A.progress.mcatNone = true; A.show("welcome");
  ok("C3 declined ('not scheduled yet'): no countdown and no nagging line", cd(h) === null && !h.els.screen.innerHTML.includes('id="addDate"')); }
{ const { h, A } = mk(); A.saveDate("2026-11-28", false);
  ok("C4 a date 37 calendar days away shows '37 Days Until Your MCAT'", cd(h) === "37 Days Until Your MCAT", cd(h));
  ok("C5 screen readers hear it and that it opens the date settings", /37 Days Until Your MCAT\. Open MCAT date settings\./.test(h.els.countdown.attrs["aria-label"])); }
{ const { h, A } = mk(); A.saveDate("2026-10-23", false); ok("C6 one day away: singular", cd(h) === "1 Day Until Your MCAT", cd(h)); }
{ const { h, A } = mk(); A.progress.testDate = "2026-10-22"; A.renderCountdown();
  ok("C7 on the exam date it says 'MCAT Day'", cd(h) === "MCAT Day" && /day/.test(h.els.countdown.className)); }
{ const { h, A } = mk(); A.progress.testDate = "2026-10-01"; A.renderCountdown();
  ok("C8 after the exam it asks for an updated date instead of counting", cd(h) === "Update your MCAT date"); }
{ const { h, A } = mk(); A.saveDate("2026-10-25", false);
  ok("C9 3 days left at 10am", cd(h) === "3 Days Until Your MCAT");
  h.advanceMs(13 * 3600e3 + 59 * 60e3); A.renderCountdown();
  ok("C10 still 3 at 11:59pm (calendar days, not 24-hour periods)", cd(h) === "3 Days Until Your MCAT", cd(h));
  h.advanceMs(2 * 60e3); A.renderCountdown();
  ok("C11 2 at 12:01am", cd(h) === "2 Days Until Your MCAT", cd(h)); }
{ const { h, A } = mk(); A.saveDate("2026-12-31", false); h.els.countdown.onclick();
  ok("C12 clicking the countdown opens MCAT date settings", A.mode === "mcatdate" && h.els.screen.innerHTML.includes("MCAT test date") && h.els.screen.innerHTML.includes('value="2026-12-31"'));
  A.saveDate("2026-11-21", false);
  ok("C13 saving a new date updates the countdown immediately and returns to the dashboard", cd(h) === "30 Days Until Your MCAT" && A.mode === "welcome");
  ok("C14 ...and reviews are re-capped to the new date (half the days left)", A.testCap() === 15);
  h.els.countdown.onclick();
  ok("C15 a bad date is refused with a clear message", A.saveDate("2020-01-01", false) === false && h.els.screen.innerHTML.includes("between today and three years") && A.progress.testDate === "2026-11-21");
  A.saveDate("", true);
  ok("C16 'not scheduled yet' removes the date and the countdown", !A.progress.testDate && A.progress.mcatNone === true && cd(h) === null); }
{ const { h, A } = mk(); A.saveDate("2026-11-28", false); A.pick("bb"); A.start(true);
  ok("C17 the countdown stays up during study sessions", cd(h) === "37 Days Until Your MCAT" && A.mode === "cards"); }
{ const { h, A } = mk(); A.saveDate("2026-11-28", false);
  const h2 = boot({ clock:T0, store:h.store }); h2.api.show("welcome");
  ok("C18 the date is saved (survives a reload) and synced with her progress", cd(h2) === "37 Days Until Your MCAT" && JSON.parse(h.store["mcat-progress-v2"]).testDate === "2026-11-28"); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
