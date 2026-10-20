import type { Approach, Criterion, DocLang, Method, Region, Theme, Theory } from '@/types';

export const THEMES: Theme[] = [
  { id: 'governance', label: 'Migration governance', blurb: 'Who decides, coordinates and delivers migration policy.' },
  { id: 'asylum', label: 'Asylum and refugee protection', blurb: 'Access to protection, reception and status determination.' },
  { id: 'border', label: 'Irregular migration and border governance', blurb: 'Control, irregularity, regularisation and enforcement.' },
  { id: 'integration', label: 'Migration and integration', blurb: 'Reception, language, labour market, social inclusion.' },
  { id: 'citizenship', label: 'Citizenship and access to rights', blurb: 'Formal status and the practical use of rights.' },
  { id: 'labour', label: 'Labour migration', blurb: 'Work permits, labour demand, circular and seasonal schemes.' },
  { id: 'inequality', label: 'Migration and inequality', blurb: 'Unequal outcomes between groups, places and statuses.' },
  { id: 'gender', label: 'Gender and intersectionality', blurb: 'How gender, race, class and status combine in policy effects.' },
  { id: 'opinion', label: 'Public opinion and political discourse', blurb: 'Attitudes, party competition and policy responsiveness.' },
  { id: 'local', label: 'Local and regional migration governance', blurb: 'Municipalities and regions as policy actors.' },
  { id: 'eu', label: 'EU migration and asylum policy', blurb: 'Common rules, solidarity and member-state implementation.' },
  { id: 'mediterranean', label: 'Mediterranean migration and geopolitics', blurb: 'Routes, partners and regional politics.' },
  { id: 'externalisation', label: 'Externalisation of migration control', blurb: 'Cooperation and conditionality with third countries.' },
  { id: 'development', label: 'Development and displacement', blurb: 'Links between aid, development and mobility.' },
  { id: 'climate', label: 'Climate-related mobility', blurb: 'Environmental drivers and protection gaps.' },
  { id: 'implementation', label: 'Public policy implementation', blurb: 'The distance between policy design and delivery.' },
  { id: 'capacity', label: 'Administrative capacity and coordination', blurb: 'Resources, staffing and inter-institutional coordination.' },
  { id: 'evaluation', label: 'Policy evaluation and public-sector effectiveness', blurb: 'Does it work, for whom, and how would we know.' },
  { id: 'discretion', label: 'Bureaucratic discretion and unequal outcomes', blurb: 'Street-level choices that shape who gets what.' },
  { id: 'globalgov', label: 'Global migration governance', blurb: 'UN compacts, multilateral bodies and how global norms reach states.' },
  { id: 'displacement', label: 'Refugee protection and displacement beyond Europe', blurb: 'Hosting, camps, settlements and rights in the Global South.' },
  { id: 'diaspora', label: 'Diaspora, remittances and origin-state policy', blurb: 'How countries of origin engage their citizens abroad.' },
  { id: 'regionalism', label: 'Regional mobility regimes', blurb: 'Free movement and residence agreements in Africa, the Americas and Asia.' },
  { id: 'trafficking', label: 'Trafficking, smuggling and exploitation', blurb: 'Criminal law, victim protection and labour exploitation.' },
  { id: 'digital', label: 'Technology, data and digital borders', blurb: 'Biometrics, databases and automated decisions in migration systems.' },
  { id: 'returns', label: 'Return, readmission and detention', blurb: 'Removal, readmission agreements and immigration detention.' },
];

export const APPROACHES: Approach[] = [
  { id: 'explain', label: 'Explain why a policy problem occurs', blurb: 'Causal or institutional explanation.' },
  { id: 'decisions', label: 'Understand how policy decisions are made', blurb: 'Agenda-setting, actors, ideas, bargaining.' },
  { id: 'compare', label: 'Compare countries, regions or institutions', blurb: 'Systematic comparison across cases.' },
  { id: 'evaluate', label: 'Evaluate whether a policy works', blurb: 'Outcomes, effects, evidence quality.' },
  { id: 'implgap', label: 'Investigate why implementation differs from design', blurb: 'Implementation gaps and variation.' },
  { id: 'inequalities', label: 'Study inequalities and unintended consequences', blurb: 'Distributional effects, side-effects.' },
  { id: 'conflict', label: 'Understand political and institutional conflict', blurb: 'Competence disputes, contestation.' },
  { id: 'recommend', label: 'Design practical policy recommendations', blurb: 'Actionable advice for public bodies.' },
  { id: 'tools', label: 'Develop tools for public-sector decisions', blurb: 'Dashboards, frameworks, indicators.' },
  { id: 'effects', label: 'Investigate effects on different populations', blurb: 'Who gains and who loses.' },
  { id: 'diffusion', label: 'Trace how policies and norms travel across borders', blurb: 'Policy transfer, diffusion and contested international norms.' },
];

