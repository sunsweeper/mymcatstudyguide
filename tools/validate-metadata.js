#!/usr/bin/env node
// Validates the card metadata layer (Package 1, section 8). Usage: node tools/validate-metadata.js
'use strict';
const fs = require('fs'), path = require('path');
const { readCards, cardHash } = require('./card-data');
const root = path.join(__dirname, '..');
const load = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const { CARDS, REVERSE } = readCards(path.join(root, 'index.html'));
const meta = load('metadata/cards.json'), cat = load('metadata/concepts.json'), pre = load('metadata/prerequisites.json'), rel = load('metadata/card_relations.json');
const errors = [], warn = [];
const concepts = new Map(cat.concepts.map(c => [c.id, c]));
const subtopics = new Set(cat.subtopics.map(s => s.id));
const cardIds = new Set(CARDS.map(c => c[3]));
const recIds = new Map();
for(const r of meta.cards){
  if(recIds.has(r.card_id)) errors.push(`duplicate metadata record for ${r.card_id}`);
  recIds.set(r.card_id, r);
}
for(const id of cardIds) if(!recIds.has(id)) errors.push(`card ${id} has no metadata record`);
for(const id of recIds.keys()) if(!cardIds.has(id)) errors.push(`metadata record for nonexistent card ${id}`);
const SKILLS = new Set(['retrieval', 'conceptual_understanding', 'application', 'reasoning']);
for(const c of CARDS){
  const r = recIds.get(c[3]); if(!r) continue;
  const g = c[3].split('-')[0];
  if(r.content_category !== g) errors.push(`${c[3]}: content_category ${r.content_category} doesn't match its ID`);
  if(r.mcat_section !== cat.content_categories[g].mcat_section) errors.push(`${c[3]}: mcat_section inconsistent with its category`);
  if(!r.primary_concept_id) errors.push(`${c[3]}: no primary concept`);
  for(const x of [r.primary_concept_id, ...r.secondary_concept_ids, ...r.prerequisite_concept_ids]) if(x && !concepts.has(x)) errors.push(`${c[3]}: unknown concept ${x}`);
  for(const s of r.subtopic_ids) if(!subtopics.has(s)) errors.push(`${c[3]}: unknown subtopic ${s}`);
  for(const x of r.related_card_ids) if(!cardIds.has(x)) errors.push(`${c[3]}: related card ${x} doesn't exist`);
  if(r.secondary_concept_ids.includes(r.primary_concept_id)) errors.push(`${c[3]}: primary concept repeated as secondary`);
  if(!SKILLS.has(r.cognitive_skill)) errors.push(`${c[3]}: unknown cognitive_skill ${r.cognitive_skill}`);
  if(r.concept_links.filter(l => l.role === 'primary').length !== 1) errors.push(`${c[3]}: must have exactly one primary concept link`);
  if(r.content_hash !== cardHash(c, REVERSE)) errors.push(`${c[3]}: card content differs from the content this metadata was written for`);
  if(r.review_status === 'flagged_for_review') warn.push(c[3]);
}
// concept catalog
for(const c of cat.concepts){
  if(c.parent_concept_id && !concepts.has(c.parent_concept_id)) errors.push(`concept ${c.id}: unknown parent`);
  for(const x of [...c.related_concept_ids, ...c.prerequisite_concept_ids]) if(!concepts.has(x)) errors.push(`concept ${c.id}: unknown linked concept ${x}`);
  for(const s of c.subtopic_ids) if(!subtopics.has(s)) errors.push(`concept ${c.id}: unknown subtopic ${s}`);
}
const names = new Map();
for(const c of cat.concepts.filter(c => !c.parent_concept_id)){ const k = c.name.toLowerCase(); if(names.has(k)) errors.push(`duplicate concept name "${c.name}" (${names.get(k)}, ${c.id})`); names.set(k, c.id); }
// prerequisites: known IDs, no self-links, no cycles
const adj = new Map();
for(const e of pre.edges){
  if(!concepts.has(e.prerequisite_concept_id) || !concepts.has(e.dependent_concept_id)) errors.push(`prerequisite edge with unknown concept: ${e.prerequisite_concept_id} -> ${e.dependent_concept_id}`);
  if(e.prerequisite_concept_id === e.dependent_concept_id) errors.push(`self-prerequisite ${e.dependent_concept_id}`);
  (adj.get(e.prerequisite_concept_id) || adj.set(e.prerequisite_concept_id, []).get(e.prerequisite_concept_id)).push(e.dependent_concept_id);
}
const state = new Map();
const cyc = u => { state.set(u, 1); for(const v of adj.get(u) || []){ if(state.get(v) === 1) return true; if(!state.has(v) && cyc(v)) return true; } state.set(u, 2); return false; };
for(const u of adj.keys()) if(!state.has(u) && cyc(u)) { errors.push('circular prerequisite relationship detected'); break; }
for(const r of rel.relations) if(!cardIds.has(r.card_id_a) || !cardIds.has(r.card_id_b)) errors.push(`relation references a nonexistent card: ${r.card_id_a} / ${r.card_id_b}`);
if(errors.length){ console.error(`METADATA VALIDATION FAILED: ${errors.length} error(s)`); errors.slice(0, 50).forEach(e => console.error(' -', e)); process.exit(1); }
console.log(`Metadata valid: ${meta.cards.length} card records, ${cat.concepts.length} concepts, ${pre.edges.length} prerequisite links, ${rel.relations.length} card relations. ${warn.length} cards flagged for content-expert review.`);
