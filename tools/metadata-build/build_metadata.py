# Package 1: builds the card metadata layer, concept catalog, prerequisite graph and card relationships, plus reports.
# Reads only; the site's flashcards are never modified.
import json, re, math, hashlib, collections, os, datetime
OUT = 'out'; os.makedirs(OUT + '/metadata', exist_ok=True); os.makedirs(OUT + '/docs/package-1', exist_ok=True)
d = json.load(open('cards.json')); cat = json.load(open('catalog_draft.json'))
exec(open('prerequisites.py').read())
exec(open('pair_labels.py').read())
CARDS = d['CARDS']; REVERSE = d['REVERSE']; CATNAME = d['CATEGORIES']
TODAY = '2026-10-25'; META_VERSION = '1.0.0'; CONTENT_VERSION = 'cards-v1'
concepts = {c['id']: c for c in cat['concepts']}
top = [c for c in cat['concepts'] if c['parent_concept_id'] is None]
SECTION_OF = cat['section_of_category']
def plain(h): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', h).replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')).strip()
def sha(s): return hashlib.sha256(s.encode('utf-8')).hexdigest()
def card_hash(c): rv = REVERSE.get(c[3]); return sha(json.dumps([c[0], c[1], c[2], c[3], rv], ensure_ascii=False, separators=(',', ':')))
# ---- candidate lists (same order the review used) ----
cands = {}
for g in CATNAME:
    cands[g] = [x['id'] for x in top if g in x['content_categories']]
# ---- decisions ----
dec = {}
for ln in open('decisions.txt', encoding='utf-8'):
    if ln.startswith('#') or not ln.strip(): continue
    g, *toks = ln.split()
    for t in toks:
        n, v = t.split(':', 1); cid = f"{g}-{n}"; parts = v.split(','); res = []; flag = False
        for p in parts:
            if p.endswith('?'): flag = True; p = p[:-1]
            if '.' in p: gg, ix = p.split('.'); res.append(cands[gg][int(ix)])
            else: res.append(cands[g][int(p)])
        dec[cid] = {'primary': res[0], 'secondary': res[1:], 'unsure': flag}
# ---- documented curriculum weight: AAMC foundational-concept / skill percentages (outline p. 2-3 of each section) ----
FC = {'1': 55, '2': 20, '3': 25, '4': 40, '5': 60, '6': 25, '7': 35, '8': 20, '9': 15, '10': 5}
fc_of = lambda g: re.match(r'(\d+)', g).group(1) if re.match(r'\d', g) else None
ncat_in_fc = collections.Counter(fc_of(g) for g in CATNAME if fc_of(g))
def weight(g):
    if fc_of(g): return round(FC[fc_of(g)] / ncat_in_fc[fc_of(g)], 2), f"Foundational Concept {fc_of(g)} = {FC[fc_of(g)]}% of its section, split evenly across its {ncat_in_fc[fc_of(g)]} content categories"
    if g in ('C1', 'C2'): return 30.0, 'CARS skill weight 30% (AAMC)'
    if g == 'C3': return 40.0, 'CARS skill weight 40% (AAMC)'
    if g in ('S3', 'S4'): return 10.0, 'Scientific Inquiry and Reasoning Skill weight 10% of each science section (AAMC)'
    return None, 'Not an AAMC-weighted category (site study-strategy content)'