export const REGIONS: { id: Region; label: string }[] = [
  { id: 'europe', label: 'Europe (EU and neighbours)' },
  { id: 'mena', label: 'Middle East and North Africa' },
  { id: 'ssa', label: 'Sub-Saharan Africa' },
  { id: 'latam', label: 'Latin America and the Caribbean' },
  { id: 'northam', label: 'North America' },
  { id: 'asia', label: 'Asia (South, Southeast and East)' },
  { id: 'oceania', label: 'Oceania and the Pacific' },
  { id: 'global', label: 'Global or multilateral' },
];
export const regionLabel = (id: string) => REGIONS.find((r) => r.id === id)?.label ?? id;

/** Languages besides English in which primary documents are mainly published. */
export const DOC_LANGS: { id: DocLang; label: string }[] = [
  { id: 'es', label: 'Spanish' }, { id: 'ca', label: 'Catalan' }, { id: 'fr', label: 'French' }, { id: 'ar', label: 'Arabic' }, { id: 'pt', label: 'Portuguese' },
];

export const METHOD_IDS = [
  'quant', 'interviews', 'documents', 'comparative', 'tracing', 'evaluation', 'mixed',
  'admin', 'opendata', 'geospatial', 'content', 'fieldwork', 'stakeholder', 'me',
] as const;

export const ENVIRONMENTS = [
  { id: 'admin', label: 'National, regional or local public administration' },
  { id: 'eu', label: 'EU institutions and agencies' },
  { id: 'io', label: 'International organisations' },
  { id: 'thinktank', label: 'Think tanks and policy research centres' },
  { id: 'ngo', label: 'Migration and integration NGOs' },
  { id: 'consultancy', label: 'Policy consultancy' },
  { id: 'academia', label: 'Research and academia' },
  { id: 'coop', label: 'International cooperation' },
  { id: 'mel', label: 'Monitoring, evaluation and learning' },
  { id: 'advisory', label: 'Policy analysis and strategic advisory work' },
  { id: 'pm', label: 'Programme and project management' },
  { id: 'data', label: 'Research and data analysis' },
  { id: 'advocacy', label: 'Advocacy and policy communications' },
] as const;

export const CRITERIA: Criterion[] = [
  { id: 'interest', label: 'Personal-interest alignment', description: 'How strongly the topic matches your stated themes and approaches (computed from your profile).', kind: 'personal', higherIsBetter: true },
  { id: 'career', label: 'Career alignment', description: 'Overlap between the roles this topic supports and the environments you prefer (computed).', kind: 'personal', higherIsBetter: true },
  { id: 'track', label: 'Fit with the Migration track', description: 'Closeness to the Migration Studies electives and the master’s governance focus.', kind: 'intrinsic', higherIsBetter: true },
  { id: 'clarity', label: 'Clarity of the research question', description: 'Can the question be answered, and would you know when it has been?', kind: 'intrinsic', higherIsBetter: true },
  { id: 'academic', label: 'Academic contribution', description: 'Potential to add to a scholarly debate (a judgment, not a literature-verified gap).', kind: 'intrinsic', higherIsBetter: true },
  { id: 'policy', label: 'Policy relevance', description: 'Usefulness for decisions taken by public administrations.', kind: 'intrinsic', higherIsBetter: true },
  { id: 'evidence', label: 'Evidence availability', description: 'Does published or official material exist on this question?', kind: 'intrinsic', higherIsBetter: true },
  { id: 'data', label: 'Data accessibility', description: 'Can you obtain the data without restricted access or long delays?', kind: 'intrinsic', higherIsBetter: true },
  { id: 'methodFit', label: 'Methodological fit', description: 'Does the proposed method match the question and your skills?', kind: 'intrinsic', higherIsBetter: true },
  { id: 'scope', label: 'Scope and time requirements', description: 'Fits within roughly one term of work for a ~10,000-word article. 5 = comfortably.', kind: 'intrinsic', higherIsBetter: true },
  { id: 'ethics', label: 'Ethical simplicity', description: 'Low ethical complexity (5) to high (1): vulnerable participants, personal data.', kind: 'intrinsic', higherIsBetter: true },
  { id: 'interviews', label: 'Interview-access safety', description: 'Low reliance on hard-to-access interviewees (5) to high reliance (1).', kind: 'intrinsic', higherIsBetter: true },
  { id: 'portfolio', label: 'Professional portfolio value', description: 'Outputs you could show employers alongside the thesis.', kind: 'intrinsic', higherIsBetter: true },
];

