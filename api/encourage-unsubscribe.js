'use strict';
// One-click opt-out from Rosalind's encouragement emails (link in every email; also used by mail apps' unsubscribe button).
const E = require('./_encourage');

const page = (title, text) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | TabiPrep</title></head>
<body style="margin:0;background:#0a1713;color:#f8f6ef;font:16px/1.6 Helvetica,Arial,sans-serif;"><main style="max-width:520px;margin:60px auto;padding:0 20px;text-align:center;">
<img src="/brand/tabiprep-logo-480.png" width="220" alt="TabiPrep.com" style="height:auto"><h1 style="font-family:Georgia,serif;font-weight:600;font-size:28px;margin:28px 0 12px;">${title}</h1>
<p style="color:#c7d5cb;">${text}</p><p><a href="/mcat" style="color:#f0adbd;">Back to TabiPrep</a></p></main></body></html>`;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const q = new URL(req.url, 'https://x').searchParams, id = q.get('u') || '', t = q.get('t') || '';
  const reply = (status, title, text) => { res.statusCode = status; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(page(title, text)); };
  if(!/^[0-9a-f-]{36}$/i.test(id) || !E.validToken(id, t)) return reply(400, 'Link not recognized', 'This unsubscribe link is incomplete or has expired. Contact us from tabiprep.com and we’ll take care of it.');
  // Opening the link only asks; the button (or a mail app's one-click unsubscribe, which POSTs) does it. Link scanners only GET.
  if(req.method !== 'POST'){ res.statusCode = 200; res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(page('Stop encouragement emails?', `Rosalind sends at most two short notes before your MCAT. <form method="post" style="margin-top:22px"><button type="submit" style="font:700 16px Helvetica,Arial,sans-serif;background:#9bd7ac;color:#143123;border:0;border-radius:10px;padding:14px 24px;cursor:pointer">Unsubscribe</button></form>`)); }
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY) return reply(503, 'Try again later', 'We couldn’t update your settings just now. Please try the link again later.');
  try {
    const r = await fetch(`${E.SB_URL}/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'PUT', signal: AbortSignal.timeout(10000),
      headers: { ...E.admin(), 'Content-Type': 'application/json' }, body: JSON.stringify({ user_metadata: { encourage_opt_out: true } }) });
    if(!r.ok) throw new Error('supabase ' + r.status);
    E.log('opted_out');
    return reply(200, 'You’re unsubscribed', 'You won’t get any more encouragement emails from Rosalind. Your account and study progress aren’t affected.');
  } catch(e){ E.log('opt_out_failed', { error: String(e.message).slice(0, 80) }); return reply(502, 'Try again later', 'We couldn’t update your settings just now. Please try the link again later.'); }
};
