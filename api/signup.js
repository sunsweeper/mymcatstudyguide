'use strict';
// Private beta sign-up. Public sign-up is switched off in Supabase, so this is the only way to create an account:
// the invite code is checked here (never in the browser), only the first BETA_LIMIT people can redeem it, and the
// confirmation email (TabiPrep design) is sent from here through Resend.
// Needs Vercel env vars: SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY. Optional: BETA_CODE (default Sarah2028), BETA_LIMIT (default 25).
const E = require('./_encourage');   // shared Supabase admin headers, logging, site URL

const CODE = () => String(process.env.BETA_CODE || 'Sarah2028').trim().toLowerCase();
const LIMIT = () => Number(process.env.BETA_LIMIT || 25);
const log = (outcome, extra = {}) => console.log(JSON.stringify({ signup: outcome, ...extra }));   // never emails, names or answers
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

async function sb(path, opts = {}){
  const r = await fetch(E.SB_URL + path, { ...opts, headers: { ...E.admin(), 'Content-Type': 'application/json', ...(opts.headers || {}) }, signal: AbortSignal.timeout(10000) });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, body };
}
async function allUsers(){
  const out = [];
  for(let page = 1; page <= 20; page++){
    const r = await sb(`/auth/v1/admin/users?page=${page}&per_page=200`);
    if(!r.ok) throw new Error('list ' + r.status);
    const users = r.body.users || []; out.push(...users);
    if(users.length < 200) break;
  }
  return out;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function emailHtml(link){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TabiPrep</title></head>
<body style="margin:0;padding:0;background:#f6f1e7;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3ddd0;">
<tr><td align="center" style="background:#13241c;padding:22px 24px;"><img src="${E.SITE}/brand/tabiprep-logo-480.png" width="200" alt="TabiPrep.com" style="display:block;width:200px;height:auto;border:0;"></td></tr>
<tr><td style="padding:32px 32px 8px;font-family:Helvetica,Arial,sans-serif;color:#1d2f24;">
<h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:700;color:#13241c;">Welcome to TabiPrep</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b6254;">Thanks for joining the beta. Confirm your email to start studying.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#a8dcb5;"><a href="${esc(link)}" style="display:inline-block;padding:14px 26px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#13241c;text-decoration:none;border-radius:10px;">Confirm my email →</a></td></tr></table>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#5f7565;">Didn't sign up for TabiPrep? You can ignore this email.</p>
<p style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#8a9a8f;word-break:break-all;">Button not working? Paste this link into your browser:<br>${esc(link)}</p></td></tr>
<tr><td style="padding:24px 32px 28px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#8a9a8f;border-top:1px solid #eee8dc;"><span style="color:#b75c73;font-weight:700;">More learning per card, not more cards.</span><br>TabiPrep.com · Owned and operated by JSA Knowledge &amp; Cattle LLC</td></tr>
</table></td></tr></table></body></html>`;
}
// A one-time link that confirms the email and signs the student in on /login.
async function sendConfirm(email){
  const g = await sb('/auth/v1/admin/generate_link', { method: 'POST', body: JSON.stringify({ type: 'magiclink', email, redirect_to: E.SITE + '/login' }) });
  const link = g.body.action_link || (g.body.properties && g.body.properties.action_link);
  if(!g.ok || !link) throw new Error('link ' + g.status);
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: 'TabiPrep <no-reply@tabiprep.com>', to: [email], subject: 'Confirm your TabiPrep account', html: emailHtml(link), text: `Welcome to TabiPrep. Confirm your email to start studying: ${link}` }) });
  if(!r.ok) throw new Error('resend ' + r.status);
}
const recent = new Map();   // light per-instance throttle on resends
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if(req.method !== 'POST'){ res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if(req.headers.origin && ![`https://${req.headers.host}`, `http://${req.headers.host}`].includes(req.headers.origin)) return res.status(403).json({ error: 'Invalid origin' });
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY){ log('not_configured'); return res.status(503).json({ error: 'Sign-up isn’t available right now. Please try again later.' }); }
  let b = req.body; try { if(typeof b === 'string') b = JSON.parse(b); } catch { return res.status(400).json({ error: 'Invalid request' }); }
  b = b || {};
  const email = String(b.email || '').trim().toLowerCase();
  if(!EMAIL.test(email) || email.length > 254) return res.status(400).json({ error: 'Please enter a valid email address.' });
  try {
    // Resend the confirmation email for an account made here that isn't confirmed yet.
    if(b.resend){
      const last = recent.get(email) || 0; if(Date.now() - last < 60e3) return res.status(429).json({ error: 'Please wait a minute before sending another email.' });
      recent.set(email, Date.now());
      const u = (await allUsers()).find(x => (x.email || '').toLowerCase() === email);
      if(u && !u.email_confirmed_at && u.user_metadata && u.user_metadata.beta_code) await sendConfirm(email);
      log('resend'); return res.status(200).json({ ok: true });   // same answer either way, so it doesn't reveal who has an account
    }
    if(String(b.code || '').trim().toLowerCase() !== CODE()){ log('bad_code'); return res.status(403).json({ error: 'That invite code isn’t valid. TabiPrep is in a private beta for now.' }); }
    const first = String(b.first_name || '').trim().slice(0, 40), last = String(b.last_name || '').trim().slice(0, 40);
    const password = String(b.password || ''), why = String(b.journey_why || '').trim().slice(0, 2000);
    const noDate = !!b.mcat_unscheduled, mcat = noDate ? null : String(b.mcat_date || '');
    if(!first || !last) return res.status(400).json({ error: 'Please enter your first and last name.' });
    if(password.length < 8 || password.length > 72) return res.status(400).json({ error: 'Your password needs at least 8 characters.' });
    if(!noDate && !DATE.test(mcat)) return res.status(400).json({ error: 'Please enter your MCAT test date, or check “My MCAT date isn’t scheduled yet.”' });
    if(why.length < 10) return res.status(400).json({ error: 'Please tell us what brought you to this journey.' });
    if(!b.accepted_terms || !b.age_confirmed) return res.status(400).json({ error: 'Please confirm you’re 18 or older and agree to the Terms and Privacy Policy.' });
    const users = await allUsers();
    if(users.some(x => (x.email || '').toLowerCase() === email)) return res.status(409).json({ error: 'An account with this email already exists. Log in, or use “Forgot password?”.' });
    const used = users.filter(x => x.user_metadata && x.user_metadata.beta_code).length;
    if(used >= LIMIT()){ log('beta_full', { used }); return res.status(403).json({ error: 'Thanks for your interest! Our beta is full right now.' }); }
    const ref = b.referred_by && typeof b.referred_by === 'object' ? { first_name: String(b.referred_by.first_name || '').slice(0, 40), last_name: String(b.referred_by.last_name || '').slice(0, 40), email: String(b.referred_by.email || '').slice(0, 254) } : undefined;
    const meta = { first_name: first, last_name: last, mcat_date: mcat, mcat_unscheduled: noDate, journey_why: why, accepted_terms: true, age_confirmed: true, beta_code: true, beta_number: used + 1, ...(ref ? { referred_by: ref } : {}) };
    const c = await sb('/auth/v1/admin/users', { method: 'POST', body: JSON.stringify({ email, password, email_confirm: false, user_metadata: meta }) });
    if(!c.ok){ log('create_failed', { status: c.status }); return res.status(c.status === 422 ? 409 : 502).json({ error: c.status === 422 ? 'An account with this email already exists. Log in, or use “Forgot password?”.' : 'Your account couldn’t be created right now. Please try again.' }); }
    await sendConfirm(email);
    log('created', { beta_number: used + 1 });
    return res.status(200).json({ ok: true, remaining: Math.max(0, LIMIT() - used - 1) });
  } catch(e){
    log('failed', { error: String(e.message).slice(0, 80) });
    return res.status(502).json({ error: 'Your account couldn’t be created right now. Please try again.' });
  }
};
