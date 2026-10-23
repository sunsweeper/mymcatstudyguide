# Flashcard ID Registry

Generated 2026-10-23 from `index.html`. Total cards: **895**.

## How IDs work

- Format: `<GROUP>-<NNN>`, for example `1A-004`.
- `GROUP` is the AAMC MCAT content category the card belongs to. `C0` is the one non-AAMC group, for CARS test format and pacing tips.
- `NNN` is a three-digit number, counting up from `001` within each group.
- Each card is stored in `index.html` as `[section, question, answer, id]`. The ID is written on the card, not calculated, so it never changes when cards are added, removed, or reordered.
- **Never reuse an ID.** If a card is deleted, retire its number and leave the gap. Practice-test results will point at these IDs, and a reused ID would link a missed question to the wrong card.
- **Adding a card:** pick its group, give it the group's "next ID" from the table below, add it to `CARDS` in `index.html`, then update this file (count, last used, next ID, and the card list).
- **New group:** add its code and name to `CATEGORIES` in `index.html`, and start numbering at `001`.

## Summary by group

| Section | Group | Name | Cards | Last used | Next ID |
|---|---|---|---:|---|---|
| Bio/Biochem | 1A | Proteins and amino acids | 40 | 1A-040 | 1A-041 |
| Bio/Biochem | 1B | Gene to protein | 39 | 1B-039 | 1B-040 |
| Bio/Biochem | 1C | Heredity and genetic diversity | 22 | 1C-022 | 1C-023 |
| Bio/Biochem | 1D | Bioenergetics and metabolism | 33 | 1D-033 | 1D-034 |
| Bio/Biochem | 2A | Cells and membranes | 28 | 2A-028 | 2A-029 |
| Bio/Biochem | 2B | Prokaryotes and viruses | 30 | 2B-030 | 2B-031 |
| Bio/Biochem | 2C | Cell division and development | 28 | 2C-028 | 2C-029 |
| Bio/Biochem | 3A | Nervous and endocrine systems | 28 | 3A-028 | 3A-029 |
| Bio/Biochem | 3B | Organ systems | 43 | 3B-043 | 3B-044 |
| Chem/Phys | 4A | Motion, forces, and energy | 29 | 4A-029 | 4A-030 |
| Chem/Phys | 4B | Fluids and gases | 28 | 4B-028 | 4B-029 |
| Chem/Phys | 4C | Electrochemistry and circuits | 31 | 4C-031 | 4C-032 |
| Chem/Phys | 4D | Light, sound, and spectroscopy | 28 | 4D-028 | 4D-029 |
| Chem/Phys | 4E | Atoms and nuclear decay | 28 | 4E-028 | 4E-029 |
| Chem/Phys | 5A | Water and solutions | 31 | 5A-031 | 5A-032 |
| Chem/Phys | 5B | Molecular structure and interactions | 29 | 5B-029 | 5B-030 |
| Chem/Phys | 5C | Separation and purification | 27 | 5C-027 | 5C-028 |
| Chem/Phys | 5D | Biological molecules and reactions | 33 | 5D-033 | 5D-034 |
| Chem/Phys | 5E | Thermodynamics and kinetics | 31 | 5E-031 | 5E-032 |
| Psych/Soc | 6A | Sensation and perception | 29 | 6A-029 | 6A-030 |
| Psych/Soc | 6B | Cognition, memory, and consciousness | 41 | 6B-041 | 6B-042 |
| Psych/Soc | 6C | Emotion and stress | 19 | 6C-019 | 6C-020 |
| Psych/Soc | 7A | Biology, personality, motivation, and disorders | 40 | 7A-040 | 7A-041 |
| Psych/Soc | 7B | Social influence on behavior | 21 | 7B-021 | 7B-022 |
| Psych/Soc | 7C | Learning and attitude change | 14 | 7C-014 | 7C-015 |
| Psych/Soc | 8A | Self and identity | 18 | 8A-018 | 8A-019 |
| Psych/Soc | 8B | Social thinking | 17 | 8B-017 | 8B-018 |
| Psych/Soc | 8C | Social interactions | 24 | 8C-024 | 8C-025 |
| Psych/Soc | 9A | Social structure and culture | 19 | 9A-019 | 9A-020 |
| Psych/Soc | 9B | Demographics | 30 | 9B-030 | 9B-031 |
| Psych/Soc | 10A | Social inequality | 16 | 10A-016 | 10A-017 |
| CARS | C0 | Test format and pacing | 4 | C0-004 | C0-005 |
| CARS | C1 | Foundations of comprehension | 6 | C1-006 | C1-007 |
| CARS | C2 | Reasoning within the text | 9 | C2-009 | C2-010 |
| CARS | C3 | Reasoning beyond the text | 2 | C3-002 | C3-003 |

**Totals by section:** Bio/Biochem 291 · Chem/Phys 295 · Psych/Soc 288 · CARS 21

## IDs in use

### 1A · Proteins and amino acids (40)

| ID | Question |
|---|---|
| 1A-001 | Primary structure of a protein? |
| 1A-002 | Secondary structure of a protein? |
| 1A-003 | Tertiary structure of a protein? |
| 1A-004 | Quaternary structure of a protein? |
| 1A-005 | Which amino acid forms disulfide bonds? |
| 1A-006 | Which amino acid tends to break α-helices? |
| 1A-007 | Aromatic amino acids? |
| 1A-008 | Sulfur-containing amino acids? |
| 1A-009 | Do enzymes change ΔG or equilibrium? |
| 1A-010 | Cofactor vs. coenzyme? |
| 1A-011 | Allosteric regulation? |
| 1A-012 | Shape of a cooperative binding curve? |
| 1A-013 | Zymogen? |
| 1A-014 | What activates trypsinogen? |
| 1A-015 | Six enzyme classes? |
| 1A-016 | Kinase vs. phosphatase? |
| 1A-017 | What does Km tell you? |
| 1A-018 | Competitive inhibitor: effect on Km and Vmax? |
| 1A-019 | Noncompetitive inhibitor: effect on Km and Vmax? |
| 1A-020 | Uncompetitive inhibitor: effect on Km and Vmax? |
| 1A-021 | Lineweaver–Burk plot intercepts? |
| 1A-022 | Which amino acids are basic? |
| 1A-023 | Which amino acids are acidic? |
| 1A-024 | The only achiral amino acid? |
| 1A-025 | Define isoelectric point (pI). |
| 1A-026 | Why does proline often disrupt an alpha helix? |
| 1A-027 | What happens to a protein's net charge below its isoelectric point? |
| 1A-028 | What determines the direction of protein migration in isoelectric focusing? |
| 1A-029 | What is a Ramachandran plot used to examine? |
| 1A-030 | Which amino acids absorb strongly near 280 nm? |
| 1A-031 | What distinguishes parallel from antiparallel beta sheets? |
| 1A-032 | Why are hydrophobic amino acids often buried in globular proteins? |
| 1A-033 | What does a chaperone protein do? |
| 1A-034 | What does the Hill coefficient suggest when greater than one? |
| 1A-035 | What is the biochemical role of a prosthetic group? |
| 1A-036 | What distinguishes a holoenzyme from an apoenzyme? |
| 1A-037 | What does a Lineweaver–Burk plot place on its axes? |
| 1A-038 | How can an enzyme accelerate a reaction without changing equilibrium? |
| 1A-039 | Why can histidine participate in acid-base catalysis near physiological pH? |
| 1A-040 | What is the defining bond of a peptide linkage? |

