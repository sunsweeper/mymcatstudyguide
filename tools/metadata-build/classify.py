# Proposes a primary (and possible secondary) concept for each card by text similarity to the concept catalog,
# limited to the card's own AAMC content category (known from its ID). Low-confidence results are flagged for review.
import json, re, math, collections
d = json.load(open('cards.json')); cat = json.load(open('catalog_draft.json'))
STOP = set('a an the of to and or in on for by with is are be as at from that this which what why how does do it its their into than then when where who whom whose can may more most less not no between during each per vs versus'.split())
def plain(h): return re.sub(r'<[^>]+>', ' ', h)
def stem(w):
    for suf in ('ization','ations','ation','ments','ment','ness','ities','ity','ies','ing','ed','es','s','al','ic','ive'):
        if len(w) > len(suf) + 3 and w.endswith(suf): return w[:-len(suf)]
    return w
def toks(s): return [stem(w) for w in re.findall(r"[a-zα-ωΔδ0-9]+", plain(s).lower().replace('’', "'")) if w not in STOP and len(w) > 1]
top = [c for c in cat['concepts'] if c['parent_concept_id'] is None]
kids = collections.defaultdict(list)
for c in cat['concepts']:
    if c['parent_concept_id']: kids[c['parent_concept_id']].append(c['name'])
stname = {s['id']: s['name'] for s in cat['subtopics']}
cdoc = {c['id']: toks(c['name']) * 3 + toks(' '.join(kids[c['id']])) * 2 + toks(' '.join(stname[s] for s in c['subtopic_ids'])) for c in top}
def card_text(c):
    rv = d['REVERSE'].get(c[3]); extra = ' '.join(x for x in (rv or []) if x)
    return c[1] + ' ' + c[2] + ' ' + extra
cards_t = {c[3]: toks(card_text(c)) for c in d['CARDS']}
# idf over concepts + cards
docs = list(cdoc.values()) + list(cards_t.values())
df = collections.Counter(w for doc in docs for w in set(doc)); N = len(docs)
idf = {w: math.log((N + 1) / (n + 1)) + 1 for w, n in df.items()}
def vec(t):
    tf = collections.Counter(t); v = {w: (1 + math.log(n)) * idf.get(w, 1) for w, n in tf.items()}
    norm = math.sqrt(sum(x * x for x in v.values())) or 1
    return {w: x / norm for w, x in v.items()}
cvec = {k: vec(v) for k, v in cdoc.items()}
def cos(a, b): return sum(x * b.get(w, 0) for w, x in a.items())
out = {}
for c in d['CARDS']:
    g = c[3].split('-')[0]
    cands = [x['id'] for x in top if g in x['content_categories']]
    v = vec(cards_t[c[3]])
    sc = sorted(((cos(v, cvec[k]), k) for k in cands), reverse=True)[:3]
    out[c[3]] = sc
json.dump(out, open('auto_scores.json', 'w'), indent=0)
s1 = [v[0][0] for v in out.values()]
for th in (0.05, 0.1, 0.15, 0.2, 0.3): print(th, sum(1 for x in s1 if x >= th))
