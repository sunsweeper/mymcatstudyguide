// Layer 1 of answer checking: forgiving key-concept match.
// Spelling, grammar, word order and punctuation don't matter. A key is a list of concepts; each concept is a list of
// acceptable phrasings. A phrasing matches when every word in it appears in the answer (in any order), allowing small
// typos. Only the verdict "clearly right" or "clearly wrong" is final here; everything in between goes to layer 2 (AI).
(function(root){
'use strict';

const GREEK = { 'α':'alpha', 'β':'beta', 'γ':'gamma', 'δ':'delta', 'ω':'omega', 'μ':'mu', 'λ':'lambda', 'θ':'theta', 'σ':'sigma', 'π':'pi', 'ρ':'rho', 'ψ':'psi', 'φ':'phi', 'κ':'kappa', 'ε':'epsilon', 'τ':'tau', 'ν':'nu' };
const SUB = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','ᵢ':'i','ₙ':'n' };

function norm(s){
  s = String(s || '').toLowerCase();
  s = s.replace(/<\/?(sub|sup)>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&amp;|&lt;|&gt;/g, ' ');
  s = s.replace(/[₀-₉⁰-⁹⁺⁻ᵢₙ]/g, c => SUB[c]).replace(/[α-ωμ]/g, c => GREEK[c] || c);
  s = s.replace(/[−–—]/g, '-').replace(/[′’‘`]/g, "'").replace(/→/g, ' to ').replace(/×/g, 'x').replace(/·/g, ' ');
  // Join tokens like "k m" -> "km", "v max" -> "vmax", "h 2 o" -> "h2o" so spacing never matters.
  s = s.replace(/\b([a-z]) (m|max|a|b|sp|eq|w|f|c|cat)\b/g, '$1$2');
  return s;
}
// Words: letters/digits plus a few symbols that carry meaning in science answers.
const words = s => { const ws = norm(s).split(/[^a-z0-9+\-=/^%.']+/).map(w => w.replace(/^[.'\-]+|[.'\-]+$/g, '')).filter(Boolean);
  return ws.concat(ws.filter(w => /[a-z]-[a-z]/.test(w)).flatMap(w => w.split('-')).filter(Boolean)); };   // "y-axis" also counts as "y" and "axis"
const STOP = new Set(['the','a','an','of','to','is','are','and','or','in','on','at','by','for','its','it','that','this','be','as','with','from']);
const stem = w => w.length > 4 ? w.replace(/(ization|isation|ations|ation|ings|ing|ies|ied|ers|er|es|ed|ly|s)$/, '') : w;

function editDistance(a, b, max){
  if(Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for(let i = 1; i <= a.length; i++){
    const cur = [i]; let best = i;
    for(let j = 1; j <= b.length; j++){
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if(best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
// Typo allowance grows with word length; short tokens (numbers, symbols, abbreviations) must match exactly.
const allowance = w => /\d/.test(w) || w.length <= 3 ? 0 : w.length <= 6 ? 1 : 2;
function wordPresent(target, answerWords, joined){
  if(answerWords.includes(target)) return true;
  if(target.length > 2 && joined.includes(target.replace(/[^a-z0-9+\-=/^%.]/g, ''))) return true;   // "pH = pKa" vs "ph=pka"
  const t = stem(target), max = allowance(target);
  return answerWords.some(w => stem(w) === t || (max && (editDistance(w, target, max) <= max || editDistance(stem(w), t, max) <= max)));
}
function phrasingMatches(phrase, answerWords, joined){
  const all = words(phrase), content = all.filter(w => !STOP.has(w)), need = content.length ? content : all;
  if(!need.length) return false;
  return need.every(w => wordPresent(w, answerWords, joined));
}
// Returns { score: 0..1, matched: [...], missing: [...], verdict: 'right' | 'wrong' | 'unsure' }.
function grade(answer, key){
  const answerWords = words(answer), joined = answerWords.join('');
  const matched = [], missing = [];
  key.forEach((concept, i) => (concept.some(p => phrasingMatches(p, answerWords, joined)) ? matched : missing).push(i));
  const score = key.length ? matched.length / key.length : 0;
  const verdict = !answerWords.length ? 'wrong' : score === 1 ? 'right' : score === 0 && answerWords.length < 3 ? 'wrong' : 'unsure';
  return { score, matched, missing, verdict };
}
const api = { grade, norm, words };
if(typeof module === 'object' && module.exports) module.exports = api; else root.TabiMatch = api;
})(typeof self !== 'undefined' ? self : this);