### 1B · Gene to protein (39)

| ID | Question |
|---|---|
| 1B-001 | Purines vs. pyrimidines? |
| 1B-002 | Hydrogen bonds per base pair? |
| 1B-003 | Chargaff's rule? |
| 1B-004 | DNA vs. RNA sugar? |
| 1B-005 | Role of helicase? |
| 1B-006 | Role of topoisomerase? |
| 1B-007 | Role of primase? |
| 1B-008 | What does DNA polymerase need to begin? |
| 1B-009 | Telomerase? |
| 1B-010 | What does RNA polymerase II make? |
| 1B-011 | Eukaryotic mRNA processing? |
| 1B-012 | Introns vs. exons? |
| 1B-013 | Alternative splicing? |
| 1B-014 | Wobble position? |
| 1B-015 | Order of ribosome sites? |
| 1B-016 | Prokaryotic vs. eukaryotic ribosomes? |
| 1B-017 | Lac operon with lactose present and glucose absent? |
| 1B-018 | How is the trp operon regulated? |
| 1B-019 | Silent, missense, nonsense mutations? |
| 1B-020 | Frameshift mutation? |
| 1B-021 | Effect of histone acetylation? |
| 1B-022 | Effect of DNA methylation? |
| 1B-023 | Heterochromatin vs. euchromatin? |
| 1B-024 | Direction of DNA synthesis? |
| 1B-025 | Where are Okazaki fragments made? |
| 1B-026 | Start codon and stop codons? |
| 1B-027 | Why does the lagging strand require multiple primers? |
| 1B-028 | What does DNA ligase seal during replication? |
| 1B-029 | What does telomerase use as its template? |
| 1B-030 | Which DNA repair pathway removes UV-induced thymine dimers? |
| 1B-031 | Which repair pathway corrects replication-induced base mismatches? |
| 1B-032 | What happens during transcription initiation in eukaryotes? |
| 1B-033 | What is the role of the TATA box in some eukaryotic promoters? |
| 1B-034 | What modification protects the 5′ end of most eukaryotic mRNAs? |
| 1B-035 | What happens to introns during pre-mRNA processing? |
| 1B-036 | What does a release factor recognize in translation? |
| 1B-037 | Why is the genetic code called degenerate? |
| 1B-038 | How can a nonsense mutation affect a protein? |
| 1B-039 | What does an enhancer do in eukaryotic gene expression? |

### 1C · Heredity and genetic diversity (22)

| ID | Question |
|---|---|
| 1C-001 | When does crossing over happen? |
| 1C-002 | Nondisjunction? |
| 1C-003 | Why do X-linked recessive traits show up more in males? |
| 1C-004 | Mendel's law of segregation? |
| 1C-005 | Law of independent assortment? |
| 1C-006 | Recombination frequency and map distance? |
| 1C-007 | Incomplete dominance vs. codominance? |
| 1C-008 | Penetrance vs. expressivity? |
| 1C-009 | Bottleneck vs. founder effect? |
| 1C-010 | Meiosis I vs. meiosis II: what separates? |
| 1C-011 | Hardy–Weinberg equations? |
| 1C-012 | What is an autosomal recessive carrier? |
| 1C-013 | Why does mitochondrial inheritance usually follow the maternal line? |
| 1C-014 | What is heteroplasmy? |
| 1C-015 | What does genetic linkage imply? |
| 1C-016 | Why cannot observed recombination frequency exceed 50%? |
| 1C-017 | What does genomic imprinting mean? |
| 1C-018 | What is gene flow? |
| 1C-019 | What is directional selection? |
| 1C-020 | What is stabilizing selection? |
| 1C-021 | What is disruptive selection? |
| 1C-022 | Why can a rare recessive allele persist in a population? |

### 1D · Bioenergetics and metabolism (33)

| ID | Question |
|---|---|
| 1D-001 | Where does glycolysis occur? |
| 1D-002 | Products of pyruvate dehydrogenase? |
| 1D-003 | Citric acid cycle yield per acetyl-CoA? |
| 1D-004 | Which enzyme is in both the citric acid cycle and the ETC? |
| 1D-005 | What drives ATP synthase? |
| 1D-006 | Purpose of fermentation? |
| 1D-007 | Pentose phosphate pathway products? |
| 1D-008 | Key enzymes of glycogen metabolism? |
| 1D-009 | Fatty acid synthesis: location and rate-limiting enzyme? |
| 1D-010 | Where does β-oxidation occur? |
| 1D-011 | Ketone bodies: where and when? |
| 1D-012 | Rate-limiting enzyme of cholesterol synthesis? |
| 1D-013 | Where does the urea cycle occur? |
| 1D-014 | Saturated vs. unsaturated fatty acids? |
| 1D-015 | Net yield of glycolysis per glucose? |
| 1D-016 | Rate-limiting enzyme of glycolysis? |
| 1D-017 | Rate-limiting enzyme of gluconeogenesis? |
| 1D-018 | Where does the citric acid cycle occur? |
| 1D-019 | Final electron acceptor of the electron transport chain? |
| 1D-020 | Where does beta-oxidation of long-chain fatty acids mainly occur? |
| 1D-021 | What does carnitine palmitoyltransferase I enable? |
| 1D-022 | What inhibits carnitine palmitoyltransferase I? |
| 1D-023 | How does high AMP generally affect phosphofructokinase-1? |
| 1D-024 | Where does gluconeogenesis occur predominantly? |
| 1D-025 | Which gluconeogenic enzymes bypass pyruvate kinase? |
| 1D-026 | What enzyme converts fructose-1,6-bisphosphate into fructose-6-phosphate? |
| 1D-027 | What enzyme allows glucose release from liver glycogen stores? |
| 1D-028 | Why is NADPH especially important in red blood cells? |
| 1D-029 | What enzyme converts pyruvate to oxaloacetate? |
| 1D-030 | What activates pyruvate carboxylase? |
| 1D-031 | What creates the proton-motive force in mitochondria? |
| 1D-032 | Why does an uncoupler increase oxygen consumption while reducing ATP synthesis? |
| 1D-033 | What metabolic shift is expected during prolonged fasting? |

### 2A · Cells and membranes (28)

| ID | Question |
|---|---|
| 2A-001 | How does cholesterol affect membrane fluidity? |
| 2A-002 | Fluid mosaic model? |
| 2A-003 | Passive vs. active transport? |
| 2A-004 | Secondary active transport? |
| 2A-005 | Which way does water move in osmosis? |
| 2A-006 | Cell in a hypotonic solution? |
| 2A-007 | Evidence for endosymbiosis? |
| 2A-008 | Rough ER vs. smooth ER? |
| 2A-009 | Role of the Golgi apparatus? |
| 2A-010 | Lysosome? |
| 2A-011 | Peroxisome? |
| 2A-012 | What are microtubules made of and used for? |
| 2A-013 | What are microfilaments made of and used for? |
| 2A-014 | Tight junctions? |
| 2A-015 | Gap junctions? |
| 2A-016 | Desmosomes? |
| 2A-017 | What is the principal structural role of cholesterol in animal membranes? |
| 2A-018 | How does membrane unsaturation usually affect fluidity? |
| 2A-019 | What determines the direction of passive ion movement across a membrane? |
| 2A-020 | How does facilitated diffusion differ from active transport? |
| 2A-021 | What is primary active transport? |
| 2A-022 | What does an aquaporin transport? |
| 2A-023 | What happens to an animal cell placed in a hypertonic solution? |
| 2A-024 | What distinguishes receptor-mediated endocytosis? |
| 2A-025 | What is the centrosome's role in many animal cells? |
| 2A-026 | Which cytoskeletal filament is especially involved in cell contraction? |
| 2A-027 | Which motor protein generally moves toward microtubule plus ends? |
| 2A-028 | Which motor protein generally moves toward microtubule minus ends? |

