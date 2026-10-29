// Mandatory Response and the Notes / My Written Answers workspace (interface update, Oct 25 2026).
const boot = require('./harness.js');
let pass=0, fail=0; const ok=(n,c,x="")=>{ if(c){pass++;console.log("PASS",n,x);} else {fail++;console.log("FAIL",n,x);} };
const setCard = (A, k, hist) => { A.progress.cards[k] = { status:"learning", writing:true, last:hist[hist.length-1].d, due:"2026-10-20", interval:0, reps:0, total:hist.length, good:0, bad:1, history:hist.map((e,i)=>Object.assign({ t:i+1 }, e)) }; };
const missed = [{ d:"2026-10-20", r:"again" }];
const firstFwd = A => { A.setView("q"); A.pick("bb"); A.start(true); return A.curKey; };
const type = (h, id, v) => h.els[id].oninput({ target:{ value:v } });
const popup = h => h.els.askModal.hidden === false ? h.els.askText.textContent : null;
const fresh = (opts) => { const h = boot(opts); const A = h.api; const k = firstFwd(A); return { h, A, k }; };
const prep = (hist, opts) => { const r = fresh(opts); setCard(r.A, r.k, hist); r.A.resetCard(); r.A.show("cards"); return r; };

/* Which cards need a written answer before the flip */
{ const { h, A } = fresh();
  ok("M1 a new card: workspace on Notes, flips with nothing written", h.els.tabNotes.attrs["aria-selected"]==="true" && h.els.panelAns.hidden===true && (A.reveal(), A.revealed===true)); }
{ const { h, A } = prep(missed);
  ok("M2 a card marked Didn't know opens on My Written Answers with Reveal disabled", h.els.tabAns.attrs["aria-selected"]==="true" && h.els.panelAns.hidden===false && h.els.reveal.disabled===true);
  A.reveal(); ok("M3 ...won't flip until she writes", A.revealed===false && h.focused()==="curAnswer");
  type(h, "curAnswer", "my answer"); ok("M4 ...typing in Current Answer unlocks Reveal", h.els.reveal.disabled===false);
  A.reveal(); ok("M5 ...and it flips", A.revealed===true); }
{ const { h, A } = prep([{ d:"2026-10-20", r:"hard" }]);
  A.reveal(); ok("M6 a card only ever marked Struggled flips freely", A.revealed===true); }
{ const { h, A, k } = prep([{ d:"2026-10-18", r:"again" }, { d:"2026-10-20", r:"good" }]);
  ok("M7 after a miss, a Got it alone doesn't end the requirement (not mastered yet)", h.els.reveal.disabled===true && A.levelOf(k)!=="mastered"); }
{ const { h, A, k } = prep([{ d:"2026-05-01", r:"again" }, { d:"2026-05-02", r:"good" }, { d:"2026-05-05", r:"good" }, { d:"2026-05-16", r:"good" }, { d:"2026-06-20", r:"good" }, { d:"2026-09-20", r:"good" }]);
  ok("M8 once the card is Mastered, writing before the flip is no longer required", A.levelOf(k)==="mastered" && h.els.reveal.disabled===false, A.levelOf(k)); }
{ const { h, A, k } = prep([{ d:"2026-05-01", r:"again" }, { d:"2026-05-02", r:"good" }, { d:"2026-05-05", r:"good" }, { d:"2026-05-16", r:"good" }, { d:"2026-06-20", r:"good" }, { d:"2026-09-20", r:"good" }, { d:"2026-10-20", r:"again" }]);
  ok("M9 a mastered card missed again needs writing again", h.els.reveal.disabled===true); }

