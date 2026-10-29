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
  s = s.replace(/[−–—]/g, '-').replace(/[′’‘`]/g, "'").replace(/→/g, ' to ').replace(/×/g, 'x').replace(/·/g, ' ').replace(/√/g, ' sqrt ');
  // Join tokens like "k m" -> "km", "v max" -> "vmax", "h 2 o" -> "h2o" so spacing never matters.
  s = s.replace(/\b([a-z]) (m|max|a|b|sp|eq|w|f|c|cat)\b/g, '$1$2');
  s = s.replace(/\bnon[\s-]+(?=[a-z])/g, 'non');   // "non-polar", "non polar" -> "nonpolar", so "polar" isn't read on its own
  return s;
}
// Words: letters/digits plus a few symbols that carry meaning in science answers.
const words = s => { const ws = norm(s).split(/[^a-z0-9+\-=/^%.']+/).map(w => w.replace(/^[.']+|[.'\-]+$/g, '').replace(/^-+(?!\d)/, ''))   /* keep the minus on numbers: "-1" is not "1" */.filter(Boolean);
  return ws.concat(ws.filter(w => /[a-z]-[a-z]/.test(w)).flatMap(w => w.split('-')).filter(Boolean)); };   // "y-axis" also counts as "y" and "axis"
// One-concept keys: an answer with more than this many content words goes to the AI even when the key term is in it
// (a long answer about something else can mention the term in passing).
const LONG = 10;
const GENERIC = new Set(['one','two','same','equal','yes','no','up','down','more','less','cap','pro','first','second']);
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
// Words that differ only by a meaning-changing prefix are never "typos" of each other: increases/decreases,
// hypertonic/hypotonic, intracellular/intercellular, afferent/efferent, mitosis/meiosis, haploid/diploid ...
const PREFIXES = [['hyper','hypo'],['inter','intra'],['intra','extra'],['inter','extra'],['homo','hetero'],['ana','cata'],['endo','exo'],['in','de'],['in','ex'],['im','ex'],['en','ex'],
  ['af','ef'],['as','des'],['pro','anti'],['pre','post'],['sub','super'],['over','under'],['ortho','para'],['mono','poly'],['an','cat'],['ab','ad'],['dia','sys']];
function sameRoot(a, b){
  if(a.slice(0, 2) !== b.slice(0, 2)) return false;   // a typo in the first two letters is rare; a different prefix is common
  return !PREFIXES.some(([x, y]) => (a.startsWith(x) && b.startsWith(y)) || (a.startsWith(y) && b.startsWith(x)));
}
function wordPresent(target, answerWords, joined){
  if(answerWords.includes(target)) return true;
  // Run-together spellings: "pH = pKa" vs "ph=pka", "ρobject" vs "ρ object". But never a word hidden inside its own
  // opposite: "sympathetic" in "parasympathetic", "agonist" in "antagonist", "polar" in "nonpolar", "reversible" in "irreversible".
  if(target.length > 2 && joined.includes(target.replace(/[^a-z0-9+\-=/^%.]/g, ''))
    && !answerWords.some(w => w !== target && w.endsWith(target) && /(non|para|anti|ant|an|ir|il|im|in|un|dis|de|hypo|hyper|intra|inter|extra|counter|mis)$/.test(w.slice(0, -target.length)))) return true;
  const t = stem(target), max = allowance(target);
  return answerWords.some(w => stem(w) === t || (max && sameRoot(w, target) && (editDistance(w, target, max) <= max || editDistance(stem(w), t, max) <= max)));
}
// Opposites: if the key asks for one side and the answer names the other, the matcher can't tell whether the student
// said the right thing, so it hands the answer to the AI. Same for answers that negate something ("not", "isn't" ...).
const OPPOSITES = [['increase','decrease'],['increases','decreases'],['increased','decreased'],['increasing','decreasing'],['raises','lowers'],['raise','lower'],['raised','lowered'],
  ['higher','lower'],['more','less'],['rises','falls'],['rise','fall'],['up','down'],['greater','smaller'],['larger','smaller'],['faster','slower'],['stronger','weaker'],
  ['activates','inhibits'],['stimulates','inhibits'],['activate','inhibit'],['stimulate','inhibit'],['excitatory','inhibitory'],['upregulates','downregulates'],['enhances','suppresses'],
  ['positive','negative'],['gain','loss'],['hypertonic','hypotonic'],['hyperpolarization','depolarization'],['hyperpolarizes','depolarizes'],['hyperpolarize','depolarize'],
  ['intracellular','extracellular'],['intracellular','intercellular'],['intragenerational','intergenerational'],['endocytosis','exocytosis'],['anabolic','catabolic'],['anabolism','catabolism'],
  ['afferent','efferent'],['endothermic','exothermic'],['endergonic','exergonic'],['mitosis','meiosis'],['haploid','diploid'],['systolic','diastolic'],['systole','diastole'],
  ['sympathetic','parasympathetic'],['agonist','antagonist'],['agonists','antagonists'],['polar','nonpolar'],['competitive','noncompetitive'],['reversible','irreversible'],
  ['anion','cation'],['anions','cations'],['anode','cathode'],['absorption','adsorption'],['ascending','descending'],['oxidation','reduction'],['oxidized','reduced'],['oxidizing','reducing'],
  ['acidic','basic'],['acid','base'],['dominant','recessive'],['influx','efflux'],['homozygous','heterozygous'],['anterograde','retrograde'],['hydrophilic','hydrophobic'],
  ['inhalation','exhalation'],['maximum','minimum'],['hyperthyroidism','hypothyroidism'],['anterior','posterior'],['dorsal','ventral'],['proximal','distal'],['medial','lateral'],
  ['vasodilation','vasoconstriction'],['cis','trans'],['transcription','translation'],['glycolysis','gluconeogenesis'],['glycogenesis','glycogenolysis'],['ipsilateral','contralateral'],
  ['saturated','unsaturated'],['aerobic','anaerobic'],['soluble','insoluble'],['hypoglycemia','hyperglycemia'],['hypokalemia','hyperkalemia'],['hyponatremia','hypernatremia'],
  ['hypoventilation','hyperventilation'],['convex','concave'],['converging','diverging'],['real','virtual'],['upright','inverted'],['inward','outward'],['purine','pyrimidine'],
  ['purines','pyrimidines'],['ionic','covalent'],['exergonic','endergonic'],['spontaneous','nonspontaneous'],['left','right'],['north','south'],['parallel','series'],['oxidizes','reduces'],
  ['donor','acceptor'],['donates','accepts'],['gains','loses'],['releases','absorbs'],['heterotroph','autotroph'],['prokaryotic','eukaryotic'],['gram-positive','gram-negative']];
const OPP = new Map(); OPPOSITES.forEach(([a, b]) => { (OPP.get(a) || OPP.set(a, new Set()).get(a)).add(b); (OPP.get(b) || OPP.set(b, new Set()).get(b)).add(a); });
const NEGATION = /\b(not|no|never|neither|nor|isn't|isnt|aren't|arent|doesn't|doesnt|don't|dont|didn't|didnt|won't|wont|cannot|can't|cant|instead|rather)\b|n't\b/;
function contradicts(answer, answerWords, key){
  const keyWords = new Set(key.flat().flatMap(p => words(p)));
  const has = w => answerWords.includes(w);
  for(const k of keyWords){ const opp = OPP.get(k); if(opp) for(const o of opp) if(!keyWords.has(o) && has(o)) return 'opposite'; }
  // A negation right before a key term ("not dominant", "isn't the lysosome", "no change in Vmax"). One far from any
  // key term ("binary fission, no mitosis") doesn't matter.
  if(!key.flat().some(p => NEGATION.test(norm(p)))){
    const content = [...keyWords].filter(w => !STOP.has(w));
    for(let i = 0; i < answerWords.length; i++){
      if(!NEGATION.test(answerWords[i])) continue;
      const near = answerWords.slice(i + 1, i + 8);
      if(near.some(w => content.some(k => wordPresent(k, [w], w)))) return 'negation';
    }
  }
  return null;
}
function phrasingMatches(phrase, answerWords, joined, single){
  const all = words(phrase), content = all.filter(w => !STOP.has(w)), need = content.length ? content : all;
  if(!need.length) return false;
  // A label letter ("acid a", "vitamin k", "type b") must appear as written, next to its word: "acid b is a stronger acid" isn't "acid a".
  const alnum = list => list.map(w => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
  const rp = alnum(norm(phrase).split(/\s+/));
  if(rp.length > 1 && rp.some(w => /^[a-z]$/.test(w))) return (' ' + alnum(answerWords).join(' ') + ' ').includes(' ' + rp.join(' ') + ' ');
  // On a one-concept key, a one-word phrasing that's tiny or generic ("a", "1", "one", "same") only counts as (nearly) the
  // whole answer, not as a word buried in a sentence about something else.
  if(single && need.length === 1 && (need[0].length <= 1 || !content.length || GENERIC.has(need[0])) && answerWords.length > 3) return false;
  return need.every(w => wordPresent(w, answerWords, joined));
}
// Returns { score: 0..1, matched: [...], missing: [...], verdict: 'right' | 'wrong' | 'unsure' }.
function grade(answer, key){
  const answerWords = words(answer), joined = answerWords.join('');
  const matched = [], missing = [];
  key.forEach((concept, i) => (concept.some(p => phrasingMatches(p, answerWords, joined, key.length === 1)) ? matched : missing).push(i));
  const score = key.length ? matched.length / key.length : 0;
  let verdict = !answerWords.length ? 'wrong' : score === 1 ? 'right' : score === 0 && answerWords.length < 3 ? 'wrong' : 'unsure', reason = null;
  if(verdict === 'right' && (reason = contradicts(answer, answerWords, key))) verdict = 'unsure';
  if(verdict === 'right' && key.length === 1 && answerWords.filter(w => !STOP.has(w)).length > LONG){ verdict = 'unsure'; reason = 'long'; }   // every concept is there, but so is something that may undo it
  return { score, matched, missing, verdict, reason };
}
const api = { grade, norm, words, OPPOSITES };
if(typeof module === 'object' && module.exports) module.exports = api; else root.TabiMatch = api;
})(typeof self !== 'undefined' ? self : this);