### 2B · Prokaryotes and viruses (30)

| ID | Question |
|---|---|
| 2B-001 | Three ways bacteria exchange DNA? |
| 2B-002 | Gram-positive vs. gram-negative? |
| 2B-003 | Lytic vs. lysogenic cycle? |
| 2B-004 | Retrovirus? |
| 2B-005 | How is a bacterial genome organized? |
| 2B-006 | Plasmids? |
| 2B-007 | How do prokaryotes divide? |
| 2B-008 | Bacterial growth curve phases? |
| 2B-009 | Obligate aerobe vs. obligate anaerobe vs. facultative anaerobe? |
| 2B-010 | Endospores? |
| 2B-011 | Prokaryotic vs. eukaryotic flagella? |
| 2B-012 | Positive-sense vs. negative-sense RNA viruses? |
| 2B-013 | Basic structure of a virus? |
| 2B-014 | Parts of a bacteriophage? |
| 2B-015 | Prions vs. viroids? |
| 2B-016 | Why are Gram-positive bacteria purple after Gram staining? |
| 2B-017 | What outer-membrane component is characteristic of Gram-negative bacteria? |
| 2B-018 | What does bacterial conjugation involve? |
| 2B-019 | What is bacterial transformation? |
| 2B-020 | What is generalized transduction? |
| 2B-021 | What is specialized transduction? |
| 2B-022 | What is the function of bacterial restriction enzymes? |
| 2B-023 | What does CRISPR–Cas provide in many prokaryotes? |
| 2B-024 | What is a prophage? |
| 2B-025 | Why must retroviruses carry or encode reverse transcriptase? |
| 2B-026 | What is an enveloped virus? |
| 2B-027 | Why are nonenveloped viruses often more resistant to detergents? |
| 2B-028 | What is the bacterial nucleoid? |
| 2B-029 | How can an operon coordinate bacterial gene expression? |
| 2B-030 | How does lactose affect the lac repressor? |

### 2C · Cell division and development (28)

| ID | Question |
|---|---|
| 2C-001 | Phases of the cell cycle? |
| 2C-002 | Role of p53? |
| 2C-003 | Proto-oncogene? |
| 2C-004 | What does ectoderm become? |
| 2C-005 | What does mesoderm become? |
| 2C-006 | What does endoderm become? |
| 2C-007 | What triggers the acrosome reaction in sperm, and what is its function? |
| 2C-008 | Cortical reaction? |
| 2C-009 | Mitosis vs. meiosis outcome? |
| 2C-010 | Cyclins and CDKs? |
| 2C-011 | Apoptosis? |
| 2C-012 | Cleavage, morula, blastula? |
| 2C-013 | Gastrulation? |
| 2C-014 | Neurulation? |
| 2C-015 | Totipotent vs. pluripotent vs. multipotent? |
| 2C-016 | What happens during the G1 checkpoint? |
| 2C-017 | What is the role of cyclin-dependent kinases? |
| 2C-018 | What does p53 do after substantial DNA damage? |
| 2C-019 | What separates during anaphase of mitosis? |
| 2C-020 | When does homologous recombination occur in meiosis? |
| 2C-021 | What is synapsis? |
| 2C-022 | Why is meiosis II described as equational division? |
| 2C-023 | What is a blastula or blastocyst? |
| 2C-024 | What induces neurulation in vertebrate embryos? |
| 2C-025 | What is an embryonic morphogen? |
| 2C-026 | What is cell differentiation? |
| 2C-027 | What distinguishes a pluripotent from a totipotent cell? |
| 2C-028 | What is contact inhibition in normal cultured cells? |

### 3A · Nervous and endocrine systems (28)

| ID | Question |
|---|---|
| 3A-001 | Myelin in the CNS vs. PNS? |
| 3A-002 | Saltatory conduction? |
| 3A-003 | Absolute vs. relative refractory period? |
| 3A-004 | What triggers neurotransmitter release? |
| 3A-005 | Steroid vs. peptide hormones? |
| 3A-006 | Anterior pituitary hormones? |
| 3A-007 | Posterior pituitary hormones? |
| 3A-008 | PTH vs. calcitonin? |
| 3A-009 | What does cortisol do? |
| 3A-010 | Where is epinephrine made? |
| 3A-011 | Thyroid hormones? |
| 3A-012 | Source of insulin vs. glucagon? |
| 3A-013 | Ion movements in an action potential? |
| 3A-014 | Na^+/K^+ ATPase stoichiometry? |
| 3A-015 | Postganglionic neurotransmitters of the ANS? |
| 3A-016 | What drives repolarization after a typical neuronal action potential? |
| 3A-017 | Why does myelination speed axonal signaling? |
| 3A-018 | How do ionotropic receptors differ from metabotropic receptors? |
| 3A-019 | How does the hypothalamus regulate the anterior pituitary? |
| 3A-020 | What stimulates thyroid hormone secretion? |
| 3A-021 | How does T3/T4 affect the hypothalamic–pituitary–thyroid axis? |
| 3A-022 | What primarily stimulates aldosterone release? |
| 3A-023 | What does parathyroid hormone do to plasma calcium? |
| 3A-024 | How does calcitonin affect osteoclast activity? |
| 3A-025 | What is cortisol's major metabolic effect during stress? |
| 3A-026 | How do peptide hormones usually signal? |
| 3A-027 | Which second messenger is produced by adenylyl cyclase? |
| 3A-028 | How does phospholipase C generate two signaling molecules? |

### 3B · Organ systems (43)

| ID | Question |
|---|---|
| 3B-001 | Which sarcomere regions shorten during contraction? |
| 3B-002 | Role of Ca^2+ in skeletal muscle contraction? |
| 3B-003 | What releases myosin from actin? |
| 3B-004 | Three muscle types? |
| 3B-005 | Path of blood through the heart? |
| 3B-006 | Arteries vs. veins? |
| 3B-007 | Role of surfactant? |
| 3B-008 | How is most CO2 carried in blood? |
| 3B-009 | B cells vs. T cells? |
| 3B-010 | MHC I vs. MHC II? |
| 3B-011 | Innate vs. adaptive immunity? |
| 3B-012 | What triggers ovulation? |
| 3B-013 | What does the corpus luteum secrete? |
| 3B-014 | Role of hCG? |
| 3B-015 | How are fats digested? |
| 3B-016 | Sections of the small intestine? |
| 3B-017 | Secretin vs. CCK? |
| 3B-018 | What drives glomerular filtration? |
| 3B-019 | What does the proximal tubule reabsorb? |
| 3B-020 | What shifts the hemoglobin–O2 curve to the right? |
| 3B-021 | Loop of Henle permeability? |
| 3B-022 | What does ADH do? |
| 3B-023 | What does aldosterone do? |
| 3B-024 | Pepsin: source and activation? |
| 3B-025 | Where is bile made and stored? |
| 3B-026 | Function of the SA node? |
| 3B-027 | Why is the left ventricular wall thicker than the right? |
| 3B-028 | Which heart valve lies between left atrium and left ventricle? |
| 3B-029 | Which vessels carry oxygenated blood from lungs to heart? |
| 3B-030 | What happens during ventricular systole? |
| 3B-031 | What does the P wave represent on an ECG? |
| 3B-032 | What does the QRS complex represent on an ECG? |
| 3B-033 | What does the T wave represent on an ECG? |
| 3B-034 | What is cardiac output? |
| 3B-035 | What triggers the Bohr effect? |
| 3B-036 | What is the Haldane effect? |
| 3B-037 | What drives gas exchange across the alveolar membrane? |
| 3B-038 | Why does surfactant prevent alveolar collapse? |
| 3B-039 | What drives water reabsorption in the descending loop of Henle? |
| 3B-040 | What is the role of pancreatic bicarbonate secretion? |
| 3B-041 | Where is most nutrient absorption carried out? |
| 3B-042 | What does intrinsic factor enable? |
| 3B-043 | What immune cells produce antibodies? |

