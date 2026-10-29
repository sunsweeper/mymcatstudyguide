#!/usr/bin/env node
// Compiles answer-keys/src/*.txt into answer-keys/keys.json and checks it:
//  - every card has a question-first key, every reversible card has a reverse key, no unknown IDs
//  - every card's own answer passes its own key (catches typos and over-strict concepts)
'use strict';
const fs = require('fs'), path = require('path');
const { readCards } = require('../tools/card-data');
const { grade } = require('./match');
const root = path.join(__dirname, '..'), src = path.join(__dirname, 'src');
const { CARDS, REVERSE } = readCards(path.join(root, 'index.html'));
const keys = {}, problems = [];
for(const f of fs.readdirSync(src).filter(f => f.endsWith('.txt')).sort()){
  fs.readFileSync(path.join(src, f), 'utf8').split('\n').forEach((line, n) => {
    if(!line.trim() || line.startsWith('#')) return;
    const m = line.match(/^([A-Z0-9]+-\d{3}(?:~r)?):\s*(.+)$/);
    if(!m){ problems.push(`${f}:${n + 1}: unreadable line`); return; }
    if(keys[m[1]]) problems.push(`${f}:${n + 1}: duplicate key ${m[1]}`);
    keys[m[1]] = m[2].split(';').map(c => c.split(' / ').map(p => p.trim()).filter(Boolean)).filter(c => c.length);
  });
}
const ids = new Set(CARDS.map(c => c[3]));
const strip = s => String(s || '');   // match.js normalizes markup
let selfPass = 0, selfTotal = 0;
for(const c of CARDS){
  const id = c[3];
  for(const [k, answer] of [[id, c[2]], ...(REVERSE[id] ? [[id + '~r', REVERSE[id][1]]] : [])]){
    if(!keys[k]){ problems.push(`${k}: no key`); continue; }
    selfTotal++;
    const g = grade(strip(answer), keys[k]);
    if(g.score === 1) selfPass++;   // every concept found (the matcher may still send it to the AI, e.g. a negation near a key term)
    else problems.push(`${k}: card's own answer misses concept(s) ${g.missing.map(i => '[' + keys[k][i].slice(0, 3).join(' / ') + ']').join(' ')}`);
  }
}
Object.keys(keys).forEach(k => { const id = k.replace('~r', ''); if(!ids.has(id)) problems.push(`${k}: no such card`); else if(k.endsWith('~r') && !REVERSE[id]) problems.push(`${k}: card has no reverse side`); });
// Comparison cards ("A vs. B", "differ", "distinguish", directional effects) need the right term on the right side.
// Word matching can't check that, so these never auto-pass: a full match is sent to the AI layer to confirm.
const COMPARE = /\bvs\b|versus|differ|distinguish|contrast|compared?\b|effect on k ?m|which way/i;
const confirmByAI = CARDS.filter(c => COMPARE.test(String(c[1]).replace(/<[^>]+>/g, ' '))).map(c => c[3]);
fs.writeFileSync(path.join(__dirname, 'keys.json'), JSON.stringify({ version: 1, confirmByAI, keys }));
// Plain-text card sides for the server-side grader, so it never trusts card text sent by a browser.
const plain = h => String(h || '').replace(/<\/?(sub|sup)>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const cards = {};
for(const c of CARDS){ cards[c[3]] = { q: plain(c[1]), a: plain(c[2]) }; const r = REVERSE[c[3]]; if(r) cards[c[3] + '~r'] = { q: plain(r[0] || ('Which term or concept is described by: ' + c[2])), a: plain(r[1]) }; }
fs.writeFileSync(path.join(__dirname, 'cards.json'), JSON.stringify(cards));
console.log(`${confirmByAI.length} comparison cards always confirm a full match with the AI layer.`);
console.log(`${Object.keys(keys).length} keys; ${selfPass}/${selfTotal} cards pass their own key.`);
if(problems.length){ console.log(problems.join('\n')); process.exitCode = 1; }