/* The switch */
{ const { h, A, k } = prep(missed);
  ok("M10 Mandatory Response switch is on by default", h.els.mandToggle.attrs["aria-pressed"]==="true");
  h.els.mandToggle.onclick();
  ok("M11 turning it off: Reveal works without writing", h.els.mandToggle.attrs["aria-pressed"]==="false" && h.els.reveal.disabled===false && (A.reveal(), A.revealed===true));
  ok("M12 the setting is saved", JSON.parse(h.store["mcat-progress-v2"]).mandOff===true);
  const pos0 = A.pos; A.chooseRating("good");
  ok("M13 leaving without the required answer asks 'Continue anyway?'", popup(h)==="You didn't type the mandatory response for this card. Continue anyway?" && A.pos===pos0);
  h.els.askNo.onclick();
  ok("M14 No: stays on the card, My Written Answers open, cursor in Current Answer", A.pos===pos0 && h.els.askModal.hidden===true && h.els.tabAns.attrs["aria-selected"]==="true" && h.focused()==="curAnswer");
  A.chooseRating("good"); h.els.askYes.onclick();
  const e = A.st(k).history.slice(-1)[0];
  ok("M15 Yes: moves on; the rating is saved and marked as a skipped response", A.pos===pos0+1 && e.r==="good" && e.k===1);
  ok("M16 ...and the requirement is still there for next time", A.memOf(k).needs===true);
  const h2 = boot({ store:h.store }); const B = h2.api; const k2 = firstFwd(B); setCard(B, k2, missed); B.resetCard(); B.show("cards");
  ok("M17 the switch stays off on the next visit", h2.els.mandToggle.attrs["aria-pressed"]==="false" && h2.els.reveal.disabled===false);
  h2.els.mandToggle.onclick(); ok("M18 turning it back on restores the requirement", h2.els.reveal.disabled===true); }
{ const h = boot({ store:{ "mcat-progress-v2": JSON.stringify({ cards:{}, newDay:{date:"",count:0}, open:{}, skipWrite:true }) } }); const A = h.api; firstFwd(A);
  ok("M19 someone who had 'Skip writing before flip' on starts with Mandatory Response off", h.els.mandToggle.attrs["aria-pressed"]==="false"); }

/* After Struggled / Didn't know */
{ const { h, A, k } = fresh(); A.reveal(); A.chooseRating("hard");
  ok("M20 Struggled opens My Written Answers with the cursor in Current Answer", h.els.tabAns.attrs["aria-selected"]==="true" && h.focused()==="curAnswer" && A.pendingR==="hard");
  ok("M21 ...Next card stays disabled while the box is empty (switch on)", h.els.curNext.hidden===false && h.els.curNext.disabled===true);
  type(h, "curAnswer", "It is the powerhouse of the cell."); A.submitReinforce();
  const e = A.st(k).history.slice(-1)[0];
  ok("M22 ...any written answer: saved with the rating, no skip mark", e.r==="hard" && e.w==="It is the powerhouse of the cell." && !e.k); }
{ const { h, A, k } = fresh(); h.els.mandToggle.onclick(); A.reveal(); A.chooseRating("again");
  ok("M23 switch off: Next card is enabled even when empty", h.els.curNext.disabled===false);
  const pos0 = A.pos; A.submitReinforce();
  ok("M24 ...but leaving it empty asks 'Continue anyway?'", !!popup(h) && A.pos===pos0);
  h.els.askYes.onclick(); const e = A.st(k).history.slice(-1)[0];
  ok("M25 ...Yes saves the rating, marked as skipped", e.r==="again" && !e.w && e.k===1 && A.pos===pos0+1);
  ok("M26 the skipped attempt doesn't remove the requirement next time", A.memOf(k).needs===true); }