/**
 * Frameworks are named from background knowledge of the field.
 * They are NOT verified citations: each carries a search query to find the actual literature.
 */
export const THEORIES: Theory[] = [
  { id: 'slb', label: 'Street-level bureaucracy', idea: 'Frontline workers’ discretion and routines effectively make policy.', origin: 'Lipsky, Street-Level Bureaucracy (1980)', searchQuery: 'street-level bureaucracy immigration' },
  { id: 'mlg', label: 'Multilevel governance', idea: 'Authority is dispersed across territorial levels, with overlapping competences.', origin: 'Hooghe & Marks (2001, 2003)', searchQuery: 'multilevel governance migrant integration' },
  { id: 'impl', label: 'Implementation theory', idea: 'Policy outcomes depend on delivery structures, resources and actor incentives.', origin: 'Pressman & Wildavsky (1973); Mazmanian & Sabatier (1983)', searchQuery: 'policy implementation immigration policy gap' },
  { id: 'gap', label: 'Policy gap hypothesis', idea: 'Gaps arise between stated migration policy goals and results.', origin: 'Cornelius, Martin & Hollifield (1994); Hollifield', searchQuery: 'gap hypothesis migration policy' },
  { id: 'burden', label: 'Administrative burden', idea: 'Learning, compliance and psychological costs reduce take-up of rights.', origin: 'Moynihan, Herd & Harvey (2015)', searchQuery: 'administrative burden immigrants' },
  { id: 'local', label: 'Local turn in migration policy', idea: 'Municipalities develop their own integration policies, often differing from the national line.', origin: 'Caponio & Borkert (2010); Zincone & Caponio (2006)', searchQuery: 'local turn migration policy cities' },
  { id: 'intercult', label: 'Interculturalism', idea: 'Policy approach centred on interaction and diversity advantage.', origin: 'Zapata-Barrero (2017) and others', searchQuery: 'interculturalism local policy Catalonia' },
  { id: 'liberal', label: 'Liberal paradox / migration state', idea: 'Economic openness and political-security closure pull policy in opposite directions.', origin: 'Hollifield (2004)', searchQuery: 'liberal paradox migration state' },
  { id: 'europ', label: 'Europeanisation', idea: 'EU rules are adapted, resisted or ignored domestically.', origin: 'Radaelli; Börzel & Risse', searchQuery: 'Europeanisation asylum policy' },
  { id: 'secur', label: 'Securitisation', idea: 'Migration framed as a security threat justifies extraordinary measures.', origin: 'Copenhagen School; Huysmans', searchQuery: 'securitisation of migration Europe' },
  { id: 'extern', label: 'Externalisation / remote control', idea: 'Control shifted to third countries and private actors.', origin: 'Zolberg; Boswell; Lavenex', searchQuery: 'externalisation migration control third countries' },
  { id: 'feedback', label: 'Policy feedback', idea: 'Existing policies reshape politics, actors and later choices.', origin: 'Pierson; Mettler & SoRelle', searchQuery: 'policy feedback immigration' },
  { id: 'attitudes', label: 'Public opinion and responsiveness', idea: 'Whether and when policy follows public attitudes or salience.', origin: 'Page & Shapiro; Jennings; Dennison', searchQuery: 'public opinion immigration policy responsiveness' },
  { id: 'inter', label: 'Intersectionality', idea: 'Gender, race, class and status combine to produce distinct disadvantages.', origin: 'Crenshaw (1989); McCall (2005)', searchQuery: 'intersectionality migration policy' },
  { id: 'welfare', label: 'Welfare chauvinism / deservingness', idea: 'Who is treated as deserving of public support.', origin: 'van Oorschot; Andersen & Bjørklund', searchQuery: 'deservingness welfare immigrants' },
  { id: 'evalth', label: 'Theory-based evaluation', idea: 'Test the causal chain a programme assumes (theory of change; contribution analysis).', origin: 'Weiss; Pawson & Tilley; Mayne', searchQuery: 'theory-based evaluation integration programmes' },
  { id: 'transnational', label: 'Transnationalism and diaspora institutions', idea: 'Migrants keep ties across borders, and origin states build institutions to engage them.', origin: 'Glick Schiller, Basch & Szanton Blanc (1992); Gamlen on diaspora institutions', searchQuery: 'diaspora engagement policies emigration states' },
  { id: 'regimecx', label: 'Refugee regime complex', idea: 'Refugee protection is governed by overlapping, partly competing institutions rather than one regime.', origin: 'Betts (2010)', searchQuery: 'refugee regime complex' },
  { id: 'diffusion', label: 'Policy diffusion and transfer', idea: 'Policies spread through learning, competition, coercion and emulation between governments.', origin: 'Dolowitz & Marsh (2000); Simmons, Dobbin & Garrett (2006)', searchQuery: 'policy diffusion migration policy' },
  { id: 'norms', label: 'International norm dynamics', idea: 'Norms emerge, spread and are contested or localised by states and advocacy networks.', origin: 'Finnemore & Sikkink (1998)', searchQuery: 'international norms migration governance localisation' },
  { id: 'migdip', label: 'Migration diplomacy and coercive engineered migration', idea: 'States use migration flows and cooperation as bargaining tools in foreign policy.', origin: 'Greenhill (2010); Adamson & Tsourapas (2019)', searchQuery: 'migration diplomacy' },
  { id: 'bordering', label: 'Everyday bordering', idea: 'Borders are reproduced inside states through document checks, services and employers.', origin: 'Yuval-Davis, Wemyss & Cassidy (2018)', searchQuery: 'everyday bordering' },
  { id: 'devnexus', label: 'Migration and development nexus', idea: 'Development changes migration in non-linear ways, and migration affects development through remittances and skills.', origin: 'de Haas (2010)', searchQuery: 'migration and development nexus theory' },
  { id: 'dualmarket', label: 'Dual labour markets and migrant labour regimes', idea: 'Segmented labour markets generate demand for migrant workers in insecure jobs, and legal status structures their bargaining power.', origin: 'Piore (1979); Anderson on migrant labour regimes', searchQuery: 'migrant labour regimes precarity' },
  { id: 'citregime', label: 'Citizenship regimes', idea: 'National traditions and politics shape who can acquire formal membership and on what terms.', origin: 'Brubaker (1992); Joppke', searchQuery: 'citizenship regimes naturalisation policy comparison' },
  { id: 'climateth', label: 'Climate mobility and protection gaps', idea: 'Existing legal categories rarely fit environmentally driven movement.', origin: 'Kälin; McAdam', searchQuery: 'climate displacement protection gap' },
];

