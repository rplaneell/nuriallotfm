import type { Topic } from '@/types';
import { TOPICS_A } from './topics-a';
import { TOPICS_B } from './topics-b';

export const TOPICS: Topic[] = [...TOPICS_A, ...TOPICS_B];
export const topicById = (id: string) => TOPICS.find((t) => t.id === id);
