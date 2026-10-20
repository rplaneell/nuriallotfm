import type { Source } from '@/types';

const s = (id: string, name: string, publisher: string, url: string, kind: Source['kind'], access: Source['access'], geo: string, notes: string): Source =>
  ({ id, name, publisher, url, kind, access, geo, notes });

/**
 * Registry of public sources. URLs point to stable entry pages. Their liveness is tested by
 * `npm run check:links`, which writes src/data/linkstatus.json. Content is NOT summarised here:
 * the registry says where to look, not what the source says.
 */
export const SOURCES: Source[] = [
  s('eurostat-migr', 'Eurostat: Migration and asylum', 'Eurostat', 'https://ec.europa.eu/eurostat/web/migration-asylum', 'official-statistics', 'api', 'EU/EEA', 'Harmonised statistics on asylum, residence permits, citizenship. Definitions vary by dataset; check metadata for breaks in series.'),
  s('eurostat-db', 'Eurostat database', 'Eurostat', 'https://ec.europa.eu/eurostat/data/database', 'official-statistics', 'api', 'EU/EEA', 'Query and bulk download; has a REST API.'),
  s('euaa', 'EU Agency for Asylum (EUAA)', 'EUAA', 'https://euaa.europa.eu/', 'agency', 'open', 'EU', 'Asylum Report, country guidance, operational and reception analyses.'),
  s('eurlex', 'EUR-Lex', 'Publications Office of the EU', 'https://eur-lex.europa.eu/', 'legislation', 'open', 'EU', 'Official EU legislation, case law, preparatory documents. Search by CELEX number.'),
  s('ec-pact', 'Pact on Migration and Asylum (European Commission)', 'European Commission, DG HOME', 'https://home-affairs.ec.europa.eu/policies/migration-and-asylum/pact-migration-and-asylum_en', 'agency', 'open', 'EU', 'Official overview of the Pact, implementation plan and timetable. Verify dates against EUR-Lex texts.'),
  s('emn', 'European Migration Network (EMN)', 'European Commission', 'https://home-affairs.ec.europa.eu/networks/european-migration-network-emn_en', 'agency', 'open', 'EU', 'Comparative studies and ad-hoc queries across member states.'),
  s('eu-integration', 'European Website on Integration', 'European Commission', 'https://migrant-integration.ec.europa.eu/', 'agency', 'open', 'EU', 'Integration practices, country information, policy repository.'),
  s('fra', 'EU Agency for Fundamental Rights (FRA)', 'FRA', 'https://fra.europa.eu/', 'agency', 'open', 'EU', 'Reports on fundamental rights of migrants, surveys on discrimination.'),
  s('frontex', 'Frontex: migratory map and risk analysis', 'Frontex', 'https://www.frontex.europa.eu/what-we-do/monitoring-and-risk-analysis/migratory-map/', 'agency', 'open', 'EU external borders', 'Detections of irregular border crossings; counts are detections, not unique persons.'),
  s('oecd-mig', 'OECD: International Migration Outlook and integration indicators', 'OECD', 'https://www.oecd.org/en/topics/migration.html', 'agency', 'open', 'OECD', 'Annual outlook, comparative integration indicators.'),
  s('iom', 'International Organization for Migration', 'IOM', 'https://www.iom.int/', 'agency', 'open', 'Global', 'Reports, programme evaluations, data.'),
  s('iom-gmdac', 'IOM Global Migration Data Analysis Centre', 'IOM GMDAC', 'https://gmdac.iom.int/', 'agency', 'open', 'Global', 'Data portals and methodological notes.'),
  s('missing', 'IOM Missing Migrants Project', 'IOM', 'https://missingmigrants.iom.int/', 'agency', 'open', 'Global', 'Recorded deaths and disappearances; known to undercount.'),
  s('unhcr-data', 'UNHCR Refugee Statistics', 'UNHCR', 'https://www.unhcr.org/refugee-statistics/', 'agency', 'api', 'Global', 'Population statistics with API.'),
  s('unhcr-portal', 'UNHCR Operational Data Portal', 'UNHCR', 'https://data.unhcr.org/', 'agency', 'open', 'Regions/countries', 'Situation-specific data (e.g. Ukraine, Mediterranean).'),
  s('idmc', 'Internal Displacement Monitoring Centre', 'IDMC', 'https://www.internal-displacement.org/', 'agency', 'open', 'Global', 'Disaster- and conflict-related internal displacement data.'),
  s('mipex', 'Migrant Integration Policy Index (MIPEX)', 'MPG / CIDOB / partners', 'https://www.mipex.eu/', 'academic-index', 'open', 'Global', 'Policy index scoring integration policy by country; a measure of laws, not of outcomes.'),
  s('mpi', 'Migration Policy Institute', 'MPI', 'https://www.migrationpolicy.org/', 'think-tank', 'open', 'US/EU', 'Policy analysis and country profiles. Think-tank grey literature, not peer-reviewed.'),
  s('cidob', 'CIDOB: Barcelona Centre for International Affairs', 'CIDOB', 'https://www.cidob.org/', 'think-tank', 'open', 'Spain/Mediterranean', 'Local research centre with migration programme; potential contacts and publications.'),
  s('elcano', 'Real Instituto Elcano', 'Elcano', 'https://www.realinstitutoelcano.org/', 'think-tank', 'open', 'Spain', 'Policy analysis including migration.'),
  s('ine', 'Instituto Nacional de Estadística (INE)', 'INE', 'https://www.ine.es/', 'official-statistics', 'api', 'Spain', 'Padrón municipal, population by nationality, labour surveys. API available.'),
  s('opi', 'Observatorio Permanente de la Inmigración', 'Ministry of Inclusion, Social Security and Migration', 'https://www.inclusion.gob.es/web/opi/', 'official-statistics', 'open', 'Spain', 'Residence permits, work authorisations, publications by the national ministry.'),
  s('ss-stats', 'Seguridad Social: estadísticas', 'Seguridad Social', 'https://www.seg-social.es/wps/portal/wss/internet/EstadisticasPresupuestosEstudios/Estadisticas', 'official-statistics', 'open', 'Spain', 'Affiliation of foreign workers by regime and nationality.'),
  s('interior', 'Ministerio del Interior: estadísticas', 'Ministerio del Interior', 'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/estadisticas/', 'official-statistics', 'open', 'Spain', 'Irregular arrivals, asylum applications bulletins.'),
  s('boe', 'Boletín Oficial del Estado (BOE)', 'Spanish State', 'https://www.boe.es/', 'legislation', 'open', 'Spain', 'Spanish national legislation, with consolidated texts.'),
  s('defensor', 'Defensor del Pueblo', 'Spanish Ombudsman', 'https://www.defensordelpueblo.es/', 'ombuds', 'open', 'Spain', 'Annual reports and investigations on administrative practice affecting migrants.'),
  s('idescat', 'Idescat: Statistical Institute of Catalonia', 'Generalitat de Catalunya', 'https://www.idescat.cat/', 'official-statistics', 'api', 'Catalonia', 'Population by municipality and nationality, with API.'),
  s('gencat-opendata', 'Dades obertes Gencat', 'Generalitat de Catalunya', 'https://analisi.transparenciacatalunya.cat/', 'open-data', 'api', 'Catalonia', 'Socrata-based open-data portal with API; search for immigration and social services datasets.'),
  s('dogc', 'Diari Oficial de la Generalitat de Catalunya (DOGC)', 'Generalitat de Catalunya', 'https://dogc.gencat.cat/', 'legislation', 'open', 'Catalonia', 'Catalan legislation and regional decrees.'),
  s('sindic', 'Síndic de Greuges de Catalunya', 'Catalan Ombudsman', 'https://www.sindic.cat/', 'ombuds', 'open', 'Catalonia', 'Reports on access to services, reception, minors’ protection.'),
  s('bcn-opendata', 'Open Data BCN', 'Ajuntament de Barcelona', 'https://opendata-ajuntament.barcelona.cat/', 'open-data', 'api', 'Barcelona', 'Municipal datasets by neighbourhood, including population by origin and service locations.'),
  s('bcn-estadistica', 'Barcelona: Estadística i Dades Obertes', 'Ajuntament de Barcelona', 'https://portaldades.ajuntament.barcelona.cat/ca/', 'official-statistics', 'open', 'Barcelona', 'Municipal statistics and the annual survey series.'),
  s('cis', 'Centro de Investigaciones Sociológicas (CIS)', 'CIS', 'https://www.cis.es/', 'survey', 'open', 'Spain', 'Barometers with data on attitudes towards immigration; microdata downloadable.'),
  s('ess', 'European Social Survey', 'ESS ERIC', 'https://www.europeansocialsurvey.org/data', 'survey', 'open', 'Europe', 'Attitudes towards immigrants; data free after registration.'),
  s('eurobarometer', 'Eurobarometer', 'European Commission', 'https://europa.eu/eurobarometer', 'survey', 'open', 'EU', 'Public opinion surveys, including on migration.'),
  s('manifesto', 'Manifesto Project', 'WZB Berlin', 'https://manifesto-project.wzb.eu/', 'academic-index', 'registration', 'Global', 'Coded party manifestos; free after registration.'),
  s('ilo-normlex', 'ILO NORMLEX', 'ILO', 'https://normlex.ilo.org/', 'legislation', 'open', 'Global', 'Ratifications and country reports for conventions such as C189.'),
  s('openalex', 'OpenAlex', 'OurResearch', 'https://openalex.org/', 'academic-index', 'api', 'Global', 'Open scholarly index; API used by this app for literature discovery.'),
  s('crossref', 'Crossref', 'Crossref', 'https://www.crossref.org/', 'academic-index', 'api', 'Global', 'DOI metadata registry, useful to verify a reference exists.'),
  s('upf-repo', 'UPF e-repository (Repositori)', 'Universitat Pompeu Fabra', 'https://repositori.upf.edu/home', 'repository', 'api', 'UPF', 'Open repository holding some master theses. Coverage is partial: not every thesis is deposited.'),
  s('diva', 'DiVA portal (Swedish student theses)', 'Swedish university libraries', 'https://www.diva-portal.org/', 'repository', 'open', 'Sweden', 'Master’s theses from programmes in migration and ethnic relations (e.g. Malmö, Linköping).'),
  s('uu-theses', 'Utrecht University Student Theses', 'Utrecht University', 'https://studenttheses.uu.nl/', 'repository', 'api', 'Netherlands', 'Master theses across disciplines, searchable with an open API.'),
  s('upf-gov', 'UPF Master in Governance: academic information', 'Universitat Pompeu Fabra', 'https://www.upf.edu/web/master-governance/academic-information', 'agency', 'open', 'UPF', 'Official programme structure and tracks.'),
  s('upf-thesis', 'UPF Master in Governance: Master thesis', 'Universitat Pompeu Fabra', 'https://www.upf.edu/web/master-governance/master-thesis', 'agency', 'open', 'UPF', 'Official thesis rules and timetable.'),
];

export const sourceById = (id: string) => SOURCES.find((x) => x.id === id);
