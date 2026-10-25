// Runs the site's script from ../index.html in Node with a minimal browser stand-in.
// Minimal browser stand-in so the page script runs in Node.
module.exports = function boot(opts = {}){
  const store = opts.store || {};
  let failSave = !!opts.failSave;
  const ls = { getItem:k=>store[k]??null, setItem:(k,v)=>{ if(failSave) throw new Error("quota"); store[k]=String(v); }, removeItem:k=>{ if(failSave) throw new Error("x"); delete store[k]; } };
  const els = {}; let focused = null;
  const mk = id => ({ id, style:{}, hidden:false, disabled:false, value:"", innerHTML:"", textContent:"", tabIndex:0, attrs:{},
    setAttribute(k,v){ this.attrs[k]=v; }, querySelector(){ return { textContent:"" }; }, querySelectorAll(){ return []; },
    focus(){ focused = this.id; }, click(){ if(this.onclickHook) this.onclickHook(); } });
  const el = id => els[id] || (els[id] = mk(id));
  const viewBtns = ["q","a","mix"].map(v => Object.assign(mk("view-"+v), { dataset:{ v } }));
  const rateBtns = ["again","hard","good"].map(r => Object.assign(mk("rate-"+r), { dataset:{ r } }));
  let clock = opts.clock || Date.now();
  const RD = Date;
  class FakeDate extends RD { constructor(...a){ if(a.length) super(...a); else super(clock); } static now(){ return clock; } }
  const downloads = [];
  const sandbox = {
    localStorage: ls,
    document: { hidden:false, documentElement: { attrs:{}, setAttribute(k,v){ this.attrs[k]=v; } }, getElementById: el, querySelectorAll: sel => sel.includes("#view") ? viewBtns : sel.includes("#rateRow") ? rateBtns : [],
      addEventListener(t, f){ if(t==="keydown") sandbox._key = f; }, createElement: () => ({ click(){ downloads.push(this.download); }, remove(){} }), body:{ appendChild(){} } },
    window: Object.assign({ matchMedia: () => ({ matches:true }), addEventListener(){} }, opts.supabase ? { supabase: opts.supabase } : {}),
    location: Object.assign({ hash:'', origin:'https://mymcatstudyguide.vercel.app', pathname:'/', search:'' }, opts.location || {}),
    history: { replaceState(){} },
    Blob: class { constructor(p){ this.text = p.join(""); } },
    URL: { createObjectURL: b => { sandbox._lastBlob = b; return "blob:x"; }, revokeObjectURL(){} },
    FileReader: class { readAsText(f){ this.result = f.text; this.onload(); } },
    _mk: el,
    setInterval: () => 0,
    setTimeout: (f, ms) => { if(!ms || ms < 1000) f(); return 1; },
    fetch: async (url, init) => { (sandbox._sent = sandbox._sent || []).push({ url, body: JSON.parse(init.body) }); if(opts.fetchFail) throw new Error('offline'); return { ok: !opts.fetchBad, json: async () => ({ success: opts.fetchBad ? 'false' : 'true' }) }; },
    Date: FakeDate,
  };
  const page = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
  const src = page.split('<script>')[1].split('</script>')[0];   // the page's own script
  const fn = new Function(...Object.keys(sandbox), src + `
    if(typeof process !== 'undefined' && process.env.SCHED) RULES.scheduler = process.env.SCHED;
    return { buildFocus, interleave, conceptOf, subOf, nearDup, isFamiliar, pickReinforce, dashModel, categoryStatus, subActions, startFocus, META, cardFacts, retentionTrend, setConf, confidenceStats, calibrationHTML, get conf(){ return conf; }, resetCard, rate, memOf, levelOf, cardLevel, memoryFrom, pickBoost, maybeCelebrate, fsrsInterval, fsrsDays, MASTERY, get filter(){ return filter; }, get progress(){ return progress; }, set progress(v){ progress = v; }, CARDS, REVERSE, BY_ID, RULES, SECTIONS, CATEGORIES,
      pick, start, answer, reveal, mergeProgress, flushActivity, heartbeat, set lastActFlush(v){ lastActFlush = v; }, pushProgress, logOut, loadOwner, get sbUser(){ return sbUser; }, get profile(){ return profile; }, get authView(){ return authView; }, get authMsg(){ return authMsg; }, get STORE(){ return STORE; }, get AUTH_ON(){ return AUTH_ON; }, get pendingAct(){ return pendingAct; }, openRecall, cancelRecall, openNoteModal, saveNote, cancelNote, confirmNo, confirmYes, openHelp, closeHelp, finishSession, persistPlace, validBackup, readRecovery, fmtClock, origKeys, pickReinforce, startRetry, endOfPass,
      get recallOpen(){ return recallOpen; }, get noteModalOpen(){ return noteModalOpen; }, get noteConfirm(){ return noteConfirm; }, get helpOpen(){ return helpOpen; }, get lastSummary(){ return lastSummary; }, tapCard, previousCard, tickTime, markActive, fmtTime, chooseRating, submitReinforce, sendReport, render, show, buildQueue, bucket, exportProgress, readImport, applyImport, setView,
      st, idOf, lastRating, seenCard, testCap, clampToTest, toggleBookmark, catStats, weakest, poolFor, openSide, goBack,
      get mode(){ return mode; }, get deck(){ return deck; }, get pos(){ return pos; }, get total(){ return total; },
      get curKey(){ return curKey; }, get revealed(){ return revealed; }, set draft(v){ draft = v; }, get flipped(){ return flipped; }, get pendingR(){ return pendingR; },
      get backupMsg(){ return backupMsg; }, get lastSaveOk(){ return lastSaveOk; } };`);
  const api = fn(...Object.values(sandbox));
  return { api, els, store, viewBtns, rateBtns, downloads, sb: sandbox,
    advanceDays(n){ clock += n*864e5; }, advanceMs(n){ clock += n; }, focused: () => focused, setFail(v){ failSave = v; } };
};
