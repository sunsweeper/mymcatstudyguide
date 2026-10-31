'use strict';
// GET /api/demo-cards?course=mcat|spanish -> five sample cards for that course's landing page.
// The full decks stay on the server (private/ is not served; answer keys only for these five cards).
const D = require('./_demo');
const CARDS = require('../answer-keys/cards.json');
const { keys: KEYS, confirmByAI = [] } = require('../answer-keys/keys.json');
const SPANISH = require('../private/spanish-cards.json').cards;
const MCAT_IDS = Object.keys(CARDS).filter(k => !k.includes('~'));
const SECTION = id => /^C/.test(id) ? 'CARS' : /^S/.test(id) ? 'Research/Stats' : Number(id.split(/[A-Z]/)[0]) <= 3 ? 'Bio/Biochem' : Number(id.split(/[A-Z]/)[0]) <= 5 ? 'Chem/Phys' : 'Psych/Soc';
const N = 5, LIMIT = 40, WINDOW = 10 * 60 * 1000, hits = new Map();
function allowed(ip){
  const now = Date.now(), recent = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  if(recent.length >= LIMIT){ hits.set(ip, recent); return false; }
  recent.push(now); hits.set(ip, recent);
  if(hits.size > 5000) for(const [k, v] of hits) if(!v.some(t => now - t < WINDOW)) hits.delete(k);
  return true;
}
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  if(req.method !== 'GET'){ res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  const course = String((req.query && req.query.course) || new URL(req.url, 'http://x').searchParams.get('course') || '');
  if(!['mcat', 'spanish'].includes(course)) return res.status(400).json({ error: 'Unknown course' });
  const ip = D.ipOf(req);
  if(!allowed(ip)) return res.status(429).json({ error: 'Too many requests. Try again in a few minutes.' });
  const seed = ip + '|' + new Date().toISOString().slice(0, 10) + '|' + course + '|' + (process.env.DEMO_SECRET || 'tabiprep');
  if(course === 'mcat'){
    const cards = D.pick(MCAT_IDS.length, N, seed).map(i => MCAT_IDS[i]).map(k => ({ key: k, topic: SECTION(k), sub: CARDS[k].cat || '', q: CARDS[k].q, a: CARDS[k].a,
      keys: KEYS[k] || [], ai: confirmByAI.includes(k), t: D.token(k) }));
    return res.status(200).json({ course, cards });
  }
  const cards = D.pick(SPANISH.length, N, seed).map(i => SPANISH[i]);
  return res.status(200).json({ course, cards });
};
