// Pull CARDS, REVERSE, CATEGORIES, SECTIONS out of the site file without running it.
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
const js = src.split('<script>')[1].split('</script>')[0];
const grab = name => { const i = js.indexOf(`const ${name} =`); if(i < 0) throw new Error(name); let j = js.indexOf('=', i) + 1, depth = 0, k = j, started = false, q = null;
  for(; k < js.length; k++){ const ch = js[k];
    if(q){ if(ch === '\\'){ k++; continue; } if(ch === q) q = null; continue; }
    if(ch === '"' || ch === "'" || ch === '`'){ q = ch; continue; }
    if(ch === '[' || ch === '{'){ depth++; started = true; } else if(ch === ']' || ch === '}'){ depth--; if(started && depth === 0){ k++; break; } } }
  return Function('"use strict";return (' + js.slice(j, k) + ')')(); };
module.exports = { CARDS:grab('CARDS'), REVERSE:grab('REVERSE'), CATEGORIES:grab('CATEGORIES'), SECTIONS:grab('SECTIONS') };
if(require.main === module){ const d = module.exports; console.log(d.CARDS.length, Object.keys(d.REVERSE).length, Object.keys(d.CATEGORIES).length, JSON.stringify(d.SECTIONS).slice(0,300));
  const by = {}; d.CARDS.forEach(c => { const g = c[3].split('-')[0]; by[g] = (by[g]||0)+1; }); console.log(JSON.stringify(by)); console.log(JSON.stringify(d.CATEGORIES)); console.log(JSON.stringify(d.CARDS.slice(0,3))); console.log(JSON.stringify(Object.entries(d.REVERSE).slice(0,2))); }
