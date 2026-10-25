#!/usr/bin/env node
// Content protection for the original flashcard library (Package 1, section 9).
// Fails if any protected card's question, answer, reverse side, section, or ID changed or disappeared,
// unless that exact change is recorded in protected/corrections.json (the separately authorized correction procedure).
// New cards are allowed only with new IDs. Usage: node tools/check-cards.js [path/to/index.html]
'use strict';
const fs = require('fs'), path = require('path');
const { readCards, cardHash, sha } = require('./card-data');
const root = path.join(__dirname, '..');
const site = process.argv[2] || path.join(root, 'index.html');
const baseline = JSON.parse(fs.readFileSync(path.join(root, 'protected', 'cards-baseline-v1.json'), 'utf8'));
let corrections = { corrections: [] };
try { corrections = JSON.parse(fs.readFileSync(path.join(root, 'protected', 'corrections.json'), 'utf8')); } catch(e){}
const { CARDS, REVERSE } = readCards(site);
const now = new Map(CARDS.map(c => [c[3], c]));
const problems = [], notes = [];
// The baseline file itself must not have been edited.
const recomputed = sha(baseline.cards.map(c => c.card_id + ':' + c.content_hash).join('\n'));
if(recomputed !== baseline.library_hash) problems.push('protected/cards-baseline-v1.json was modified (library hash mismatch). The baseline is never edited; corrections go in protected/corrections.json.');
const approved = new Map();
for(const c of corrections.corrections || []){
  if(c.approved === true && c.authorized_by && c.card_id && c.new_content_hash) approved.set(c.card_id + ':' + c.new_content_hash, c);
}
for(const b of baseline.cards){
  const c = now.get(b.card_id);
  if(!c){ problems.push(`${b.card_id}: protected card is missing.`); continue; }
  const h = cardHash(c, REVERSE);
  if(h === b.content_hash) continue;
  const fix = approved.get(b.card_id + ':' + h);
  if(fix){ notes.push(`${b.card_id}: changed under authorized correction ${fix.correction_id || ''} (${fix.authorized_by}, ${fix.date || 'no date'}).`); continue; }
  const diff = [];
  if(c[0] !== b.section_key) diff.push('section');
  if(c[1] !== b.question) diff.push('question');
  if(c[2] !== b.answer) diff.push('answer');
  if(JSON.stringify(REVERSE[c[3]] === undefined ? null : REVERSE[c[3]]) !== JSON.stringify(b.reverse)) diff.push('reverse side');
  problems.push(`${b.card_id}: protected card changed (${diff.join(', ') || 'content'}). See docs/package-1/CARD-CORRECTIONS.md.`);
}
const baseIds = new Set(baseline.cards.map(b => b.card_id));
const seen = new Set();
for(const c of CARDS){
  if(seen.has(c[3])) problems.push(`${c[3]}: card ID used more than once.`);
  seen.add(c[3]);
  if(!baseIds.has(c[3])) notes.push(`${c[3]}: new card (not in the protected baseline). New cards must always use new IDs.`);
}
for(const n of notes) console.log('note:', n);
if(problems.length){
  console.error(`\nCARD PROTECTION FAILED: ${problems.length} problem(s)`);
  for(const p of problems.slice(0, 50)) console.error(' -', p);
  if(problems.length > 50) console.error(` ...and ${problems.length - 50} more`);
  process.exit(1);
}
console.log(`Card protection passed: all ${baseline.cards.length} protected cards are unchanged${approved.size ? " or changed only under an authorized correction" : ""}${notes.length ? `; ${notes.length} note(s)` : ""}.`);
