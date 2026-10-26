// Validates the graphical cards (Package 2, Phase 8) in index.html against metadata/graphic-cards.json.
// A card can only be published (listed in GRAPHICS_PUBLISHED) once its metadata record says it was approved.
// Usage: node tools/validate-graphics.js [path/to/index.html]
'use strict';
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), site = process.argv[2] || path.join(root, 'index.html');
const js = fs.readFileSync(site, 'utf8').split('<script>')[1].split('</script>')[0];
const grab = name => { const i = js.indexOf(`const ${name} =`); if(i < 0) throw new Error(`${name} not found`); let j = js.indexOf('=', i) + 1, d = 0, k = j, q = null, started = false;
  for(; k < js.length; k++){ const ch = js[k]; if(q){ if(ch === '\\'){ k++; continue; } if(ch === q) q = null; continue; } if(ch === '"' || ch === "'" || ch === '`'){ q = ch; continue; }
    if(ch === '[' || ch === '{'){ d++; started = true; } else if(ch === ']' || ch === '}'){ d--; if(started && d === 0){ k++; break; } } }
  return Function('"use strict";return (' + js.slice(j, k) + ')')(); };
const CARDS = grab('CARDS'), CATEGORIES = grab('CATEGORIES'), G = grab('GRAPHIC_CARDS'), PUB = grab('GRAPHICS_PUBLISHED');
const meta = JSON.parse(fs.readFileSync(path.join(root, 'metadata', 'graphic-cards.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'metadata', 'concepts.json'), 'utf8'));
const concepts = new Set(catalog.concepts.map(c => c.id)), orig = new Set(CARDS.map(c => c[3]));
const secOfCat = {}; CARDS.forEach(c => { secOfCat[c[3].split('-')[0]] = c[0]; });
const recs = Object.fromEntries(meta.cards.map(r => [r.card_id, r]));
const errors = [], seen = new Set();
for(const g of G){
  const [sec, q, a, id, concept] = g, cat = (id || '').split('-')[0], tag = id || '(no id)';
  if(!/^[0-9A-Z]{2}-G\d{2}$/.test(id || '')) errors.push(`${tag}: ID must look like <category>-Gnn`);
  if(seen.has(id)) errors.push(`${tag}: duplicate ID`); seen.add(id);
  if(orig.has(id)) errors.push(`${tag}: collides with an original card ID`);
  if(!CATEGORIES[cat]) errors.push(`${tag}: unknown content category ${cat}`);
  if(secOfCat[cat] && secOfCat[cat] !== sec) errors.push(`${tag}: section ${sec} doesn't match category ${cat} (${secOfCat[cat]})`);
  if(!concepts.has(concept)) errors.push(`${tag}: concept ${concept} isn't in the concept catalog`);
  const r = recs[id];
  if(!r) errors.push(`${tag}: no record in metadata/graphic-cards.json`);
  else if(r.primary_concept_id !== concept || r.content_category !== cat) errors.push(`${tag}: metadata record doesn't match the card (concept/category)`);
  const html = q + a, svgs = html.match(/<svg[\s\S]*?<\/svg>/g) || [];
  if(!svgs.length) errors.push(`${tag}: no figure`);
  for(const s of svgs){
    const lab = (s.match(/aria-labelledby="([^"]+)"/) || [])[1];
    if(!/role="img"/.test(s) || !lab) errors.push(`${tag}: figure needs role="img" and aria-labelledby`);
    else for(const ref of lab.split(/\s+/)){ const m = s.match(new RegExp(`<(title|desc) id="${ref}">([^<]{8,})</(title|desc)>`)); if(!m) errors.push(`${tag}: missing or too-short <title>/<desc> #${ref} (the text alternative)`); }
    const opens = (s.match(/<(g|text|tspan|title|desc|svg|figure)\b/g) || []).length, closes = (s.match(/<\/(g|text|tspan|title|desc|svg|figure)>/g) || []).length;
    if(opens !== closes) errors.push(`${tag}: unbalanced tags in figure (${opens} open, ${closes} close)`);
  }
  if(/TODO|lorem/i.test(html)) errors.push(`${tag}: placeholder text`);
}
for(const id of PUB){
  if(!seen.has(id)) errors.push(`published ${id} isn't a graphical card`);
  const r = recs[id]; if(!r || r.review_status !== 'approved' || !r.approved_by) errors.push(`published ${id} has no recorded approval (review_status "approved" and approved_by in metadata/graphic-cards.json)`);
}
if(errors.length){ console.error(`GRAPHIC CARD VALIDATION FAILED: ${errors.length} problem(s)`); errors.forEach(e => console.error(' -', e)); process.exit(1); }
console.log(`Graphic cards valid: ${G.length} cards (${PUB.length} published, ${G.length - PUB.length} drafts), all with new IDs, catalog concepts and text alternatives.`);