### 4A · Motion, forces, and energy (29)

| ID | Question |
|---|---|
| 4A-001 | Vector vs. scalar? |
| 4A-002 | Launch angle for maximum range on level ground? |
| 4A-003 | Horizontal velocity of a projectile? |
| 4A-004 | Friction force? |
| 4A-005 | Forces on an incline? |
| 4A-006 | Centripetal acceleration? |
| 4A-007 | Torque? |
| 4A-008 | Momentum and impulse? |
| 4A-009 | Elastic vs. inelastic collisions? |
| 4A-010 | Hooke's law and spring energy? |
| 4A-011 | Conservation of mechanical energy? |
| 4A-012 | Kinematics equation without time? |
| 4A-013 | Work done by a force? |
| 4A-014 | Kinetic and gravitational potential energy? |
| 4A-015 | Power? |
| 4A-016 | When is mechanical work by a force zero despite nonzero force? |
| 4A-017 | How does doubling speed affect kinetic energy at fixed mass? |
| 4A-018 | When is linear momentum conserved in a system? |
| 4A-019 | What does angular momentum conservation predict for a spinning skater pulling in arms? |
| 4A-020 | What is torque magnitude from a perpendicular force? |
| 4A-021 | What is the parallel-axis theorem? |
| 4A-022 | What does static equilibrium require in two-dimensional mechanics? |
| 4A-023 | How does potential energy change when a mass is raised by height h near Earth? |
| 4A-024 | What is the angular frequency of an ideal mass–spring oscillator? |
| 4A-025 | What is the period of a small-angle simple pendulum? |
| 4A-026 | Why does a banked turn reduce reliance on friction? |
| 4A-027 | What is terminal velocity? |
| 4A-028 | How is instantaneous power related to force and velocity? |
| 4A-029 | What is the gravitational force between two point masses? |

### 4B · Fluids and gases (28)

| ID | Question |
|---|---|
| 4B-001 | Density and specific gravity? |
| 4B-002 | Pressure at depth in a fluid? |
| 4B-003 | Pascal's principle? |
| 4B-004 | Poiseuille's law: key takeaway? |
| 4B-005 | Ideal gas law and molar volume at STP? |
| 4B-006 | Continuity equation for fluids? |
| 4B-007 | Bernoulli's equation? |
| 4B-008 | Buoyant force? |
| 4B-009 | Gauge vs. absolute pressure? |
| 4B-010 | Fraction of a floating object below the surface? |
| 4B-011 | Venturi effect? |
| 4B-012 | Viscosity? |
| 4B-013 | Laminar vs. turbulent flow? |
| 4B-014 | Dalton's law of partial pressures? |
| 4B-015 | Boyle's law vs. Charles's law? |
| 4B-016 | What is hydrostatic gauge pressure at depth h in a uniform liquid? |
| 4B-017 | When does an object float at rest? |
| 4B-018 | Under ideal horizontal flow, what happens to static pressure as speed rises? |
| 4B-019 | Why do narrow blood vessels strongly affect flow resistance? |
| 4B-020 | What is Reynolds number used to estimate? |
| 4B-021 | How does the ideal-gas pressure change if absolute temperature doubles at fixed V and n? |
| 4B-022 | What does Graham's law predict for effusion rate? |
| 4B-023 | How does molecular rms speed scale with absolute temperature? |
| 4B-024 | What causes real gases to deviate from ideal behavior? |
| 4B-025 | When are ideal-gas approximations generally best? |
| 4B-026 | What is an isothermal ideal-gas process? |
| 4B-027 | What is an adiabatic process? |
| 4B-028 | Why is surface tension relevant to small droplets? |

### 4C · Electrochemistry and circuits (31)

| ID | Question |
|---|---|
| 4C-001 | OIL RIG? |
| 4C-002 | What happens to an oxidizing agent? |
| 4C-003 | Electrolytic cell? |
| 4C-004 | Sign of the anode in a galvanic cell? |
| 4C-005 | Faraday's constant? |
| 4C-006 | Nernst equation? |
| 4C-007 | Standard cell potential? |
| 4C-008 | Coulomb's law? |
| 4C-009 | Electric field from a point charge? |
| 4C-010 | Electric potential energy and potential? |
| 4C-011 | Electrical power? |
| 4C-012 | Capacitors in series vs. parallel? |
| 4C-013 | Effect of a dielectric? |
| 4C-014 | Resistance of a wire? |
| 4C-015 | Magnetic force on a moving charge? |
| 4C-016 | Relate ΔG to cell potential. |
| 4C-017 | Galvanic cell: where do oxidation and reduction happen? |
| 4C-018 | Ohm's law and resistor combinations? |
| 4C-019 | Capacitance and stored energy? |
| 4C-020 | What is the electric potential from a point charge? |
| 4C-021 | How does electric potential energy relate to charge and potential? |
| 4C-022 | What is the direction of electric field relative to potential? |
| 4C-023 | How does plate separation affect ideal parallel-plate capacitance? |
| 4C-024 | What does Kirchhoff's junction rule express? |
| 4C-025 | What does Kirchhoff's loop rule express? |
| 4C-026 | What is the time constant of a simple RC circuit? |
| 4C-027 | How much charge does an initially uncharged RC capacitor gain after one time constant? |
| 4C-028 | Which way do electrons move relative to conventional current? |
| 4C-029 | What is the magnetic force on a straight current-carrying wire? |
| 4C-030 | What does Faraday's law state? |
| 4C-031 | What does Lenz's law determine? |

### 4D · Light, sound, and spectroscopy (28)

