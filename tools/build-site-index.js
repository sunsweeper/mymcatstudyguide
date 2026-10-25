// Builds the compact concept index the site embeds for the Weakness Dashboard (Package 2, Phase 4) from metadata/.
// Usage: node tools/build-site-index.js > index.json   (the page holds it between /*META-INDEX*/ markers)
'use strict';
const fs = require('fs'), path = require('path');
const M = f => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'metadata', f), 'utf8'));
const cards = M('cards.json').cards, cat = M('concepts.json'), pre = M('prerequisites.json').edges, rel = M('card_relations.json').relations;
const stName = Object.fromEntries(cat.subtopics.map(s => [s.id, s.name])), cName = Object.fromEntries(cat.concepts.map(c => [c.id, c.name]));
const st = [], stIx = {}, co = [], coIx = {};
const sIx = id => (id in stIx) ? stIx[id] : (stIx[id] = st.push([id.split('.')[0], stName[id] || id]) - 1);
const cIx = id => (id in coIx) ? coIx[id] : (coIx[id] = co.push(cName[id] || id) - 1);
const PR = { high:3, medium:2, low:1 };
const c = {};
const SK = { retrieval:0, conceptual_understanding:1, application:2, reasoning:3 };
// [subtopic, concept, curriculum weight %, priority 1-3, skill (0 recall, 1 conceptual, 2 application, 3 reasoning), difficulty 1-3]
for(const r of cards) c[r.card_id] = [sIx(r.subtopic_ids[0]), cIx(r.primary_concept_id), +(r.curriculum_weight_pct || 0).toFixed(2), PR[r.curriculum_priority] || 0, SK[r.cognitive_skill] || 0, r.difficulty_level || 1];
// prerequisite links between concepts that have cards: dependent -> [prerequisite]
const p = {};
for(const e of pre){ if(e.prerequisite_concept_id in coIx && e.dependent_concept_id in coIx){ const d = coIx[e.dependent_concept_id]; (p[d] = p[d] || []).push(coIx[e.prerequisite_concept_id]); } }
// near-duplicate card pairs (same fact, different wording) so sessions don't show them back to back
const d = rel.filter(r => r.relation === 'near_duplicate' || r.relation === 'same_fact_different_wording').map(r => [r.card_id_a, r.card_id_b]);
process.stdout.write(JSON.stringify({ v: M('cards.json').metadata_version, st, co, c, p, d }));
