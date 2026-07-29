import type { PostMeta, PostYearGroup } from './types';
import { getCollection } from 'astro:content';

/**
 * 从 Astro Content Collection 加载博客文章
 * @param includeDrafts 是否包含草稿（默认 false）
 */
export async function loadPosts(includeDrafts = false): Promise<PostMeta[]> {
  const entries = await getCollection('blog', ({ data }) => includeDrafts || !data.draft);

  return entries
    .map((entry) => ({
      slug: entry.id.replace(/\.(md|mdx)$/, ''),
      date: entry.data.date,
      title: entry.data.title,
      tags: entry.data.tags ?? [],
      draft: entry.data.draft ?? false,
      body: entry.body ?? '',
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // 倒序（最新在前）
}

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
    .sort((a, b) => b.year - a.year); // 倒序（最新年份在前）
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