| ID | Question |
|---|---|
| 4D-001 | ¹H NMR splitting rule? |
| 4D-002 | ¹H NMR shifts for aldehyde and carboxylic acid H? |
| 4D-003 | Wave speed? |
| 4D-004 | Where does sound travel fastest? |
| 4D-005 | Harmonics in a pipe closed at one end? |
| 4D-006 | Harmonics on a string or open pipe? |
| 4D-007 | Index of refraction? |
| 4D-008 | Total internal reflection? |
| 4D-009 | Real vs. virtual images? |
| 4D-010 | Lens power? |
| 4D-011 | EM spectrum, low to high energy? |
| 4D-012 | Visible light wavelengths? |
| 4D-013 | Photoelectric effect? |
| 4D-014 | Key IR peaks? |
| 4D-015 | Snell's law? |
| 4D-016 | Thin lens equation and magnification? |
| 4D-017 | Sound level in decibels? |
| 4D-018 | Doppler effect, source approaching? |
| 4D-019 | What happens to light frequency when it passes into a new medium? |
| 4D-020 | What is the critical-angle relation for n1 greater than n2? |
| 4D-021 | What does a negative image magnification indicate? |
| 4D-022 | How many decibels correspond to a tenfold rise in sound intensity? |
| 4D-023 | What determines the fundamental frequency of a string fixed at both ends? |
| 4D-024 | What does constructive interference require for coherent waves? |
| 4D-025 | What is the double-slit fringe spacing for small angles? |
| 4D-026 | What physical transition produces infrared absorption in molecules? |
| 4D-027 | What does a UV–visible electronic absorption typically probe? |
| 4D-028 | What does NMR chemical shift reflect? |

### 4E · Atoms and nuclear decay (28)

| ID | Question |
|---|---|
| 4E-001 | Avogadro's number? |
| 4E-002 | Limiting reagent? |
| 4E-003 | Percent yield? |
| 4E-004 | Four quantum numbers? |
| 4E-005 | Pauli exclusion principle? |
| 4E-006 | Hund's rule? |
| 4E-007 | Atomic radius trend? |
| 4E-008 | Ionization energy trend? |
| 4E-009 | Isotopes? |
| 4E-010 | Photon energy? |
| 4E-011 | What does mass spectrometry measure? |
| 4E-012 | Gamma decay? |
| 4E-013 | Positron emission? |
| 4E-014 | Electron capture? |
| 4E-015 | Electronegativity trend? |
| 4E-016 | Fraction left after n half-lives? |
| 4E-017 | Alpha vs. beta-minus decay? |
| 4E-018 | What is the de Broglie wavelength of a particle? |
| 4E-019 | What does the Heisenberg uncertainty principle limit? |
| 4E-020 | What is the maximum number of electrons in a p subshell? |
| 4E-021 | What does the principal quantum number n primarily indicate? |
| 4E-022 | Why are hydrogen emission lines discrete? |
| 4E-023 | What is the work function in the photoelectric effect? |
| 4E-024 | How much parent nuclide remains after three half-lives? |
| 4E-025 | What does activity measure in radioactive decay? |
| 4E-026 | Why is binding energy released when some nuclei form? |
| 4E-027 | What is the approximate energy equivalent of 1 atomic mass unit? |
| 4E-028 | What is an isoelectronic species? |

### 5A · Water and solutions (31)

| ID | Question |
|---|---|
| 5A-001 | Molarity? |
| 5A-002 | Molality? |
| 5A-003 | Kw at 25 °C? |
| 5A-004 | The strong acids? |
| 5A-005 | pKa and acid strength? |
| 5A-006 | Conjugate base of a strong acid? |
| 5A-007 | Effective range of a buffer? |
| 5A-008 | Blood bicarbonate buffer? |
| 5A-009 | Lewis acid? |
| 5A-010 | Brønsted–Lowry acid? |
| 5A-011 | pH at the equivalence point, weak acid titrated with strong base? |
| 5A-012 | Common ion effect? |
| 5A-013 | Henderson–Hasselbalch equation? |
| 5A-014 | pH at the half-equivalence point? |
| 5A-015 | Freezing-point depression formula? |
| 5A-016 | What happens to pH when [H^+] increases tenfold? |
| 5A-017 | What is pOH at 25 °C when pH is 4? |
| 5A-018 | When does a weak-acid buffer have pH = pKa? |
| 5A-019 | When is buffer capacity generally strongest? |
| 5A-020 | What distinguishes a strong acid from a concentrated acid? |
| 5A-021 | What does Ksp represent? |
| 5A-022 | When does an ionic precipitate form based on Q and Ksp? |
| 5A-023 | How does added nonvolatile solute affect solvent vapor pressure ideally? |
| 5A-024 | What does boiling-point elevation depend on for dilute ideal solutions? |
| 5A-025 | What is osmotic pressure for an ideal dilute solution? |
| 5A-026 | What is the van 't Hoff factor i? |
| 5A-027 | Why is molality less temperature-sensitive than molarity? |
| 5A-028 | What is the dilution relationship when solute amount is conserved? |
| 5A-029 | What is an amphiprotic species? |
| 5A-030 | How does adding acid affect a bicarbonate buffer? |
| 5A-031 | How does increasing temperature affect water's neutral pH? |

### 5B · Molecular structure and interactions (29)

| ID | Question |
|---|---|
| 5B-001 | Formal charge? |
| 5B-002 | Sigma and pi bonds in single, double, triple bonds? |
| 5B-003 | Bond length vs. bond strength? |
| 5B-004 | Intermolecular forces, strongest to weakest? |
| 5B-005 | What's needed for hydrogen bonding? |
| 5B-006 | Shape with 4 electron domains and 2 lone pairs? |
| 5B-007 | Shape of NH3? |
| 5B-008 | How do IMFs affect boiling point? |
| 5B-009 | Chiral center? |
| 5B-010 | Enantiomers vs. diastereomers? |
| 5B-011 | Meso compound? |
| 5B-012 | Assigning R or S? |
| 5B-013 | Racemic mixture? |
| 5B-014 | E vs. Z alkenes? |
| 5B-015 | Hybridization and bond angles? |
| 5B-016 | What molecular geometry corresponds to four electron groups and no lone pairs? |
| 5B-017 | What shape results from four electron groups with one lone pair? |
| 5B-018 | What is resonance in Lewis structures? |
| 5B-019 | Why are the three C–O bonds in carbonate equivalent? |
| 5B-020 | What intermolecular interaction occurs between permanent dipoles? |
| 5B-021 | Why does boiling point often rise with molecular polarizability? |
| 5B-022 | What are the common hydrogen-bond donor atoms in biological molecules? |
| 5B-023 | What molecular feature makes a bond polar? |
| 5B-024 | Why can CO2 have polar bonds but zero net dipole moment? |
| 5B-025 | What generally distinguishes ionic from covalent bonding? |
| 5B-026 | What is the bond-order formula in molecular orbital theory? |
| 5B-027 | Why is O2 paramagnetic? |
| 5B-028 | What does a Lewis base donate? |
| 5B-029 | How does an electron-withdrawing substituent often affect acid strength? |

### 5C · Separation and purification (27)

