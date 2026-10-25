# Builds the concept catalog from the AAMC outline (outline.json) plus the AAMC skill descriptions for CARS and research skills.
import json, re
outline = json.load(open('outline.json'))
SECTION_OF = {}
for c in ['1A','1B','1C','1D','2A','2B','2C','3A','3B']: SECTION_OF[c] = 'BB'
for c in ['4A','4B','4C','4D','4E','5A','5B','5C','5D','5E']: SECTION_OF[c] = 'CP'
for c in ['6A','6B','6C','7A','7B','7C','8A','8B','8C','9A','9B','10A']: SECTION_OF[c] = 'PS'
SECTIONS = {'BB':'Biological and Biochemical Foundations of Living Systems','CP':'Chemical and Physical Foundations of Biological Systems','PS':'Psychological, Social, and Biological Foundations of Behavior','CARS':'Critical Analysis and Reasoning Skills','SIRS':'Scientific Inquiry and Reasoning Skills (tested in all three science sections)'}
DISC_RE = re.compile(r'\s*\((?:BIO|BC|OC|GC|PHY|PSY|SOC)(?:[,;]\s*(?:BIO|BC|OC|GC|PHY|PSY|SOC))*\)\s*$')
def clean(s):
    s = re.split(r'\s+Number of Questions|\s+©', s)[0]
    s = re.sub(r'\s*\((?:BIO|BC|OC|GC|PHY|PSY|SOC)(?:[,;]\s*(?:BIO|BC|OC|GC|PHY|PSY|SOC))*\)', '', s)
    return re.sub(r'\s+', ' ', s).strip()
def slug(s): return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower().replace('ʹ', '').replace('’', ''))).strip('-')[:60]
SRC = 'AAMC, What’s on the MCAT Exam? content outline (2020), p.'  # page filled where known
subtopics = []; concepts = {}; by_norm = {}
GENERIC = {'description','structure','function','binding','general','classification','properties','definition','types','mechanism','mechanisms','regulation','overview','(general)','acidic or basic','structure and function','important reactions','general principles','nomenclature','physical properties','synthesis','reactions','sources','role','control'}
def add_concept(name, cat, subtopic_id, parent=None, kind='concept', topic_name=''):
    nm = clean(name)
    if nm.lower() in GENERIC and topic_name: nm = f"{topic_name}: {nm[0].lower() + nm[1:]}"
    key = (nm.lower(), parent is None)
    if key in by_norm and parent is None:
        c = concepts[by_norm[key]]
        if cat not in c['content_categories']: c['content_categories'].append(cat)
        if SECTION_OF[cat] not in c['mcat_sections']: c['mcat_sections'].append(SECTION_OF[cat])
        if subtopic_id not in c['subtopic_ids']: c['subtopic_ids'].append(subtopic_id)
        return c['id']
    base = f"{cat}.{slug(nm)}" if parent is None else f"{parent}.{slug(nm)}"
    cid = base; n = 2
    while cid in concepts: cid = f"{base}-{n}"; n += 1
    concepts[cid] = {'id':cid, 'name':nm, 'kind':kind, 'mcat_sections':[SECTION_OF[cat]], 'content_categories':[cat], 'subtopic_ids':[subtopic_id], 'parent_concept_id':parent,
                     'related_concept_ids':[], 'prerequisite_concept_ids':[], 'source':'AAMC MCAT content outline (2020), content category ' + cat}
    if parent is None: by_norm[key] = cid
    return cid
# The PDF's two-column layout occasionally glues the next heading onto the last bullet before it; strip that.
for cat, topics in outline.items():
    names = [clean(t['name']) for t in topics]
    for t in topics:
        for s in t['subs']:
            for nm in names:
                cs = clean(s['name'])
                if cs.endswith(' ' + nm) and cs != nm: s['name'] = cs[:-len(nm)].rstrip()
