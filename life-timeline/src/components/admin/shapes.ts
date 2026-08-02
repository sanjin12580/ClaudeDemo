// ============================================================
// 管理端共享表单形状（与旧 AdminPanel 保持一致）
// ============================================================

import type { Category } from '../../lib/types';

export interface EventPostForm {
  date: string;
  title: string;
  category: Category;
  tags: string;
  importance: number;
  location: string;
  content: string;
  draft: boolean;
}

export const EMPTY_EVENT_POST_FORM: EventPostForm = {
  date: '',
  title: '',
  category: '其他',
  tags: '',
  importance: 3,
  location: '',
  content: '',
  draft: false,
};

export interface GoalFormShape {
  title: string;
  description: string;
  progress: number;
  category: 'short' | 'long';
  status: 'active' | 'completed' | 'paused';
  relatedEvents: string;
}

export const EMPTY_GOAL_FORM: GoalFormShape = {
  title: '',
  description: '',
  progress: 0,
  category: 'short',
  status: 'active',
  relatedEvents: '',
};

export interface MediaFormShape {
  title: string;
  description: string;
  album: string;
}

export const EMPTY_MEDIA_FORM: MediaFormShape = {
  title: '',
  description: '',
  album: '',
};

export interface ProfileFormShape {
  name: string;
  tagline: string;
  avatar: string;
  birthDate: string;
  skills: string;
  shortGoal: string;
  longGoal: string;
}

export const EMPTY_PROFILE_FORM: ProfileFormShape = {
  name: '',
  tagline: '',
  avatar: '',
  birthDate: '',
  skills: '',
  shortGoal: '',
  longGoal: '',
};

export interface ConsumptionFormShape {
  id: string | null;
  title: string;
  type: ConsumptionType;
  status: 'done' | 'doing';
  rating: number;
  review: string;
  date: string;
  cover: string;
  tags: string;
  year: string;
  author: string;
  source: 'tmdb' | 'douban' | 'manual' | undefined;
  sourceId: string;
  sourceUrl: string;
}

type ConsumptionType = 'book' | 'novel' | 'movie' | 'tv' | 'anime' | 'variety' | 'music';

export function emptyConsumptionForm(): ConsumptionFormShape {
  return {
    id: null,
    title: '',
    type: 'book',
    status: 'done',
    rating: 3,
    review: '',
    date: new Date().toISOString().slice(0, 7),
    cover: '',
    tags: '',
    year: '',
    author: '',
    source: undefined,
    sourceId: '',
    sourceUrl: '',
  };
}
