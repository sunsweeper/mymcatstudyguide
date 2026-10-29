'use strict';
// Daily job (Vercel Cron): Rosalind's encouragement emails.
//   half:  halfway between sign-up and MCAT day, built from the student's own "why I began this journey" answer.
//   final: two days before the MCAT, the same, backed by how much they studied on TabiPrep.
// Each is sent once (once per test date for the final one). Students can opt out from a link in every email.
// Needs Vercel env vars: CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, ANTHROPIC_API_KEY.
const E = require('./_encourage');
const MAX_PER_RUN = 40;   // keeps one run well inside the function time limit; anyone left over is still due tomorrow

async function sb(path, opts = {}){
  const r = await fetch(E.SB_URL + path, { ...opts, headers: { ...E.admin(), 'Content-Type': 'application/json', ...(opts.headers || {}) }, signal: AbortSignal.timeout(10000) });
  if(!r.ok) throw new Error(`supabase ${r.status}`);
  return r.status === 204 ? null : r.json();
}
async function allUsers(){
  const out = [];
  for(let page = 1; page <= 50; page++){
    const d = await sb(`/auth/v1/admin/users?page=${page}&per_page=200`);
    const users = (d && d.users) || [];
    out.push(...users);
    if(users.length < 200) break;
  }
  return out;
}
async function write(kind, first, why, testDate, daysLeft, stats){
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal: AbortSignal.timeout(25000),
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: E.MODEL(), max_tokens: 700, system: E.SYSTEM, messages: [{ role: 'user', content: E.prompt(kind, first, why, testDate, daysLeft, stats) }] })
  });
  if(!r.ok) throw new Error(`anthropic ${r.status}`);
  const d = await r.json();
  const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
  if(text.length < 80 || text.length > 2500) throw new Error('bad length');
  return text;
}
async function send(to, subject, text, unsub){
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: E.FROM, to: [to], subject, text: `${text}\n\n—\nStop these encouragement emails: ${unsub}`, html: E.html(text, unsub),
      headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } })
  });
  if(!r.ok) throw new Error(`resend ${r.status}`);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if(!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`){ return res.status(401).json({ error: 'Unauthorized' }); }
  const missing = ['SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'ANTHROPIC_API_KEY'].filter(k => !process.env[k]);
  if(missing.length){ E.log('not_configured', { missing }); return res.status(503).json({ error: 'Not configured', missing }); }
  const dry = /(^|[?&])dry=1(&|$)/.test(String(req.url || '').split('?')[1] || '');
  const now = Date.now(), counts = { checked: 0, due: 0, sent: 0, failed: 0, skipped_no_answer: 0, opted_out: 0 };
  try {
    const users = await allUsers();
    for(const u of users){
      if(counts.sent + counts.failed >= MAX_PER_RUN) break;
      const meta = u.user_metadata || {};
      if(!u.email || !u.email_confirmed_at) continue;
      counts.checked++;
      if(meta.encourage_opt_out){ counts.opted_out++; continue; }
      const why = typeof meta.journey_why === 'string' ? meta.journey_why.trim().slice(0, 2000) : '';
      if(!why){ counts.skipped_no_answer++; continue; }
      const prog = await sb(`/rest/v1/progress?select=data&user_id=eq.${encodeURIComponent(u.id)}`);
      const data = (prog && prog[0] && prog[0].data) || {};
      const testDate = E.isDate(data.testDate) ? data.testDate : E.isDate(meta.mcat_date) ? meta.mcat_date : null;
      const kind = E.milestone(u, testDate, now);
      if(!kind) continue;
      counts.due++;
      if(dry) continue;
      try {
        const daysLeft = E.dayNum(testDate) - E.dayNum(E.todayStr(now));
        const stats = kind === 'final' ? E.studyStats(data, await sb(`/rest/v1/activity?select=day,cards,seconds&user_id=eq.${encodeURIComponent(u.id)}`)) : null;
        const first = String(meta.first_name || '').trim().slice(0, 40);
        const text = await write(kind, first, why, testDate, daysLeft, stats);
        const subject = kind === 'half' ? `${first ? first + ', you' : 'You'}’re halfway to your MCAT` : `Two days to your MCAT${first ? ', ' + first : ''}`;
        await send(u.email, subject, text, E.unsubscribeUrl(u.id));
        const sent = Object.assign({}, (u.app_metadata && u.app_metadata.encourage) || {}, kind === 'half' ? { half: new Date(now).toISOString() } : { final_for: testDate, final: new Date(now).toISOString() });
        await sb(`/auth/v1/admin/users/${encodeURIComponent(u.id)}`, { method: 'PUT', body: JSON.stringify({ app_metadata: { encourage: sent } }) });
        counts.sent++; E.log('sent', { kind, model: E.MODEL() });
      } catch(e){ counts.failed++; E.log('send_failed', { kind, error: String(e.message).slice(0, 80) }); }
    }
    E.log('run', { dry, ...counts });
    return res.status(200).json({ dry, ...counts });
  } catch(e){
    E.log('run_failed', { error: String(e.message).slice(0, 80) });
    return res.status(502).json({ error: 'Run failed' });
  }
};
