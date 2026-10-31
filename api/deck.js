'use strict';
// GET /api/deck?course=mcat -> the whole deck for a signed-in student enrolled in that course.
// Decks are never in the published pages or as public files; this is the only way to get them.
// Each account can download a deck a limited number of times per hour (a study session needs it once per page load).
const MCAT = require('../private/decks/mcat.json');
const { keys: KEYS, confirmByAI = [] } = require('../answer-keys/keys.json');
const SB_URL = 'https://kwvcflbzocmalhlekxjv.supabase.co';
const SB_KEY = 'sb_publishable_cJYYc0VAsaOHsD5KjqIWsQ_z5q-jJMR';   // publishable key, already public in index.html
const COURSES = ['mcat'];
const LIMIT = 30, WINDOW = 60 * 60 * 1000, hits = new Map();
const log = (outcome, extra = {}) => console.log(JSON.stringify({ deck: outcome, ...extra }));   // never emails
async function signedInUser(auth){
  const token = /^Bearer\s+(.+)$/i.exec(auth || '')?.[1];
  if(!token || token.length > 4096) return null;
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) });
    if(!r.ok) return null;
    const u = await r.json(); return u && u.id ? u : null;
  } catch { return null; }
}
const enrolled = (user, course) => { const c = user.user_metadata && user.user_metadata.courses; return Array.isArray(c) && c.length ? c.includes(course) : course === 'mcat'; };   // accounts from before courses were recorded are MCAT
function allowed(id){
  const now = Date.now(), recent = (hits.get(id) || []).filter(t => now - t < WINDOW);
  if(recent.length >= LIMIT){ hits.set(id, recent); return false; }
  recent.push(now); hits.set(id, recent); return true;
}
function deckFor(course){
  if(course === 'mcat') return { ...MCAT, keys: { keys: KEYS, confirmByAI } };
  return null;
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  if(req.method !== 'GET'){ res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  const course = String((req.query && req.query.course) || new URL(req.url, 'http://x').searchParams.get('course') || '');
  if(!COURSES.includes(course)) return res.status(400).json({ error: 'Unknown course' });
  // tools/preview-server.js (tests only) marks its requests; a real request can't set this property.
  const user = req.previewUser || await signedInUser(req.headers.authorization);
  if(!user){ log('not_signed_in'); return res.status(401).json({ error: 'Sign in required' }); }
  if(!enrolled(user, course)){ log('not_enrolled', { course }); return res.status(403).json({ error: 'Not enrolled in this course' }); }
  if(!allowed(user.id)){ log('rate_limited', { user: user.id }); return res.status(429).json({ error: 'Too many requests' }); }
  log('served', { course, user: user.id });
  return res.status(200).json(deckFor(course));
};
