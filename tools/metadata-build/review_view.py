import json, re, sys
d = json.load(open('cards.json')); cat = json.load(open('catalog_draft.json')); sc = json.load(open('auto_scores.json'))
top = [c for c in cat['concepts'] if c['parent_concept_id'] is None]
def plain(h): return re.sub(r'<[^>]+>', '', h)
for g in sys.argv[1:]:
    cands = [x for x in top if g in x['content_categories']]
    idx = {x['id']: i for i, x in enumerate(cands)}
    print(f"=== {g} candidates:")
    print(' | '.join(f"{i}:{x['name'][:38]}" for i, x in enumerate(cands)))
    for c in d['CARDS']:
        if c[3].split('-')[0] != g: continue
        s = sc[c[3]]
        print(f"{c[3]} Q:{plain(c[1])[:80]} A:{plain(c[2])[:50]} -> " + ' '.join(f"{idx[k]}({v:.2f})" for v, k in s))
