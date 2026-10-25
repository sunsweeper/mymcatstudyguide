#!/usr/bin/env node
// One-time: records the protected baseline of the original card library. Refuses to overwrite an existing baseline.
'use strict';
const fs = require('fs'), path = require('path');
const { readCards, cardHash, sha } = require('./card-data');
const root = path.join(__dirname, '..'), out = path.join(root, 'protected', 'cards-baseline-v1.json');
if(fs.existsSync(out) && !process.argv.includes('--first-time')) { console.error('Baseline already exists. It is never regenerated; use the correction procedure instead.'); process.exit(1); }
const { CARDS, REVERSE } = readCards(path.join(root, 'index.html'));
const cards = CARDS.map(c => ({ card_id: c[3], section_key: c[0], question: c[1], answer: c[2], reverse: REVERSE[c[3]] === undefined ? null : REVERSE[c[3]], content_hash: cardHash(c, REVERSE) }));
const library_hash = sha(cards.map(c => c.card_id + ':' + c.content_hash).join('\n'));
fs.writeFileSync(out, JSON.stringify({ baseline_version: 'cards-v1', created: process.argv.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Date().toISOString().slice(0, 10), card_count: cards.length,
  note: 'Protected original flashcard library. Do not edit. Approved factual corrections are recorded in protected/corrections.json.', library_hash, cards }, null, 1));
console.log(`Baseline written: ${cards.length} cards, library hash ${library_hash.slice(0, 16)}…`);