/* Written answers: saved and hidden until the flip */
{ const { h, A, k } = fresh(); A.openRecall();
  ok("M27 Active Recall opens My Written Answers with the cursor in Current Answer", h.els.tabAns.attrs["aria-selected"]==="true" && h.focused()==="curAnswer");
  type(h, "curAnswer", "I think it's glycolysis."); A.reveal(); A.chooseRating("good");
  const e = A.st(k).history.slice(-1)[0];
  ok("M28 what she typed before the reveal is saved with the rating", e.p==="I think it's glycolysis."); }
{ const { h, A, k } = prep([{ d:"2026-10-18", r:"again", w:"SECRET-ANSWER-AFTER", p:"SECRET-BEFORE" }, { d:"2026-10-20", r:"good" }]);
  ok("M29 before the reveal, previous answers are covered and not in the page", h.els.prevList.innerHTML.includes("appear after you reveal") && !h.els.prevList.innerHTML.includes("SECRET"));
  h.els.tabNotes.onclick(); h.els.tabAns.onclick();
  ok("M30 switching tabs doesn't uncover them, flip the card, or rate it", !h.els.prevList.innerHTML.includes("SECRET") && A.revealed===false && A.st(k).history.length===2);
  type(h, "curAnswer", "new try"); A.reveal();
  ok("M31 after the reveal they're shown, newest first, with dates", h.els.prevList.innerHTML.indexOf("SECRET-ANSWER-AFTER") > -1 && h.els.prevList.innerHTML.indexOf("SECRET-ANSWER-AFTER") < h.els.prevList.innerHTML.indexOf("SECRET-BEFORE") && /Oct 18/.test(h.els.prevList.innerHTML)); }

/* Notes */
{ const { h, A, k } = fresh(); const id = A.idOf(k); A.progress.notes[id] = "SECRET-NOTE"; A.resetCard(); A.show("cards");
  ok("M32 before the reveal, a saved note is covered and not in the page", h.els.noteLock.hidden===false && h.els.noteText.hidden===true && h.els.noteText.value==="");
  A.reveal(); ok("M33 after the reveal it's there to edit", h.els.noteText.hidden===false && h.els.noteText.value==="SECRET-NOTE");
  type(h, "noteText", "SECRET-NOTE plus more");
  ok("M34 only adding text: no Save link (it saves itself)", h.els.noteSaveLink.hidden===true);
  const n0 = A.st(k) ? A.st(k).history.length : 0; A.chooseRating("good");
  ok("M35 ...and it's saved when she moves on, without a popup", A.progress.notes[id]==="SECRET-NOTE plus more" && h.els.askModal.hidden===true);
  ok("M36 notes don't change the card's schedule (only the Got it did)", n0 + 1 === A.st(k).history.length && !A.st(k).history.slice(-1)[0].w); }
{ const { h, A, k } = fresh(); const id = A.idOf(k); A.progress.notes[id] = "Original note"; A.resetCard(); A.show("cards"); A.reveal();
  type(h, "noteText", "Changed note");
  ok("M37 changing saved text shows 'Save note' and doesn't autosave", h.els.noteSaveLink.hidden===false && A.progress.notes[id]==="Original note");
  const pos0 = A.pos; A.chooseRating("good");
  ok("M38 moving on asks 'Save the changes to your note?'", popup(h)==="Save the changes to your note?" && A.pos===pos0);
  h.els.askNo.onclick();
  ok("M39 Discard keeps the old note and moves on", A.progress.notes[id]==="Original note" && A.pos===pos0+1); }
{ const { h, A, k } = fresh(); const id = A.idOf(k); A.progress.notes[id] = "Original note"; A.resetCard(); A.show("cards"); A.reveal();
  type(h, "noteText", "Rewritten"); A.chooseRating("good"); h.els.askYes.onclick();
  ok("M40 Save keeps the change", A.progress.notes[id]==="Rewritten"); }
{ const { h, A, k } = fresh(); const id = A.idOf(k); A.progress.notes[id] = "Original note"; A.resetCard(); A.show("cards"); A.reveal();
  type(h, "noteText", ""); h.els.noteSaveLink.onclick();
  ok("M41 saving an empty note asks to delete it first", popup(h)==="Delete your note for this card?" && A.progress.notes[id]==="Original note");
  h.els.askYes.onclick(); ok("M42 Delete removes it", A.progress.notes[id]===undefined); }
{ const { h, A, k } = fresh(); A.reveal(); h.els.tabAns.onclick(); h.els.noteLink.onclick();
  ok("M43 Write Card Note switches to Notes and puts the cursor in it", h.els.tabNotes.attrs["aria-selected"]==="true" && h.focused()==="noteText"); }
{ const { h, A, k } = fresh(); const id = A.idOf(k); A.reveal(); type(h, "noteText", "half-typed note"); A.chooseRating("again");
  ok("M44 typing a note, then Didn't know: note kept, rating kept, My Written Answers opens", h.els.noteText.value==="half-typed note" && A.pendingR==="again" && h.els.tabAns.attrs["aria-selected"]==="true");
  type(h, "curAnswer", "A full written answer here."); A.submitReinforce();
  ok("M45 ...and the note is saved when she moves on", A.progress.notes[id]==="half-typed note"); }
{ const { h, A } = fresh(); A.reveal(); type(h, "noteText", "x"); const id = A.idOf(A.curKey); A.progress.notes[id] = "y"; type(h, "noteText", "z"); A.chooseRating("good");
  h.sb._key({ key:"Escape", preventDefault(){} });
  ok("M46 Escape closes the popup as 'No' (Discard)", h.els.askModal.hidden===true && A.progress.notes[id]==="y"); }

