#!/usr/bin/env node
// Deploy step (vercel.json buildCommand): takes the card data out of the published index.html, so the deck is only
// available from /api/deck to signed-in students. The repository copy keeps the cards (tests and tools read them there).
'use strict';
const fs = require('fs'), path = require('path'), { NAMES, span } = require('./deck-literals');
const file = path.join(__dirname, '..', process.argv[2] || 'index.html');
let src = fs.readFileSync(file, 'utf8');
for(const n of NAMES){ const s = span(src, n); src = src.slice(0, s.start) + (Array.isArray(s.value) ? ' []' : ' {}') + src.slice(s.end); }
if(/1A-001"\]/.test(src) || /Primary structure of a protein/.test(src)) throw new Error('strip-deck: card text still present');
fs.writeFileSync(file, src);
console.log('strip-deck: card data removed from ' + path.basename(file));
