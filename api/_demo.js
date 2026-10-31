'use strict';
// Sample cards on the course pages: each visitor gets 5 cards a day from a course, never the whole deck.
// The same visitor gets the same 5 all day (so reloading doesn't reveal more), and MCAT sample cards carry a
// short-lived signed token so they can be graded without signing in (only those cards, only for a few hours).
const crypto = require('crypto');
const SECRET = () => process.env.DEMO_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TOKEN_HOURS = 12;
function token(key, now = Date.now()){
  const s = SECRET(); if(!s) return null;
  const exp = Math.floor(now / 1000) + TOKEN_HOURS * 3600;
  return exp + '.' + crypto.createHmac('sha256', s).update(key + '.' + exp).digest('base64url');
}
function tokenOk(key, t, now = Date.now()){
  const s = SECRET(); if(!s || typeof t !== 'string') return false;
  const [exp, sig] = t.split('.'); if(!/^\d+$/.test(exp || '') || !sig || Number(exp) * 1000 < now) return false;
  const want = crypto.createHmac('sha256', s).update(key + '.' + exp).digest('base64url');
  return sig.length === want.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want));
}
// n distinct picks from 0..len-1, fixed for a seed (visitor + day + course)
function pick(len, n, seed){
  let h = crypto.createHash('sha256').update(seed).digest(), i = 0, out = [];
  const next = () => { if(i + 4 > h.length){ h = crypto.createHash('sha256').update(h).digest(); i = 0; } const v = h.readUInt32BE(i); i += 4; return v; };
  while(out.length < Math.min(n, len)){ const k = next() % len; if(!out.includes(k)) out.push(k); }
  return out;
}
const ipOf = req => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
module.exports = { token, tokenOk, pick, ipOf };
