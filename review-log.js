/* Review events: one permanent row per rating, for learning research (Supabase table review_events, docs/review-events.sql).
   The study progress record is built for scheduling (it keeps the newest 50 ratings per card, and an undo removes one);
   this log keeps every rating, plus what the progress record doesn't: the session, where the grade came from, whether it
   was disputed, how long each step took, the interval and due date the scheduler gave, and the scheduler version.
   - Append-only: students can add their own rows and read them back; nothing is ever changed. An undo adds an "undo" row.
   - No written answers here (they stay in the student's progress), no device identifiers.
   - Timings are measured in the browser: card shown -> flipped -> Next Card -> Save and Next Card. Unknown = null.
   - Rows that can't be sent (offline, table not created yet) wait on this device and are sent later (up to 500).
   To switch logging off, set ON to false. */
(() => {
  'use strict';
  const ON = true;
  const SCHEDULER = 'tabiprep-fsrs-2026.10';   // change when the scheduling rules change, so events can be grouped by version
  const QUEUE = 'tabi-review-queue', MAX_QUEUE = 500, MAX_MS = 2 * 3600e3;
  const now = () => Date.now();
  const rid = () => (crypto.randomUUID ? crypto.randomUUID() : now().toString(36) + Math.random().toString(36).slice(2));
  let card = null;   // { key, shown, flipped, popup, grade:{source, disputed, retired} }
  let waitUntil = 0;   // the table isn't there yet: keep rows on this device and try again in 5 minutes

  // ---- timing: watch which card is up and when it's flipped ----
  function watch(){
    if(typeof mode === 'undefined' || mode !== 'cards' || !curKey){ return; }
    if(!card || card.key !== curKey) card = { key:curKey, shown: revealed ? null : now(), flipped: null, popup: null, grade: null };   // a card restored already flipped has no start time
    if(revealed && !card.flipped) card.flipped = now();
  }
  const span = (a, b) => (a && b && b >= a && b - a <= MAX_MS) ? b - a : null;

  // ---- queue ----
  const load = () => { try { const q = JSON.parse(localStorage.getItem(QUEUE) || '[]'); return Array.isArray(q) ? q : []; } catch(e){ return []; } };
  const store = q => { try { localStorage.setItem(QUEUE, JSON.stringify(q.slice(-MAX_QUEUE))); } catch(e){} };
  let sending = false;
  async function flush(){
    if(!ON || sending || now() < waitUntil || typeof sbUser === 'undefined' || !sbUser || !sb) return;
    const mine = load().filter(e => e.user_id === sbUser.id);
    if(!mine.length) return;
    sending = true;
    try {
      const rows = mine.slice(0, 100).map(({ user_id, ...row }) => row);   // user_id comes from the session on the server
      const { error } = await sb.from('review_events').upsert(rows, { onConflict:'event_id', ignoreDuplicates:true });   // a resend after a lost reply isn't counted twice
      if(error){ if(/PGRST205|42P01|does not exist|schema cache/i.test((error.code || '') + ' ' + (error.message || ''))) waitUntil = now() + 5 * 60e3; return; }
      const sent = new Set(mine.slice(0, 100).map(e => e.event_id));
      store(load().filter(e => !sent.has(e.event_id)));
      if(mine.length > 100) setTimeout(flush, 1000);
    } catch(e){}
    finally { sending = false; }
  }
  function push(row){
    if(!ON || typeof sbUser === 'undefined' || !sbUser) return;   // signed-out practice isn't logged
    const q = load(); q.push(Object.assign({ event_id:rid(), user_id:sbUser.id, client_at:new Date().toISOString() }, row)); store(q);
    flush();
  }
  function sessionId(o){ if(!o) return null; if(!o.sid){ o.sid = rid(); } return o.sid; }   // saved with the open session, so a reload keeps the same id

  window.TabiReviewLog = {
    on: ON, scheduler: SCHEDULER,
    popupOpened(key){ watch(); if(card && card.key === key && !card.popup) card.popup = now(); },
    noteGrade(key, g){ if(card && card.key === key) card.grade = Object.assign({}, card.grade, g); },
    // Called by answer() right after the rating is recorded (so the new interval and due date are known).
    reviewed(key, r, info){
      watch();
      const c = card && card.key === key ? card : { shown:null, flipped:null, popup:null, grade:null }, t = now(), x = info.extra || {};
      const s = typeof st === 'function' ? st(key) : null;
      push({
        kind: 'review', card_key: key, imported: typeof isImported === 'function' && isImported(idOf(key)),
        topic: info.topic || null, session_id: sessionId(info.session),
        grade: r, source: (c.grade && c.grade.source) || 'self', disputed: !!(c.grade && c.grade.disputed), retired: !!(c.grade && c.grade.retired),
        boost: !!info.boost, practice: !!x.e, skipped_writing: !!x.k, wrote_after: !!info.written, wrote_before: !!x.p, confidence: x.c || null,
        ms_to_flip: span(c.shown, c.flipped), ms_to_next: span(c.flipped, c.popup), ms_in_popup: span(c.popup, t),
        interval_days: s && Number.isFinite(s.interval) ? s.interval : null, due: s && s.due || null, scheduler: SCHEDULER
      });
      card = null;
    },
    undone(key){ push({ kind:'undo', card_key:key, scheduler:SCHEDULER }); card = null; },
    flush, pending: () => load().length
  };
  if(!ON) return;
  const base = render;
  render = function(){ base(); watch(); };
  addEventListener('online', flush);
  setInterval(flush, 60e3);
  setTimeout(flush, 3000);   // anything left from an earlier visit
})();
