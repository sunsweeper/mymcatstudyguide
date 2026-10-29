'use strict';
// Key-concept matcher accuracy (answer-keys/eval.js). A "right" from the matcher is final with no AI check, so wrong answers
// must rarely get it; everything else goes to the AI grader. Limits are a little above the measured values (Oct 29, 2026).
const assert = require('node:assert/strict');
const log = console.log; console.log = () => {};
const R = require('../answer-keys/eval.js');
console.log = log;
const rate = s => R[s].bad / R[s].n;
const checks = [['cross', 0.0035, 'other cards\' answers passed'], ['opposite', 0.12, 'answers with a key term flipped (increases/decreases, hyper/hypo...) passed'],
  ['negated', 0.12, '"Not <answer>" passed'], ['own', 0.05, 'own answers sent to the AI'], ['typo', 0.05, 'own answers with one typo sent to the AI']];
for(const [s, max, what] of checks){ assert.ok(rate(s) <= max, `${s}: ${(100 * rate(s)).toFixed(2)}% ${what} (limit ${100 * max}%)`); console.log('PASS', s, (100 * rate(s)).toFixed(2) + '%', what); }
console.log('Answer matcher accuracy checks passed.');
