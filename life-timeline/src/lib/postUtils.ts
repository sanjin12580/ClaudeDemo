/**
 * 博客文章纯工具函数（客户端安全，不依赖 astro:content）
 */

import type { PostMeta, PostYearGroup } from './types';

/**
 * 按年份分组文章（倒序）
 */
export function groupPostsByYear(posts: PostMeta[]): PostYearGroup[] {
  const map = new Map<number, PostMeta[]>();
  for (const post of posts) {
    const year = parseInt(post.date.slice(0, 4), 10);
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(post);
  }
  return Array.from(map.entries())
    .map(([year, posts]) => ({ year, posts }))
    .sort((a, b) => b.year - a.year);
}

/**
 * 获取所有标签及其出现次数（按次数降序）
 */
export function getAllTags(posts: PostMeta[]): { tag: string; count: number }[] {
  const tagMap = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 按标签过滤文章
 */
export function filterPostsByTag(posts: PostMeta[], tag: string): PostMeta[] {
  return posts.filter((post) => post.tags.includes(tag));
}
