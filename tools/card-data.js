// Reads the flashcard library out of index.html without running the site. No dependencies.
'use strict';
const fs = require('fs'), crypto = require('crypto');
function grab(js, name){
  const i = js.indexOf(`const ${name} =`); if(i < 0) throw new Error(`${name} not found in index.html`);
  let j = js.indexOf('=', i) + 1, depth = 0, k = j, started = false, q = null;
  for(; k < js.length; k++){
    const ch = js[k];
    if(q){ if(ch === '\\'){ k++; continue; } if(ch === q) q = null; continue; }
    if(ch === '"' || ch === "'" || ch === '`'){ q = ch; continue; }
    if(ch === '[' || ch === '{'){ depth++; started = true; }
    else if(ch === ']' || ch === '}'){ depth--; if(started && depth === 0){ k++; break; } }
  }
  return Function('"use strict";return (' + js.slice(j, k) + ')')();
}
function readCards(file){
  const src = fs.readFileSync(file, 'utf8');
  const js = src.split('<script>')[1].split('</script>')[0];
  return { CARDS: grab(js, 'CARDS'), REVERSE: grab(js, 'REVERSE'), CATEGORIES: grab(js, 'CATEGORIES') };
}
const sha = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
// The hash covers everything that defines a card: section key, question, answer, ID and its reverse side (exact HTML text).
const cardHash = (c, REVERSE) => sha(JSON.stringify([c[0], c[1], c[2], c[3], REVERSE[c[3]] === undefined ? null : REVERSE[c[3]]]));
module.exports = { readCards, sha, cardHash };