| ID | Question |
|---|---|
| 5C-001 | Simple vs. fractional distillation? |
| 5C-002 | Extraction? |
| 5C-003 | Rf in TLC on silica? |
| 5C-004 | Gel electrophoresis? |
| 5C-005 | When is vacuum distillation used? |
| 5C-006 | Recrystallization? |
| 5C-007 | Gravity vs. vacuum filtration? |
| 5C-008 | Centrifugation? |
| 5C-009 | Column chromatography on silica: which elutes first? |
| 5C-010 | Gas chromatography? |
| 5C-011 | Size-exclusion chromatography: which elutes first? |
| 5C-012 | Ion-exchange chromatography? |
| 5C-013 | Affinity chromatography? |
| 5C-014 | SDS-PAGE? |
| 5C-015 | Isoelectric focusing? |
| 5C-016 | What causes movement in thin-layer chromatography? |
| 5C-017 | What is reverse-phase chromatography's stationary phase like? |
| 5C-018 | In reverse-phase chromatography, which analytes often elute later? |
| 5C-019 | What separates molecules in size-exclusion chromatography? |
| 5C-020 | How can increasing salt concentration elute bound ions? |
| 5C-021 | What does native PAGE retain that SDS–PAGE often disrupts? |
| 5C-022 | What is a Western blot used to detect? |
| 5C-023 | What is an ELISA commonly used to measure? |
| 5C-024 | What is a Southern blot used to detect? |
| 5C-025 | What is a Northern blot used to detect? |
| 5C-026 | When is simple distillation most effective? |
| 5C-027 | Why is fractional distillation useful for similar boiling points? |

### 5D · Biological molecules and reactions (33)

| ID | Question |
|---|---|
| 5D-001 | Nucleophile vs. electrophile? |
| 5D-002 | Good leaving groups? |
| 5D-003 | E2 requirements? |
| 5D-004 | Zaitsev's rule? |
| 5D-005 | Carbocation stability order? |
| 5D-006 | What happens when you oxidize an aldehyde vs. a ketone? |
| 5D-007 | Primary alcohol with PCC vs. a strong oxidant? |
| 5D-008 | NaBH4 vs. LiAlH4? |
| 5D-009 | Reactivity of carboxylic acid derivatives? |
| 5D-010 | Aldol reaction? |
| 5D-011 | Keto–enol tautomerism? |
| 5D-012 | Acetal formation? |
| 5D-013 | Imine formation? |
| 5D-014 | Fischer esterification? |
| 5D-015 | Saponification? |
| 5D-016 | Hückel's rule for aromaticity? |
| 5D-017 | Gabriel synthesis? |
| 5D-018 | Strecker synthesis? |
| 5D-019 | SN2 hallmarks? |
| 5D-020 | SN1 hallmarks? |
| 5D-021 | What is the anomeric carbon in a cyclic sugar? |
| 5D-022 | What is a reducing sugar? |
| 5D-023 | Why is sucrose nonreducing? |
| 5D-024 | What is the linkage in a typical peptide bond? |
| 5D-025 | What is the main linkage between nucleotides in a DNA strand? |
| 5D-026 | What distinguishes a nucleoside from a nucleotide? |
| 5D-027 | What carbohydrate bonds join glucose units in cellulose? |
| 5D-028 | What carbohydrate bonds join glucose units in amylose? |
| 5D-029 | What bonds introduce branches into glycogen? |
| 5D-030 | Why are triacylglycerols efficient energy stores? |
| 5D-031 | What does a Fischer projection represent? |
| 5D-032 | What distinguishes SN1 from SN2 kinetics? |
| 5D-033 | Why do tertiary substrates often favor E2 over SN2 with a strong base? |

### 5E · Thermodynamics and kinetics (31)

| ID | Question |
|---|---|
| 5E-001 | When does a liquid boil? |
| 5E-002 | Triple point? |
| 5E-003 | Critical point? |
| 5E-004 | Heat absorbed with a temperature change? |
| 5E-005 | What happens to temperature during a phase change? |
| 5E-006 | Hess's law? |
| 5E-007 | Exothermic vs. endothermic? |
| 5E-008 | What increases entropy? |
| 5E-009 | First law of thermodynamics? |
| 5E-010 | Reaction quotient Q vs. K? |
| 5E-011 | Effect of a catalyst on equilibrium? |
| 5E-012 | Raising temperature on an exothermic equilibrium? |
| 5E-013 | Arrhenius equation? |
| 5E-014 | Rate-determining step? |
| 5E-015 | First-order half-life? |
| 5E-016 | Gibbs free energy equation? |
| 5E-017 | Relate ΔG° to the equilibrium constant. |
| 5E-018 | Le Châtelier's principle? |
| 5E-019 | How is a rate law determined? |
| 5E-020 | What does a negative Gibbs free-energy change indicate? |
| 5E-021 | Does a negative ΔG guarantee a fast reaction? |
| 5E-022 | What is the Gibbs free-energy relation at nonstandard conditions? |
| 5E-023 | When is ΔG = 0 for a reaction mixture? |
| 5E-024 | What is the standard enthalpy of formation of a pure element in its standard state? |
| 5E-025 | What is the first law of thermodynamics using chemistry sign conventions? |
| 5E-026 | How can activation energy be estimated from an Arrhenius plot? |
| 5E-027 | What are the units of a first-order rate constant? |
| 5E-028 | How does the half-life of a zero-order reaction depend on initial concentration? |
| 5E-029 | What determines the molecularity of an elementary reaction? |
| 5E-030 | Why cannot overall rate law generally be inferred from overall stoichiometry? |
| 5E-031 | What is entropy's statistical interpretation? |

### 6A · Sensation and perception (29)

| ID | Question |
|---|---|
| 6A-001 | Sensation vs. perception? |
| 6A-002 | Absolute threshold? |
| 6A-003 | Sensory adaptation? |
| 6A-004 | Bottom-up vs. top-down processing? |
| 6A-005 | Gestalt principles? |
| 6A-006 | Rods vs. cones? |
| 6A-007 | What crosses at the optic chiasm? |
| 6A-008 | Feature detectors? |
| 6A-009 | Where is sound transduced? |
| 6A-010 | Place theory vs. frequency theory? |
| 6A-011 | Vestibular system? |
| 6A-012 | Gate control theory of pain? |
| 6A-013 | Five basic tastes? |
| 6A-014 | Weber's law? |
| 6A-015 | Signal detection theory outcomes? |
| 6A-016 | What is signal detection criterion? |
| 6A-017 | What is d′ in signal detection theory? |
| 6A-018 | How do rods differ from cones in dim light? |
| 6A-019 | Where is cone density highest in the human retina? |
| 6A-020 | What is the optic disc? |
| 6A-021 | What does the opponent-process theory of color perception propose? |
| 6A-022 | What is perceptual constancy? |
| 6A-023 | What is the Gestalt principle of closure? |
| 6A-024 | What is binocular disparity used for? |
| 6A-025 | What is accommodation in the eye? |
| 6A-026 | What distinguishes myopia from hyperopia? |
| 6A-027 | Which part of the ear contains the organ of Corti? |
| 6A-028 | Why is olfaction unusual among senses? |
| 6A-029 | What is the difference between absolute threshold and difference threshold? |

### 6B · Cognition, memory, and consciousness (41)