def tier(w): return None if w is None else ('high' if w >= 12 else 'medium' if w >= 7 else 'low')
# ---- cognitive skill / retrieval format / difficulty (provisional heuristics, documented) ----
SCEN = re.compile(r'^(A|An|Two|If|In a|After|Scores|Volunteers|Drugs|Hospital|Hospitals|The 95%|A study|A researcher|A drug|A neuron|A buffer|A mutation|A bacterium|A student|A clinic|A survey|A trial|A diet|A correlational|An object|An ATP|An extreme|Two unaffected|Two identical|Two group|Two neighborhoods|A person)\b')
def skill(c):
    q = plain(c[1]); g = c[3].split('-')[0]
    if g in ('S3', 'S4', 'C2', 'C3') and (SCEN.match(q) or re.search(r'conclude|interpret|suggest|What can you|Which conclusion|likely', q, re.I)): return 'reasoning'
    if SCEN.match(q) or re.search(r'\b(how much|how many|what percentage|what fraction|by what factor)\b', q, re.I) or re.search(r'\d', q) and re.search(r'\b(if|when)\b', q, re.I): return 'application'
    if re.match(r'^(Why|How does|How do|How can|How is|How are|How should|What determines|What drives|What happens|What causes|What mainly)', q) or re.search(r'\bvs\.|\bversus\b|\bdiffer|\bdistinguish', q): return 'conceptual_understanding'
    if g in ('S3', 'S4', 'C1', 'C2', 'C3'): return 'conceptual_understanding'
    return 'retrieval'
def formats(c):
    f = ['text_recall_question_first']
    if c[3] in REVERSE: f.append('reverse_recall_answer_first')
    return f
def difficulty(c, sk):
    a = len(plain(c[2]))
    if sk in ('application', 'reasoning') or a > 160: return 3
    if sk == 'conceptual_understanding' or a > 80: return 2
    return 1
# ---- text similarity for duplicates / related cards ----
STOP = set('a an the of to and or in on for by with is are be as at from that this which what why how does do it its their into than then when where who can may more most not no vs versus'.split())
GREEK = {'α': ' alpha ', 'β': ' beta ', 'γ': ' gamma ', 'δ': ' delta ', 'Δ': ' delta ', 'σ': ' sigma ', 'π': ' pi ', 'λ': ' lambda ', 'μ': ' mu '}
def toks(s):
    t = plain(s)
    for k, v in GREEK.items(): t = t.replace(k, v)
    return [w for w in re.findall(r"[a-z0-9]+", t.lower()) if w not in STOP]
docs_q = {c[3]: toks(c[1]) for c in CARDS}; docs_a = {c[3]: toks(c[2]) for c in CARDS}; docs_qa = {c[3]: toks(c[1] + ' ' + c[2]) for c in CARDS}
def tfidf(docs):
    df = collections.Counter(w for v in docs.values() for w in set(v)); N = len(docs); out = {}
    for k, v in docs.items():
        tf = collections.Counter(v); vec = {w: (1 + math.log(n)) * math.log((N + 1) / (df[w] + 1)) for w, n in tf.items()}
        nrm = math.sqrt(sum(x * x for x in vec.values())) or 1; out[k] = {w: x / nrm for w, x in vec.items()}
    return out
VQ, VA, VQA = tfidf(docs_q), tfidf(docs_a), tfidf(docs_qa)
def cos(a, b): return sum(x * b.get(w, 0) for w, x in a.items())
ids = [c[3] for c in CARDS]; byid = {c[3]: c for c in CARDS}
norm = lambda s: re.sub(r'[^a-z0-9]+', ' ', plain(s).lower()).strip()
relations = []
for i in range(len(ids)):
    for j in range(i + 1, len(ids)):
        a, b = ids[i], ids[j]
        sq, sa, sqa = cos(VQ[a], VQ[b]), cos(VA[a], VA[b]), cos(VQA[a], VQA[b])
        ca, cb = byid[a], byid[b]
        same = dec[a]['primary'] == dec[b]['primary']
        if norm(ca[1]) == norm(cb[1]) and norm(ca[2]) == norm(cb[2]): t = 'exact_duplicate'
        elif norm(ca[1]) == norm(cb[1]) or sqa >= 0.75 or (same and sq >= 0.6): t = 'near_duplicate'
        elif same and (sa >= 0.55 or sqa >= 0.45): t = 'same_fact_different_wording'
        else: continue
        lab = LABEL.get((a, b))
        relations.append({'card_id_a': a, 'card_id_b': b, 'relation': lab or t, 'machine_suggestion': t, 'similarity': {'question': round(sq, 3), 'answer': round(sa, 3), 'combined': round(sqa, 3)}, 'review_status': 'ai_reviewed' if lab else 'flagged_for_review'})