/* Unfinished writing survives a refresh */
const reload = (h, topic="bb") => { const h2 = boot({ store:h.store }); const B = h2.api; B.pick(topic); B.start(); return h2; };
{ const { h, A, k } = fresh(); A.reveal(); A.chooseRating("hard"); type(h, "curAnswer", "Half of my written ans");
  const h2 = reload(h), B = h2.api;
  ok("R1 refresh after Struggled: same card, still revealed, Struggled still chosen, text back in Current Answer", B.curKey===k && B.revealed===true && B.pendingR==="hard" && h2.els.curAnswer.value==="Half of my written ans" && h2.els.tabAns.attrs["aria-selected"]==="true");
  type(h2, "curAnswer", "Half of my written answer, finished."); B.submitReinforce();
  ok("R2 ...she can finish and submit it normally", B.st(k).history.slice(-1)[0].w==="Half of my written answer, finished." && B.curKey!==k);
  ok("R3 ...and the saved draft is cleared once the card is done", !B.progress.open.bb.draft || B.progress.open.bb.draft.key!==k); }
{ const { h, A, k } = prep(missed); type(h, "curAnswer", "before reveal draft");
  const h2 = reload(h), B = h2.api;
  ok("R4 refresh before revealing: her typed answer is back and Reveal is unlocked", B.curKey===k && B.revealed===false && h2.els.curAnswer.value==="before reveal draft" && h2.els.reveal.disabled===false); }
{ const { h, A, k } = fresh(); const id = A.idOf(k); A.progress.notes[id] = "Original note"; A.resetCard(); A.show("cards"); A.reveal(); type(h, "noteText", "Changed note text");
  const h2 = reload(h), B = h2.api;
  ok("R5 refresh with an unsaved note change: the change is back, not yet saved", h2.els.noteText.value==="Changed note text" && B.progress.notes[id]==="Original note" && h2.els.noteSaveLink.hidden===false);
  B.chooseRating("good");
  ok("R6 ...and moving on still asks Save / Discard", h2.els.askModal.hidden===false && h2.els.askText.textContent==="Save the changes to your note?"); }
{ const { h, A, k } = fresh(); const id = A.idOf(k); A.reveal(); type(h, "noteText", "typing a note"); h.els.reportBtn.onclick();
  ok("R7 opening Report this card doesn't touch a note being typed", h.els.reportBox.hidden===false && h.els.noteText.value==="typing a note");
  h.els.reportCancel.onclick(); ok("R8 ...nor does closing it", h.els.noteText.value==="typing a note"); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
