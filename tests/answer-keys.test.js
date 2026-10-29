'use strict';
// Answer keys cover every card direction, and every card's own answer passes its own key.
const { spawnSync } = require('child_process'), path = require('path'), assert = require('node:assert/strict');
const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'answer-keys', 'build.js')], { encoding: 'utf8' });
process.stdout.write(r.stdout); process.stderr.write(r.stderr);
assert.equal(r.status, 0, 'answer-key build reported problems');
const { grade } = require('../answer-keys/match'), { keys } = require('../answer-keys/keys.json');
const cases = [['1A-005', 'cystien', 'right'], ['1A-014', 'enterokinaze', 'right'], ['1A-018', 'km goes up and vmax stays the same', 'right'],
  ['2B-001', 'transformaton, transduction and conjugaton', 'right'], ['1A-005', '', 'wrong'], ['1A-005', 'glycine', 'wrong'], ['1D-016', 'hexokinase', 'wrong'], ['4E-013', 'sample answer 1', 'unsure'], ['4E-013', 'atomic number goes down by 1, mass number unchanged', 'right'],
  // Wrong answers that used to pass with no AI check (now 'unsure', so the AI grades them):
  ['5A-016', 'pH increases by one unit', 'unsure'],          // "increases" was accepted as a typo of "decreases"
  ['2A-018', 'it decreases fluidity', 'unsure'],
  ['1C-012~r', 'an autosomal dominant carrier', 'unsure'],   // key asks for recessive; answer names the opposite
  ['3B-031', 'atrial hyperpolarization', 'unsure'],
  ['5A-005~r', 'Acid B is a stronger acid', 'unsure'],      // "a" alone used to satisfy the key
  ['1A-005', 'not cysteine, I think methionine', 'unsure'],  // negated key term
  // Still right:
  ['5A-016', 'it decreases by one', 'right'], ['1C-012~r', 'autosomal recessive carrier', 'right'], ['5A-005~r', 'acid a', 'right']];
for(const [id, answer, want] of cases){ assert.equal(grade(answer, keys[id]).verdict, want, `${id}: "${answer}"`); console.log('PASS', id, JSON.stringify(answer), '->', want); }
console.log('Answer-key checks passed.');
