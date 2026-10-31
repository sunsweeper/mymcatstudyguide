// Finds the card data literals in index.html (start/end offsets), so they can be exported or stripped.
'use strict';
const NAMES = ['EXPLAIN', 'REVERSE', 'CARDS', 'GRAPHIC_CARDS'];
function span(src, name){
  const i = src.indexOf(`\nconst ${name} =`); if(i < 0) throw new Error(`${name} not found in index.html`);
  let j = src.indexOf('=', i) + 1, depth = 0, k = j, started = false, q = null;
  for(; k < src.length; k++){
    const ch = src[k];
    if(q){ if(ch === '\\'){ k++; continue; } if(ch === q) q = null; continue; }
    if(ch === '"' || ch === "'" || ch === '`'){ q = ch; continue; }
    if(ch === '[' || ch === '{'){ depth++; started = true; }
    else if(ch === ']' || ch === '}'){ depth--; if(started && depth === 0){ k++; break; } }
  }
  return { start: j, end: k, value: Function('"use strict";return (' + src.slice(j, k) + ')')() };
}
module.exports = { NAMES, span };