export const METHODS: Method[] = [
  { id: 'comparative', label: 'Comparative case studies', fit: 'You want to explain variation across a small number of units (2–6) and can justify case selection.', evidence: 'Comparable documents or data per case; a transparent selection logic (most-similar/most-different).', analysis: 'Structured, focused comparison with the same analytic questions applied to every case; within-case narratives plus a cross-case table.', supports: 'Plausible explanations for variation and mechanisms that warrant further testing. Strong descriptive comparison.', cannotSupport: 'Statistical generalisation; strong causal claims from two or three cases.', causal: 'comparative', technical: 2, fieldwork: 2, learning: 'Case-selection logic (Mill’s methods, George & Bennett) takes about 1–2 weeks of reading.', skills: ['Case selection', 'Structured comparison', 'Analytic writing'] },
  { id: 'documents', label: 'Qualitative document / legislative analysis', fit: 'The question concerns what policies say, how they changed, or how actors justify them.', evidence: 'Legislation, regulations, parliamentary records, official plans and guidance, available in full text.', analysis: 'Systematic coding of provisions (e.g. who is eligible, which authority decides, what discretion exists) in a codebook; compare across time or jurisdictions.', supports: 'Claims about policy design, change and stated rationale.', cannotSupport: 'Claims about what actually happens in practice, which requires implementation evidence.', causal: 'interpretive', technical: 1, fieldwork: 1, learning: 'Qualitative coding with a free tool (e.g. Taguette, or spreadsheets) can be learned in days.', skills: ['Legal and policy document analysis', 'Coding schemes', 'EU/Spanish legal sources'] },
  { id: 'interviews', label: 'Semi-structured interviews', fit: 'You need to understand practice, reasoning and constraints that documents do not reveal.', evidence: '8–20 interviews with officials, caseworkers, NGO staff or experts; ethical clearance and informed consent.', analysis: 'Transcription, thematic coding, triangulation with documents.', supports: 'Insight into mechanisms, perceptions and practice, from the participants’ vantage points.', cannotSupport: 'Representative claims about whole populations.', causal: 'interpretive', technical: 2, fieldwork: 4, learning: 'Interview guide design and thematic analysis: 2–3 weeks including piloting.', skills: ['Interviewing', 'Thematic analysis', 'Research ethics and consent'] },
  { id: 'tracing', label: 'Process tracing', fit: 'You want to show how a decision or reform unfolded, and test competing explanations for one outcome.', evidence: 'Dated documents, statements, press and (ideally) interviews that document the sequence.', analysis: 'Build a timeline and causal narrative; test each link with “smoking gun / hoop” style tests of evidence.', supports: 'Within-case causal claims about how an outcome came about.', cannotSupport: 'Average effects or claims about other cases.', causal: 'credible-causal', technical: 2, fieldwork: 2, learning: 'Beach & Pedersen’s process-tracing logic; 1–2 weeks of reading and a worked example.', skills: ['Causal mechanisms', 'Evidence tests', 'Chronology building'] },
  { id: 'evaluation', label: 'Policy evaluation (theory-based)', fit: 'You want to assess whether and how a programme achieves intended outcomes.', evidence: 'Programme documents, indicators, existing evaluations, administrative or survey outcomes where available.', analysis: 'Reconstruct the theory of change; assess evidence for each link; where data allow, compare before/after or treated/untreated.', supports: 'Judgments on programme logic and the strength of evidence; credible causal inference only if the design supports it.', cannotSupport: 'Causal impact claims without a credible counterfactual.', causal: 'comparative', technical: 3, fieldwork: 2, learning: 'Theory of change and contribution analysis: 2 weeks; basic quasi-experimental ideas: add 3–4 weeks.', skills: ['Evaluation design', 'Theory of change', 'Evidence appraisal'] },
  { id: 'quant', label: 'Quantitative statistical analysis', fit: 'The question is about patterns across many units and suitable data exist.', evidence: 'A dataset with enough units and the key variables (e.g. municipal-level, survey, or administrative data).', analysis: 'Descriptive statistics, regression (with controls), robustness checks, clear reporting of limits.', supports: 'Associations; with a credible design (e.g. difference-in-differences) can support causal claims.', cannotSupport: 'Causal claims from cross-sectional correlations alone.', causal: 'comparative', technical: 4, fieldwork: 1, learning: 'R or Python plus regression basics: plan 4–6 weeks of part-time learning; use UPF methods courses and open tutorials.', skills: ['R or Python', 'Regression', 'Data cleaning', 'Reproducible workflows'] },
  { id: 'opendata', label: 'Descriptive open-data analysis', fit: 'Open statistics can already show how outcomes vary and you want a solid empirical basis without modelling.', evidence: 'Open datasets (Eurostat, Idescat, INE, municipal portals) with documented definitions.', analysis: 'Cleaning, harmonising, tabulating and visualising; careful documentation of definitions and breaks in series.', supports: 'Accurate description of patterns, trends and differences.', cannotSupport: 'Explanations or causal claims.', causal: 'descriptive', technical: 3, fieldwork: 1, learning: 'Spreadsheet or R/Python basics plus a visualisation tool: 2–3 weeks.', skills: ['Open-data handling', 'Visualisation', 'Documentation of definitions'] },
  { id: 'admin', label: 'Administrative data analysis', fit: 'Records held by public bodies would directly answer the question.', evidence: 'Access to non-public or microdata, typically needing formal requests and data-protection compliance.', analysis: 'As quantitative analysis, plus strict data governance.', supports: 'Precise measurement of practice and outcomes.', cannotSupport: 'Anything if access is denied; plan a fallback design.', causal: 'comparative', technical: 4, fieldwork: 2, learning: 'Data-protection basics (GDPR) and request procedures; several weeks of waiting risk.', skills: ['Data requests', 'GDPR compliance', 'Statistical analysis'] },
  { id: 'content', label: 'Content / discourse analysis', fit: 'The question concerns how issues are framed in speeches, manifestos, media or policy texts.', evidence: 'A defined corpus (party manifestos, parliamentary debates, press) with transparent selection.', analysis: 'Coding frames or text-as-data methods; intercoder checks on a subsample.', supports: 'Claims about framing, salience and change in discourse.', cannotSupport: 'Claims that discourse caused policy change without further design.', causal: 'interpretive', technical: 2, fieldwork: 1, learning: 'Frame analysis: 1–2 weeks; optional text-as-data in Python/R: 3–4 weeks.', skills: ['Frame analysis', 'Corpus building', 'Intercoder reliability'] },
  { id: 'geospatial', label: 'Geospatial analysis', fit: 'Where things happen matters: access, distance, concentration, municipal variation.', evidence: 'Geocoded or area-level data and boundary files (open, e.g. ICGC, IGN, municipal open data).', analysis: 'Mapping, spatial joins, accessibility measures, descriptive spatial statistics.', supports: 'Descriptive spatial patterns and access gaps.', cannotSupport: 'Individual-level or causal claims without a stronger design.', causal: 'descriptive', technical: 4, fieldwork: 1, learning: 'QGIS or Python geopandas: 3–4 weeks to be productive.', skills: ['GIS', 'Spatial data wrangling', 'Cartographic design'] },
  { id: 'mixed', label: 'Mixed methods', fit: 'One method alone cannot answer the question (e.g. patterns plus mechanisms).', evidence: 'Evidence for both strands and a clear integration logic.', analysis: 'Sequential or convergent design: e.g. descriptive data to select cases, then documents or interviews to explain.', supports: 'Richer, triangulated claims.', cannotSupport: 'Depth in both strands within a short timeline: risks being shallow.', causal: 'comparative', technical: 3, fieldwork: 3, learning: 'Creswell-style design logic: 1–2 weeks, plus the skills of each strand.', skills: ['Research integration', 'Case selection from data', 'Triangulation'] },
  { id: 'fieldwork', label: 'Fieldwork and observation', fit: 'You need first-hand access to services or places.', evidence: 'Site access, ethics clearance, time on site.', analysis: 'Field notes, observation protocols, coding.', supports: 'Rich description of practice.', cannotSupport: 'Generalisation; high ethical complexity with vulnerable groups.', causal: 'interpretive', technical: 2, fieldwork: 5, learning: 'Observation ethics and field notes: 2 weeks; requires early access negotiation.', skills: ['Observation', 'Field notes', 'Access negotiation'] },
  { id: 'stakeholder', label: 'Stakeholder engagement', fit: 'The aim is a practical product shaped with the people who would use it.', evidence: 'Willing public-sector or NGO partners; time for iteration.', analysis: 'Workshops or consultations, structured feedback, documented adjustments.', supports: 'Relevance and uptake of recommendations.', cannotSupport: 'Independent evaluation (risk of capture).', causal: 'interpretive', technical: 2, fieldwork: 4, learning: 'Facilitation and consultation design: 1–2 weeks.', skills: ['Facilitation', 'Consultation design', 'Policy writing'] },
  { id: 'me', label: 'Monitoring and evaluation framework design', fit: 'You want a practical product: indicators and a framework that a public body could use.', evidence: 'Programme description, objectives, existing indicators, data sources.', analysis: 'Logframe or theory of change, indicator selection against criteria (SMART/CREAM), data-collection plan.', supports: 'A usable, reasoned framework; transferable professional skill.', cannotSupport: 'Evidence that a programme works, unless applied to data.', causal: 'descriptive', technical: 2, fieldwork: 2, learning: 'M&E basics through free courses (e.g. EU/OECD-DAC criteria): 1–2 weeks.', skills: ['Theory of change', 'Indicator design', 'Logframes'] },
];

export const methodById = (id: string) => METHODS.find((m) => m.id === id);
export const themeById = (id: string) => THEMES.find((t) => t.id === id);
export const theoryById = (id: string) => THEORIES.find((t) => t.id === id);
