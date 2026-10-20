import type { ExploreMode } from '@/types';

export const MODE_INFO: Record<ExploreMode, { label: string; blurb: string; effect: string }> = {
  guided: { label: 'Guided discovery', blurb: 'Step-by-step questions, explanations and one recommended next action.', effect: 'Home leads with your next step; detailed sections stay collapsed until you open them.' },
  research: { label: 'Research explorer', blurb: 'Open topic search, literature, official documents, datasets and filters.', effect: 'Search and evidence come first; topic pages open on literature and sources.' },
  visual: { label: 'Visual explorer', blurb: 'Map-first navigation, geographic comparisons and interactive charts.', effect: 'The map and comparison charts lead; topic pages open on the score chart.' },
  career: { label: 'Career-first explorer', blurb: 'Start from professional roles and work back to thesis topics.', effect: 'Roles, employers and portfolio outputs come first; topic pages open on careers.' },
  policy: { label: 'Policy challenge explorer', blurb: 'Start from concrete public-policy problems and explore possible research questions.', effect: 'Home starts from policy problems; topic pages open on implementation challenges and recommendations.' },
  method: { label: 'Method-first explorer', blurb: 'Start from research methods and find topics that suit them.', effect: 'Methods lead; topic pages open on design, skills and learning needs.' },
  hybrid: { label: 'Hybrid explorer', blurb: 'Combine approaches: everything is shown.', effect: 'All sections are visible at once.' },
};