for cat, topics in outline.items():
    for t in topics:
        tname = clean(t['name']); st_id = f"{cat}.st.{slug(tname)}"
        disc = re.findall(r'\(([^)]*)\)\s*$', t['name']); 
        subtopics.append({'id':st_id, 'name':tname, 'content_category':cat, 'mcat_section':SECTION_OF[cat], 'disciplines':(disc[0].replace(';', ',').split(', ') if disc else []), 'concept_ids':[], 'source':'AAMC MCAT content outline (2020), content category ' + cat})
        for s in t['subs']:
            cid = add_concept(s['name'], cat, st_id, topic_name=tname)
            subtopics[-1]['concept_ids'].append(cid)
            for l in s['leaves']:
                lid = add_concept(l['name'], cat, st_id, parent=cid, kind='subconcept')
# Outline topics that list no sub-items become a single concept (added last so existing review indexes stay put).
for cat, topics in outline.items():
    for t in topics:
        if not t['subs']:
            tname = clean(t['name']); st_id = f"{cat}.st.{slug(tname)}"
            cid = add_concept(t['name'], cat, st_id, topic_name=tname)
            next(s for s in subtopics if s['id'] == st_id)['concept_ids'].append(cid)
# CARS and research skills: the outline describes these as skills rather than topic lists; concepts below follow its headings.
SKILLS = {
 'C1': ('CARS', 'Foundations of Comprehension', ['Understanding the basic components of the text (main idea, thesis, specific examples, literal meaning)', 'Inferring meaning or intent from immediate sentence context (word choice, rhetorical devices, tone, passage structure)']),
 'C2': ('CARS', 'Reasoning Within the Text', ['Integrating distant components of the text (author’s message, purpose, position, assumptions, bias, points of view)', 'Recognizing and evaluating arguments (claims, evidence, logic, credibility, causality)']),
 'C3': ('CARS', 'Reasoning Beyond the Text', ['Applying or extrapolating ideas from the passage to new contexts', 'Assessing the impact of introducing new factors, information, or conditions to ideas from the passage']),
 'S3': ('SIRS', 'Skill 3: Reasoning About the Design and Execution of Research', ['Hypotheses and testable research questions', 'Sampling and generalizing to a population', 'Manipulating and controlling variables (experimental design, controls)', 'Measurement and recording of results', 'Faulty research logic and study limitations', 'Confounding factors and alternative explanations', 'Research ethics (rights, safety and privacy of participants; integrity of research)']),
 'S4': ('SIRS', 'Skill 4: Data-Based and Statistical Reasoning', ['Reading and interpreting tables, graphs, and charts', 'Measures of central tendency and dispersion', 'Random and systematic error', 'Uncertainty and statistical testing (significance, confidence intervals, power)', 'Comparing variables, explaining relationships, and making predictions from data', 'Correlation versus causation; drawing inferences from results']),
 'C0': ('CARS', 'Test format and pacing (site-specific; not an AAMC content category)', ['CARS section format, timing, and pacing strategy']),
}
for cat, (sec, title, names) in SKILLS.items():
    SECTION_OF[cat] = sec
    st_id = f"{cat}.st.{slug(title)}"
    subtopics.append({'id':st_id, 'name':title, 'content_category':cat, 'mcat_section':sec, 'disciplines':[], 'concept_ids':[], 'source':('Site-specific study-strategy topic; not part of the AAMC outline' if cat == 'C0' else 'AAMC MCAT content outline (2020): ' + title)})
    for nm in names:
        cid = f"{cat}.{slug(nm)}"
        concepts[cid] = {'id':cid, 'name':nm, 'kind':'skill', 'mcat_sections':[sec], 'content_categories':[cat], 'subtopic_ids':[st_id], 'parent_concept_id':None, 'related_concept_ids':[], 'prerequisite_concept_ids':[], 'source':subtopics[-1]['source']}
        subtopics[-1]['concept_ids'].append(cid)
json.dump({'sections':SECTIONS, 'section_of_category':SECTION_OF, 'subtopics':subtopics, 'concepts':list(concepts.values())}, open('catalog_draft.json', 'w'), indent=1, ensure_ascii=False)
top = [c for c in concepts.values() if c['parent_concept_id'] is None]
print('subtopics', len(subtopics), 'concepts', len(top), 'subconcepts', len(concepts) - len(top), 'shared across categories', sum(1 for c in top if len(c['content_categories']) > 1))
print([ (c['name'], c['content_categories']) for c in top if len(c['content_categories'])>1][:15])