| ID | Question |
|---|---|
| 6B-001 | Levels of processing? |
| 6B-002 | Iconic vs. echoic memory? |
| 6B-003 | Short-term memory capacity? |
| 6B-004 | Baddeley's working memory model? |
| 6B-005 | Explicit vs. implicit memory? |
| 6B-006 | Episodic vs. semantic memory? |
| 6B-007 | Procedural memory? |
| 6B-008 | Priming? |
| 6B-009 | Serial position effect? |
| 6B-010 | Proactive vs. retroactive interference? |
| 6B-011 | Retrograde vs. anterograde amnesia? |
| 6B-012 | Long-term potentiation? |
| 6B-013 | Misinformation effect? |
| 6B-014 | Alzheimer's disease? |
| 6B-015 | Availability vs. representativeness heuristic? |
| 6B-016 | Confirmation bias? |
| 6B-017 | Belief perseverance? |
| 6B-018 | Functional fixedness? |
| 6B-019 | Mental set? |
| 6B-020 | Fluid vs. crystallized intelligence? |
| 6B-021 | Gardner's theory of intelligence? |
| 6B-022 | Sapir–Whorf hypothesis? |
| 6B-023 | Language components? |
| 6B-024 | Theories of language acquisition? |
| 6B-025 | What controls circadian rhythm? |
| 6B-026 | EEG waves by state? |
| 6B-027 | What happens in REM sleep? |
| 6B-028 | Broca's vs. Wernicke's area? |
| 6B-029 | Hippocampus vs. amygdala? |
| 6B-030 | What is encoding specificity? |
| 6B-031 | What is state-dependent memory? |
| 6B-032 | What is context-dependent memory? |
| 6B-033 | What is prospective memory? |
| 6B-034 | What is the phonological loop in working-memory models? |
| 6B-035 | What does the visuospatial sketchpad maintain? |
| 6B-036 | What is chunking in memory? |
| 6B-037 | What is the spacing effect? |
| 6B-038 | What is the testing effect? |
| 6B-039 | What is a retrieval cue? |
| 6B-040 | What is source-monitoring error? |
| 6B-041 | What is a heuristic? |

### 6C · Emotion and stress (19)

| ID | Question |
|---|---|
| 6C-001 | Ekman's universal emotions? |
| 6C-002 | Primary vs. secondary appraisal? |
| 6C-003 | General adaptation syndrome? |
| 6C-004 | Problem-focused vs. emotion-focused coping? |
| 6C-005 | Three theories of emotion? |
| 6C-006 | Three components of emotion? |
| 6C-007 | Role of the prefrontal cortex in emotion? |
| 6C-008 | Eustress vs. distress? |
| 6C-009 | Types of stressors? |
| 6C-010 | HPA axis? |
| 6C-011 | Body's immediate stress response? |
| 6C-012 | Effects of chronic stress? |
| 6C-013 | Stress management techniques? |
| 6C-014 | Display rules? |
| 6C-015 | Facial feedback hypothesis? |
| 6C-016 | What is allostatic load? |
| 6C-017 | What is the difference between acute and chronic stress? |
| 6C-018 | What is reappraisal as an emotion-regulation strategy? |
| 6C-019 | How does expressive suppression differ from reappraisal? |

### 7A · Biology, personality, motivation, and disorders (40)

| ID | Question |
|---|---|
| 7A-001 | Brain's reward pathway? |
| 7A-002 | Drive-reduction theory? |
| 7A-003 | Arousal theory? |
| 7A-004 | Intrinsic vs. extrinsic motivation? |
| 7A-005 | Self-determination theory? |
| 7A-006 | Hypothalamus and hunger? |
| 7A-007 | Freud's id, ego, superego? |
| 7A-008 | Common defense mechanisms? |
| 7A-009 | Big Five personality traits? |
| 7A-010 | Locus of control? |
| 7A-011 | Self-efficacy? |
| 7A-012 | Humanistic perspective? |
| 7A-013 | Biopsychosocial model? |
| 7A-014 | Major depressive disorder criteria? |
| 7A-015 | Bipolar I vs. bipolar II? |
| 7A-016 | Positive vs. negative symptoms of schizophrenia? |
| 7A-017 | Generalized anxiety disorder? |
| 7A-018 | Obsessions vs. compulsions? |
| 7A-019 | PTSD? |
| 7A-020 | Personality disorder clusters? |
| 7A-021 | Serotonin and depression? |
| 7A-022 | Parkinson's disease? |
| 7A-023 | GABA vs. glutamate? |
| 7A-024 | Functions of the four lobes? |
| 7A-025 | Role of the thalamus? |
| 7A-026 | Role of the cerebellum? |
| 7A-027 | Role of the medulla? |
| 7A-028 | Brain lateralization? |
| 7A-029 | EEG vs. fMRI vs. PET? |
| 7A-030 | Heritability? |
| 7A-031 | Yerkes–Dodson law? |
| 7A-032 | Dopamine hypothesis of schizophrenia? |
| 7A-033 | Maslow's hierarchy, bottom to top? |
| 7A-034 | What is the diathesis–stress model? |
| 7A-035 | How does generalized anxiety disorder differ from a specific phobia? |
| 7A-036 | What is the defining feature of a manic episode? |
| 7A-037 | What distinguishes a delusion from a hallucination? |
| 7A-038 | What is anhedonia? |
| 7A-039 | What is the Yerkes–Dodson law's general claim? |
| 7A-040 | What does learned helplessness describe? |

### 7B · Social influence on behavior (21)

| ID | Question |
|---|---|
| 7B-001 | Social loafing? |
| 7B-002 | Deindividuation? |
| 7B-003 | Group polarization? |
| 7B-004 | Asch's conformity studies? |
| 7B-005 | Milgram's obedience study? |
| 7B-006 | Stanford prison experiment? |
| 7B-007 | Theories of deviance? |
| 7B-008 | Anomie? |
| 7B-009 | Social facilitation? |
| 7B-010 | Bystander effect? |
| 7B-011 | Groupthink? |
| 7B-012 | What is diffusion of responsibility? |
| 7B-013 | What is pluralistic ignorance? |
| 7B-014 | What is minority influence? |
| 7B-015 | What is the lowball technique? |
| 7B-016 | What is the that’s-not-all technique? |
| 7B-017 | How does descriptive social influence differ from injunctive influence? |
| 7B-018 | What is social impact theory? |
| 7B-019 | What is psychological reactance? |
| 7B-020 | What is the third-person effect? |
| 7B-021 | How do informational and normative influence differ? |

### 7C · Learning and attitude change (14)

| ID | Question |
|---|---|
| 7C-001 | Habituation vs. dishabituation? |
| 7C-002 | Generalization vs. discrimination? |
| 7C-003 | Extinction and spontaneous recovery? |
| 7C-004 | Four reinforcement schedules? |
| 7C-005 | Shaping? |
| 7C-006 | Observational learning? |
| 7C-007 | Escape vs. avoidance learning? |
| 7C-008 | Foot-in-the-door vs. door-in-the-face? |
| 7C-009 | Elaboration likelihood model? |
| 7C-010 | Classical conditioning in one line? |
| 7C-011 | Positive vs. negative reinforcement? |
| 7C-012 | Positive vs. negative punishment? |
| 7C-013 | Which reinforcement schedule is most resistant to extinction? |
| 7C-014 | Cognitive dissonance? |

### 8A · Self and identity (18)

| ID | Question |
|---|---|
| 8A-001 | Ainsworth's attachment styles? |
| 8A-002 | Harlow's monkey studies? |
| 8A-003 | Vygotsky's zone of proximal development? |
| 8A-004 | Self-concept vs. self-esteem? |
| 8A-005 | Looking-glass self? |
| 8A-006 | Piaget's stages in order? |
| 8A-007 | Kohlberg's three levels of moral development? |
| 8A-008 | Erikson's adolescent stage? |
| 8A-009 | What is role engulfment? |
| 8A-010 | What is an identity moratorium in Marcia’s framework? |
| 8A-011 | What is identity foreclosure? |
| 8A-012 | What is identity diffusion? |
| 8A-013 | What is identity achievement? |
| 8A-014 | How does the generalized other shape the self in Mead’s theory? |
| 8A-015 | What is the difference between Mead’s “I” and “me”? |
| 8A-016 | What is self-discrepancy theory? |
| 8A-017 | How do ideal-self and ought-self discrepancies differ? |
| 8A-018 | What is narrative identity? |

