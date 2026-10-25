// The site's FSRS + mastery code must match the version that was validated in simulation (pkg2/sched.js).
const boot = require('./harness.js'), S = require('../tools/scheduler-eval/sched.js');
const { A } = { A: boot({ clock: Date.UTC(2026,9,22,17) }).api };
let bad = 0, n = 0, seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const iso = d => new Date(Date.UTC(2026, 0, 1) + d * 864e5).toISOString().slice(0, 10);
for(let i = 0; i < 3000; i++){
  let day = 0; const hs = [], es = [];
  const len = 1 + Math.floor(r() * 25);
  for(let j = 0; j < len; j++){
    day += r() < 0.2 ? 0 : Math.floor(r() * 40);
    const x = r(), rt = x < 0.2 ? 'again' : x < 0.35 ? 'hard' : 'good', b = r() < 0.05;
    hs.push(Object.assign({ d: iso(day), r: rt }, b ? { b: 1 } : {})); es.push(Object.assign({ day, r: rt }, b ? { b: 1 } : {}));
  }
  const a = A.memoryFrom(hs), c = S.memoryFrom(es); n++;
  if(!a.m || !c.m){ if(a.m !== c.m || a.level !== c.level) bad++; continue; }
  if(a.level !== c.level || Math.abs(a.m.S - c.m.S) > 1e-9 || Math.abs(a.m.D - c.m.D) > 1e-9) bad++;
}
console.log(bad ? `FAIL parity: ${bad} of ${n} histories differ` : `PASS parity: ${n} random histories give identical memory and level`); process.exit(bad ? 1 : 0);