# same primary concept: complementary (different aspects) or application-of
cards_by_primary = collections.defaultdict(list)
for c in CARDS: cards_by_primary[dec[c[3]]['primary']].append(c[3])
skills = {c[3]: skill(c) for c in CARDS}
paired = {(r['card_id_a'], r['card_id_b']) for r in relations}
for cid, group in cards_by_primary.items():
    for i in range(len(group)):
        for j in range(i + 1, len(group)):
            a, b = sorted([group[i], group[j]], key=ids.index)
            if (a, b) in paired: continue
            sa, sb = skills[a], skills[b]
            if (sa in ('application', 'reasoning')) != (sb in ('application', 'reasoning')):
                relations.append({'card_id_a': a, 'card_id_b': b, 'relation': 'application_and_recall_of_same_concept', 'shared_concept_id': cid, 'review_status': 'derived'})
            else:
                relations.append({'card_id_a': a, 'card_id_b': b, 'relation': 'different_aspects_of_same_concept', 'shared_concept_id': cid, 'review_status': 'derived'})
idx_pos = {k: i for i, k in enumerate(ids)}
existing = {(r['card_id_a'], r['card_id_b']): r for r in relations}
for lab, pairs in MANUAL.items():
    for p in pairs:
        a, b = sorted(p.split('|'), key=lambda k: idx_pos[k])
        r = existing.get((a, b))
        if r: r['relation'] = lab; r['review_status'] = 'ai_reviewed'; r.pop('shared_concept_id', None) if lab not in ('application_and_recall_of_same_concept',) else None
        else:
            r = {'card_id_a': a, 'card_id_b': b, 'relation': lab, 'review_status': 'ai_identified_during_review'}; relations.append(r); existing[(a, b)] = r
rel_by_card = collections.defaultdict(list)
for r in relations:
    rel_by_card[r['card_id_a']].append(r); rel_by_card[r['card_id_b']].append(r)
# ---- concept catalog: related (siblings in same subtopic, shared across categories) and prerequisites ----
prereq_edges = collections.defaultdict(list)
for a, b, why in PREREQS: prereq_edges[b].append(a)
# cycle check
def has_cycle():
    color = {}
    def dfs(u):
        color[u] = 1
        for v in [b for a, b, _ in PREREQS if a == u]:
            if color.get(v) == 1 or (color.get(v) is None and dfs(v)): return True
        color[u] = 2; return False
    return any(color.get(u) is None and dfs(u) for u in {a for a, _, _ in PREREQS})
assert not has_cycle(), 'circular prerequisite'
st_by_id = {s['id']: s for s in cat['subtopics']}
for c in top:
    sib = []
    for s in c['subtopic_ids']: sib += [x for x in st_by_id[s]['concept_ids'] if x != c['id']]
    c['related_concept_ids'] = sib[:12]
    c['prerequisite_concept_ids'] = prereq_edges.get(c['id'], [])
for c in cat['concepts']:
    if c['parent_concept_id']: c['related_concept_ids'] = []; c['prerequisite_concept_ids'] = []
