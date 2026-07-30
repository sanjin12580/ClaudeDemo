import type { PostMeta } from './types';
import { getCollection } from 'astro:content';

// 纯工具函数从客户端安全模块重导出
export { groupPostsByYear, getAllTags, filterPostsByTag } from './postUtils';

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
