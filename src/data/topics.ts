import type { Topic } from '@/types';
import { TOPICS_A } from './topics-a';
import { TOPICS_B } from './topics-b';
import { TOPICS_GLOBAL } from './topics-global';
import { TOPICS_AFRICA_MENA } from './topics-africa-mena';
import { TOPICS_AMERICAS_OCEANIA } from './topics-americas-oceania';
import { TOPICS_ASIA_GULF } from './topics-asia-gulf';
import { TOPICS_EUROPE_SPAIN } from './topics-europe-spain';

export const TOPICS: Topic[] = [...TOPICS_A, ...TOPICS_B, ...TOPICS_GLOBAL, ...TOPICS_AFRICA_MENA, ...TOPICS_AMERICAS_OCEANIA, ...TOPICS_ASIA_GULF, ...TOPICS_EUROPE_SPAIN];
export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
