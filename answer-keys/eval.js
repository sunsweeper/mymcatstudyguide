#!/usr/bin/env node
// Measures the key-concept matcher (layer 1). A "right" verdict is final (no AI), so the number that matters is how
// often a WRONG answer gets "right". Every other verdict goes to the AI grader, which costs money but isn't a wrong grade.
//   node answer-keys/eval.js [--worst] [--show N]
// Wrong-answer sets:
//   cross     every other card's answer in the same section, graded against this card's key
//   opposite  this card's own answer with one key term swapped for its opposite (increases->decreases, hyper->hypo, ...)
//   negated   this card's own answer with "not" in front ("Not X.")
// Right-answer sets (higher pass = fewer AI calls):
//   own       the card's own answer
//   typo      the card's own answer with one small typo in a long word
'use strict';
const path = require('path');
const { readCards } = require('../tools/card-data');
const M = require('./match');
const { keys, confirmByAI } = require('./keys.json');
const { CARDS, REVERSE } = readCards(path.join(__dirname, '..', 'index.html'));
const plain = h => String(h || '').replace(/<\/?(sub|sup)>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const sides = [];
for(const c of CARDS){ sides.push({ k: c[3], sec: c[0], a: plain(c[2]) }); if(REVERSE[c[3]]) sides.push({ k: c[3] + '~r', sec: c[0], a: plain(REVERSE[c[3]][1]) }); }
const auto = s => !confirmByAI.includes(s.k.replace('~r', ''));   // comparison cards always go to the AI on a full match
const right = (a, k) => M.grade(a, keys[k]).verdict === 'right';

// Opposite terms a student might write instead of the right one (each direction).
const PAIRS = [['increase','decrease'],['increases','decreases'],['increased','decreased'],['increasing','decreasing'],['raises','lowers'],['raise','lower'],['higher','lower'],['more','less'],['rises','falls'],
  ['activates','inhibits'],['stimulates','inhibits'],['up','down'],['positive','negative'],['hypertonic','hypotonic'],['hyperpolarization','depolarization'],['hyperpolarizes','depolarizes'],
  ['intracellular','extracellular'],['intracellular','intercellular'],['intragenerational','intergenerational'],['endocytosis','exocytosis'],['anabolic','catabolic'],['anabolism','catabolism'],
  ['afferent','efferent'],['endothermic','exothermic'],['endergonic','exergonic'],['mitosis','meiosis'],['haploid','diploid'],['systolic','diastolic'],['systole','diastole'],
  ['sympathetic','parasympathetic'],['agonist','antagonist'],['polar','nonpolar'],['competitive','noncompetitive'],['reversible','irreversible'],['anion','cation'],['anions','cations'],['anode','cathode'],
  ['absorption','adsorption'],['ascending','descending'],['oxidation','reduction'],['oxidized','reduced'],['acidic','basic'],['dominant','recessive'],['influx','efflux'],
  ['homozygous','heterozygous'],['anterograde','retrograde'],['hydrophilic','hydrophobic'],['inhalation','exhalation'],['maximum','minimum'],['hyperthyroidism','hypothyroidism'],
  ['anterior','posterior'],['dorsal','ventral'],['proximal','distal'],['medial','lateral'],['excitatory','inhibitory'],['vasodilation','vasoconstriction'],['cis','trans'],
  ['transcription','translation'],['glycolysis','gluconeogenesis'],['glycogenesis','glycogenolysis'],['ipsilateral','contralateral'],['saturated','unsaturated'],['aerobic','anaerobic'],
  ['soluble','insoluble'],['exergonic','endergonic'],['hypoglycemia','hyperglycemia'],['hypokalemia','hyperkalemia'],['hyponatremia','hypernatremia'],['hypoventilation','hyperventilation'],
  ['allosteric','orthosteric'],['ionic','covalent'],['cis','trans'],['major','minor'],['primary','secondary'],['convex','concave'],['converging','diverging'],['real','virtual'],
  ['upright','inverted'],['inward','outward'],['influx','outflow'],['antidiuretic','diuretic'],['agonists','antagonists'],['monosaccharide','disaccharide'],['purine','pyrimidine'],['purines','pyrimidines']];
// Swap one key term for its opposite. Only counted when the swapped word is part of this card's key (so the matcher is
// being asked to tell the two terms apart), and the answer doesn't already contain the opposite.
function opposites(text, key){
  const keyWords = new Set(key.flat().flatMap(p => M.words(p)));
  const out = [];
  for(const [a, b] of PAIRS) for(const [x, y] of [[a, b], [b, a]]){
    if(!keyWords.has(x)) continue;
    const re = new RegExp(`\\b${x}\\b`, 'i');
    if(re.test(text) && !new RegExp(`\\b${y}\\b`, 'i').test(text)) out.push(text.replace(re, m => m[0] === m[0].toUpperCase() ? y[0].toUpperCase() + y.slice(1) : y));
  }
  return out;
}
function typo(text, seed){
  const ws = text.split(' '), idx = ws.map((w, i) => [w, i]).filter(([w]) => /^[a-z]{7,}$/i.test(w));
  if(!idx.length) return null;
  const [w, i] = idx[seed % idx.length], p = 2 + (seed % (w.length - 3));   // one dropped letter, never the first two
  ws[i] = w.slice(0, p) + w.slice(p + 1); return ws.join(' ');
}
const R = {}; const add = (set, wrong, ok, ex) => { const r = R[set] || (R[set] = { n:0, bad:0, ex:[] }); r.n++; if(wrong ? ok : !ok){ r.bad++; if(r.ex.length < 400) r.ex.push(ex); } };
const byKey = {};
for(const s of sides){
  add('own', false, right(s.a, s.k), s.k);
  const t = typo(s.a, s.k.length * 7 + s.a.length); if(t) add('typo', false, right(t, s.k), `${s.k}: ${t}`);
  if(!auto(s)) continue;
  for(const o of sides){
    if(o.sec !== s.sec || o.k.replace('~r', '') === s.k.replace('~r', '')) continue;
    const ok = right(o.a, s.k); add('cross', true, ok, `${s.k} <- ${o.k}`); if(ok) byKey[s.k] = (byKey[s.k] || 0) + 1;
  }
  for(const w of opposites(s.a, keys[s.k])) add('opposite', true, right(w, s.k), `${s.k}: ${w}`);
  add('negated', true, right('Not ' + s.a, s.k), `${s.k}: Not ${s.a}`);
}
const pct = r => (100 * r.bad / r.n).toFixed(2) + '%';
console.log('Wrong answers graded right with no AI check (lower is better):');
for(const s of ['cross', 'opposite', 'negated']) console.log(`  ${s.padEnd(9)} ${String(R[s].bad).padStart(5)}/${R[s].n}  ${pct(R[s])}`);
console.log('Right answers not passed by the matcher, so sent to the AI (lower is cheaper):');
for(const s of ['own', 'typo']) console.log(`  ${s.padEnd(9)} ${String(R[s].bad).padStart(5)}/${R[s].n}  ${pct(R[s])}`);
const show = Number((process.argv.find(a => a.startsWith('--show=')) || '').split('=')[1] || 0);
if(show) for(const s of Object.keys(R)) { console.log(`--- ${s}`); R[s].ex.slice(0, show).forEach(e => console.log('  ' + e)); }
if(process.argv.includes('--worst')) Object.entries(byKey).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, n]) => console.log(n, k, JSON.stringify(keys[k])));
module.exports = R;
