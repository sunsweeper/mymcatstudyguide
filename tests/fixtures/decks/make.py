# Builds the small Anki packages used by tests/deck-import-browser.test.js (python3 make.py; needs: pip install zstandard).
import sqlite3, zipfile, os, tempfile, zstandard
def db(notes):
    path = tempfile.mktemp(); c = sqlite3.connect(path)
    c.execute('create table notes (id integer primary key, mid integer, flds text)')
    for i, f in enumerate(notes): c.execute('insert into notes values (?,?,?)', (i + 1, 1, '\x1f'.join(f)))
    c.commit(); c.close(); data = open(path, 'rb').read(); os.remove(path); return data
basic = [
    ['What is the powerhouse of the cell?', 'The <b>mitochondrion</b><img src="mito.png"><script>alert(1)</script>'],
    ['<a href="javascript:alert(1)" onclick="x()">Krebs</a> cycle location?', 'Mitochondrial matrix'],
    ['{{c1::Glycolysis}} happens in the {{c2::cytoplasm::where?}}.', 'Extra: no oxygen needed'],
    ['Empty back', ''],
]
stub = [['Please update to the latest Anki version, then import the .colpkg/.apkg file again.', '']]
with zipfile.ZipFile('basic.apkg', 'w') as z: z.writestr('collection.anki2', db(basic)); z.writestr('media', '{}')
with zipfile.ZipFile('modern.apkg', 'w') as z:
    z.writestr('collection.anki2', db(stub))
    z.writestr('collection.anki21b', zstandard.ZstdCompressor().compress(db([['Modern front', 'Modern back'], ['Second', 'Two']])))
with zipfile.ZipFile('stub-only.apkg', 'w') as z: z.writestr('collection.anki2', db(stub))
open('plain.txt', 'w').write('#separator:tab\n#html:true\n#notetype column:1\n#tags column:4\nBasic\tFront <i>one</i>\tBack one\ttag1\nBasic\tFront two\tBack two\t\n')
open('simple.csv', 'w').write('front,back\n"Hello, world","A ""quoted"" answer\nwith a new line"\nSecond,Two\n')
