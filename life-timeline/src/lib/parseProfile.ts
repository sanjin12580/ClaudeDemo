import type { Profile } from './types';
import { getCollection } from 'astro:content';

/**
 * 加载个人资料（单文件 profile/about.md）
 */
export async function loadProfile(): Promise<Profile | null> {
  const entries = await getCollection('profile');
  if (entries.length === 0) return null;
  const entry = entries[0];
  return {
    name: entry.data.name,
    tagline: entry.data.tagline,
    avatar: entry.data.avatar,
    birthDate: entry.data.birthDate,
    skills: entry.data.skills ?? [],
    shortGoal: entry.data.shortGoal,
    longGoal: entry.data.longGoal,
  };
}