# ---- card records ----
records = []
for c in CARDS:
    cid = c[3]; g = cid.split('-')[0]; dd = dec[cid]
    prim = concepts[dd['primary']]; secs = dd['secondary']
    outside = g not in prim['content_categories']
    w, wsrc = weight(g); sk = skills[cid]
    pre = []
    for x in [dd['primary']] + secs: pre += [p for p in prereq_edges.get(x, []) if p not in pre]
    rel = []
    for r in sorted(rel_by_card[cid], key=lambda r: {'exact_duplicate': 0, 'near_duplicate': 1, 'same_fact_different_wording': 2, 'overlapping': 3, 'contrast_pair': 4, 'complementary': 5, 'application_and_recall_of_same_concept': 6, 'different_aspects_of_same_concept': 7}[r['relation']]):
        o = r['card_id_b'] if r['card_id_a'] == cid else r['card_id_a']
        if o not in rel: rel.append(o)
    reasons = []
    if dd['unsure']: reasons.append('best-fit concept is uncertain; the AAMC outline may not list this topic explicitly in this category')
    if outside: reasons.append('primary concept is outside the card’s own content category')
    links = [{'concept_id': dd['primary'], 'role': 'primary', 'confidence': 'low' if dd['unsure'] else 'high'}]
    links += [{'concept_id': s, 'role': 'secondary', 'confidence': 'low' if (dd['unsure'] or g not in concepts[s]['content_categories']) else 'medium'} for s in secs]
    links += [{'concept_id': p, 'role': 'prerequisite', 'confidence': 'proposed'} for p in pre]
    links += [{'concept_id': x, 'role': 'related_not_assessed', 'confidence': 'derived'} for x in prim['related_concept_ids'][:4]]
    records.append({
        'card_id': cid,
        'mcat_section': SECTION_OF.get(g),
        'content_category': g,
        'content_category_name': CATNAME[g],
        'primary_concept_id': dd['primary'],
        'secondary_concept_ids': secs,
        'subtopic_ids': list(dict.fromkeys(prim['subtopic_ids'] + [s for x in secs for s in concepts[x]['subtopic_ids']])),
        'cognitive_skill': sk,
        'retrieval_format': formats(c),
        'difficulty_level': difficulty(c, sk),
        'difficulty_basis': 'provisional heuristic (answer length and cognitive skill); replace with student performance data later',
        'curriculum_priority': tier(w),
        'curriculum_weight_pct': w,
        'curriculum_priority_basis': wsrc,
        'prerequisite_concept_ids': pre,
        'related_card_ids': rel[:10],
        'concept_links': links,
        'content_version': CONTENT_VERSION,
        'content_hash': card_hash(c),
        'metadata_version': META_VERSION,
        'review_status': 'flagged_for_review' if reasons else 'ai_classified_and_reviewed',
        'review_notes': reasons,
        'classified_by': 'AI-assisted (automatic text-similarity proposal, then item-by-item AI review); not yet verified by a content expert',
        'classified_on': TODAY,
    })
# ---- write ----
catalog = {'catalog_version': META_VERSION, 'generated_on': TODAY, 'source': 'AAMC, What’s on the MCAT Exam? content outline (2020 edition, in this repo as 3-2020_whats_on_the_mcat_content_outline.pdf)',
           'hierarchy': 'Section → Content Category → Subtopic → Concept (→ Subconcept)', 'sections': cat['sections'],
           'content_categories': {g: {'name': CATNAME[g], 'mcat_section': SECTION_OF.get(g), 'curriculum_weight_pct': weight(g)[0], 'curriculum_weight_basis': weight(g)[1]} for g in CATNAME},
           'subtopics': cat['subtopics'], 'concepts': cat['concepts']}
json.dump(catalog, open(OUT + '/metadata/concepts.json', 'w'), indent=1, ensure_ascii=False)
json.dump({'metadata_version': META_VERSION, 'content_version': CONTENT_VERSION, 'generated_on': TODAY, 'card_count': len(records), 'cards': records}, open(OUT + '/metadata/cards.json', 'w'), indent=1, ensure_ascii=False)
json.dump({'metadata_version': META_VERSION, 'edges': [{'prerequisite_concept_id': a, 'dependent_concept_id': b, 'rationale': why, 'review_status': 'proposed'} for a, b, why in PREREQS], 'acyclic': True}, open(OUT + '/metadata/prerequisites.json', 'w'), indent=1, ensure_ascii=False)
json.dump({'metadata_version': META_VERSION, 'relations': relations}, open(OUT + '/metadata/card_relations.json', 'w'), indent=1, ensure_ascii=False)
stats = collections.Counter(r['relation'] for r in relations)
print('records', len(records), 'flagged', sum(r['review_status'] != 'ai_classified_and_reviewed' for r in records), 'relations', dict(stats))
print('skills', collections.Counter(skills.values()), 'difficulty', collections.Counter(r['difficulty_level'] for r in records))
