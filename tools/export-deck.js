#!/usr/bin/env node
// Writes the MCAT deck from index.html to private/decks/mcat.json (what /api/deck serves to signed-in students).
// Run after editing cards in index.html: node tools/export-deck.js   (tests/deck-protection.test.js checks they match)
'use strict';
const fs = require('fs'), path = require('path'), { span } = require('./deck-literals');
const root = path.join(__dirname, '..');
function build(src){
  const v = n => span(src, n).value;
  const pub = (/const GRAPHICS_PUBLISHED = (\[[^\]]*\]);/.exec(src) || [])[1];
  const published = pub ? JSON.parse(pub) : [];
  const graphics = v('GRAPHIC_CARDS');
  const cards = v('CARDS').concat(graphics.filter(g => published.includes(g[3])).map(g => [g[0], g[1], g[2], g[3]]));
  return { course: 'mcat', version: 1, cards, reverse: v('REVERSE'), explain: v('EXPLAIN'), graphics };
}
if(require.main === module){
  const out = build(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
  fs.writeFileSync(path.join(root, 'private/decks/mcat.json'), JSON.stringify(out));
  console.log(`private/decks/mcat.json: ${out.cards.length} cards`);
}
module.exports = { build };