### 8B · Social thinking (17)

| ID | Question |
|---|---|
| 8B-001 | Actor–observer bias? |
| 8B-002 | Self-serving bias? |
| 8B-003 | Just-world hypothesis? |
| 8B-004 | Halo effect? |
| 8B-005 | Stereotype vs. prejudice vs. discrimination? |
| 8B-006 | Stereotype threat? |
| 8B-007 | Self-fulfilling prophecy? |
| 8B-008 | In-group bias? |
| 8B-009 | Fundamental attribution error? |
| 8B-010 | Kelley's covariation model? |
| 8B-011 | Optimism bias? |
| 8B-012 | Out-group homogeneity bias? |
| 8B-013 | Contact hypothesis? |
| 8B-014 | False consensus effect? |
| 8B-015 | Primacy effect in impressions? |
| 8B-016 | What is implicit bias? |
| 8B-017 | What are the key conditions of Allport’s contact hypothesis? |

### 8C · Social interactions (24)

| ID | Question |
|---|---|
| 8C-001 | Mere exposure effect? |
| 8C-002 | Frustration–aggression hypothesis? |
| 8C-003 | Primary vs. secondary groups? |
| 8C-004 | Role strain vs. role conflict? |
| 8C-005 | Master status? |
| 8C-006 | Dramaturgical approach? |
| 8C-007 | Ascribed vs. achieved status? |
| 8C-008 | Status vs. role? |
| 8C-009 | Reference group? |
| 8C-010 | Dyad vs. triad? |
| 8C-011 | Impression management? |
| 8C-012 | Empathy–altruism hypothesis? |
| 8C-013 | Strength of weak ties? |
| 8C-014 | Sternberg's triangular theory of love? |
| 8C-015 | Types of social support? |
| 8C-016 | What is social penetration theory? |
| 8C-017 | What does reciprocity of self-disclosure mean? |
| 8C-018 | How does equity theory explain relationship dissatisfaction? |
| 8C-019 | What distinguishes a communal from an exchange relationship? |
| 8C-020 | What is the propinquity effect? |
| 8C-021 | What is a structural hole in a social network? |
| 8C-022 | How does assortative mating affect partner choice? |
| 8C-023 | What is emotional contagion? |
| 8C-024 | How does social support buffer stress? |

### 9A · Social structure and culture (19)

| ID | Question |
|---|---|
| 9A-001 | Social exchange theory? |
| 9A-002 | Hidden curriculum? |
| 9A-003 | Teacher expectancy effect? |
| 9A-004 | Folkways, mores, taboos? |
| 9A-005 | Weber's ideal bureaucracy? |
| 9A-006 | Medicalization? |
| 9A-007 | Parsons' sick role? |
| 9A-008 | Three big sociological paradigms? |
| 9A-009 | Mechanical vs. organic solidarity (Durkheim)? |
| 9A-010 | Major social institutions? |
| 9A-011 | Secularization? |
| 9A-012 | Church vs. sect vs. cult? |
| 9A-013 | Capitalism vs. socialism? |
| 9A-014 | Culture lag? |
| 9A-015 | Subculture vs. counterculture? |
| 9A-016 | What is a social institution? |
| 9A-017 | What is a cultural norm? |
| 9A-018 | What are mores? |
| 9A-019 | What is cultural diffusion? |

### 9B · Demographics (30)

| ID | Question |
|---|---|
| 9B-001 | Push vs. pull factors in migration? |
| 9B-002 | Gentrification? |
| 9B-003 | World systems theory? |
| 9B-004 | Demographic transition model? |
| 9B-005 | Crude birth and death rates? |
| 9B-006 | Replacement-level fertility? |
| 9B-007 | Population pyramid shapes? |
| 9B-008 | Malthusian theory? |
| 9B-009 | Urbanization? |
| 9B-010 | Suburbanization? |
| 9B-011 | Race vs. ethnicity? |
| 9B-012 | Sex vs. gender? |
| 9B-013 | Types of social movements? |
| 9B-014 | Relative deprivation theory? |
| 9B-015 | Globalization? |
| 9B-016 | What is a population pyramid? |
| 9B-017 | What does a high dependency ratio suggest? |
| 9B-018 | What is total fertility rate? |
| 9B-019 | What characterizes the second stage of demographic transition? |
| 9B-020 | What characterizes the fourth stage of demographic transition? |
| 9B-021 | What is population momentum? |
| 9B-022 | What is net migration? |
| 9B-023 | What is epidemiological transition? |
| 9B-024 | What is the difference between incidence and prevalence? |
| 9B-025 | How can increasing disease duration affect prevalence? |
| 9B-026 | What is a cohort study? |
| 9B-027 | What is a cross-sectional study? |
| 9B-028 | What is an ecological fallacy? |
| 9B-029 | What is relative risk in an exposure study? |
| 9B-030 | What does a relative risk of 1 indicate? |

### 10A · Social inequality (16)

| ID | Question |
|---|---|
| 10A-001 | Class vs. caste systems? |
| 10A-002 | Intergenerational vs. intragenerational mobility? |
| 10A-003 | Absolute vs. relative poverty? |
| 10A-004 | Cultural capital? |
| 10A-005 | Social reproduction? |
| 10A-006 | Intersectionality? |
| 10A-007 | Socioeconomic status (SES)? |
| 10A-008 | Weber's three dimensions of stratification? |
| 10A-009 | Meritocracy? |
| 10A-010 | Individual vs. institutional discrimination? |
| 10A-011 | Social capital? |
| 10A-012 | Residential segregation? |
| 10A-013 | Environmental justice? |
| 10A-014 | Health disparities? |
| 10A-015 | Glass ceiling? |
| 10A-016 | What is social stratification? |

### C0 · Test format and pacing (4)

| ID | Question |
|---|---|
| C0-001 | CARS format? |
| C0-002 | If two answers seem right? |
| C0-003 | When to skip a question? |
| C0-004 | MCAT score ranges? |

### C1 · Foundations of comprehension (6)

| ID | Question |
|---|---|
| C1-001 | Main idea vs. primary purpose? |
| C1-002 | Author's view vs. views presented? |
| C1-003 | Contrast keywords to watch? |
| C1-004 | How to read tone? |
| C1-005 | How should you handle an unfamiliar term in a CARS passage? |
| C1-006 | How do you distinguish an author’s concession from the thesis? |

### C2 · Reasoning within the text (9)

| ID | Question |
|---|---|
| C2-001 | How to handle a "strengthen" question? |
| C2-002 | How to handle a "weaken" question? |
| C2-003 | What is an assumption question asking? |
| C2-004 | What counts as a valid inference? |
| C2-005 | Red flag in answer choices? |
| C2-006 | What makes an answer too extreme in CARS? |
| C2-007 | Why are partly correct CARS options often wrong? |
| C2-008 | How should a CARS evidence question be approached? |
| C2-009 | What is the difference between correlation and causation in CARS arguments? |

### C3 · Reasoning beyond the text (2)

| ID | Question |
|---|---|
| C3-001 | How to handle "apply" questions? |
| C3-002 | Analogy questions? |
