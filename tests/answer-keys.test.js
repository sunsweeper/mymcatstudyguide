'use strict';
// Answer keys cover every card direction, and every card's own answer passes its own key.
const { spawnSync } = require('child_process'), path = require('path'), assert = require('node:assert/strict');
const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'answer-keys', 'build.js')], { encoding: 'utf8' });
process.stdout.write(r.stdout); process.stderr.write(r.stderr);
assert.equal(r.status, 0, 'answer-key build reported problems');
const { grade } = require('../answer-keys/match'), { keys } = require('../answer-keys/keys.json');
const cases = [['1A-005', 'cystien', 'right'], ['1A-014', 'enterokinaze', 'right'], ['1A-018', 'km goes up and vmax stays the same', 'right'],
  ['2B-001', 'transformaton, transduction and conjugaton', 'right'], ['1A-005', '', 'wrong'], ['1A-005', 'glycine', 'wrong'], ['1D-016', 'hexokinase', 'wrong'], ['4E-013', 'sample answer 1', 'unsure'], ['4E-013', 'atomic number goes down by 1, mass number unchanged', 'right']];
for(const [id, answer, want] of cases){ assert.equal(grade(answer, keys[id]).verdict, want, `${id}: "${answer}"`); console.log('PASS', id, JSON.stringify(answer), '->', want); }
console.log('Answer-key checks passed.');
