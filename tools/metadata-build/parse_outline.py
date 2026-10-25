import re, json
lines = open('outline.txt', encoding='utf-8').read().split('\n')
start_re = re.compile(r'^\s{0,6}(\d{1,2}[A-E]):\s')
DISC = re.compile(r'\((?:BIO|BC|OC|GC|PHY|PSY|SOC)(?:[,;]\s*(?:BIO|BC|OC|GC|PHY|PSY|SOC))*\)\s*$')
def right(line):
    for m in re.finditer(r'\s{3,}(?=\S)', line):
        if m.end() >= 45: return m.end(), line[m.end():].rstrip()
    s = line.lstrip()
    if len(line) - len(s) >= 45: return len(line) - len(s), s.rstrip()
    return None, None
# gather (category, col, text) for right-column lines
rows = []; cat = None
for ln in lines:
    if '©' in ln or re.match(r'^\s*\d+\s*$', ln): continue
    m = start_re.match(ln)
    if m: cat = m.group(1)
    if not cat: continue
    if re.match(r'^\s*(Foundational Concept|Section|Scientific Inquiry|CRITICAL ANALYSIS)', ln): 
        if re.match(r'^\s*Foundational Concept', ln): cat = None
        continue
    col, r = right(ln)
    if r: rows.append((cat, col, r))
out = {}
for c in dict.fromkeys(x[0] for x in rows):
    rs = [x for x in rows if x[0] == c]
    topics = []; topic = sub = None; lastitem = None; skip = 0; bcol = -99
    for i, (_, col, r) in enumerate(rs):
        if skip: skip -= 1; continue
        if r.startswith('▪') or re.match(r'^o\s', r): bcol = col if r.startswith('▪') else col - 2
        if r.startswith('▪'):
            sub = {'name': r[1:].strip(), 'leaves': []}
            if topic is None: topic = {'name': '(untitled)', 'subs': []}; topics.append(topic)
            topic['subs'].append(sub); lastitem = sub
        elif re.match(r'^o\s', r):
            leaf = {'name': r[1:].strip()}
            if sub is None:
                if topic is None: topic = {'name': '(untitled)', 'subs': []}; topics.append(topic)
                sub = {'name': '(general)', 'leaves': []}; topic['subs'].append(sub)
            sub['leaves'].append(leaf); lastitem = leaf
        elif (DISC.search(r) and re.match(r'^[A-Z][a-z]', r.strip())) or re.match(r'^Health (Care )?Disparities \(SOC\)', r.strip()):
            topic = {'name': r.strip(), 'subs': []}; topics.append(topic); sub = None; lastitem = topic
        elif lastitem is not None and lastitem is not topic and ((col >= bcol + 2 and abs(col - bcol) < 8) or re.match(r'^\([A-Z, ]+\)$', r.strip())):
            lastitem['name'] += ' ' + r.strip()
        elif DISC.search(r):
            topic = {'name': r.strip(), 'subs': []}; topics.append(topic); sub = None; lastitem = topic
        else:
            plain = lambda x: x and not x[2].startswith('▪') and not re.match(r'^o\s', x[2]) and abs(x[1] - col) <= 1
            n1 = rs[i+1] if i + 1 < len(rs) else None; n2 = rs[i+2] if i + 2 < len(rs) else None
            if r[:1].isupper() and plain(n1) and (DISC.search(n1[2]) or re.search(r'\((?:BIO|BC|OC|GC|PHY|PSY|SOC)(?:,\s*\w+)*,\s*$', r)):
                topic = {'name': r.strip() + ' ' + n1[2].strip(), 'subs': []}; topics.append(topic); sub = None; lastitem = topic; skip = 1
            elif r[:1].isupper() and plain(n1) and not DISC.search(n1[2]) and plain(n2) and DISC.search(n2[2]):
                topic = {'name': ' '.join([r.strip(), n1[2].strip(), n2[2].strip()]), 'subs': []}; topics.append(topic); sub = None; lastitem = topic; skip = 2
            elif lastitem is not None: lastitem['name'] += ' ' + r.strip()
    out[c] = topics
json.dump(out, open('outline.json', 'w'), indent=1, ensure_ascii=False)
for c, ts in out.items():
    print(c, len(ts), sum(len(t['subs']) for t in ts), '|', '; '.join(t['name'] for t in ts)[:400])
