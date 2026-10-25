const d = require('../pkg1_extract.js');
const fs = require('fs');
// reads argv[2] site file via pkg1_extract (it reads process.argv[2])
fs.writeFileSync('cards.json', JSON.stringify({ CARDS:d.CARDS, REVERSE:d.REVERSE, CATEGORIES:d.CATEGORIES, SECTIONS:d.SECTIONS }, null, 0));
console.log('ok', d.CARDS.length);
