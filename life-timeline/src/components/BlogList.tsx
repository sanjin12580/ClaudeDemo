import { useState, useMemo } from 'react';
import type { PostMeta } from '../lib/types';
import { groupPostsByYear, getAllTags } from '../lib/postUtils';
import BlogCard from './BlogCard';
import { useI18n } from '../lib/i18n';

interface Props {
  posts: PostMeta[];
}

export default function BlogList({ posts }: Props) {
  const { blog: t } = useI18n();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tags = useMemo(() => getAllTags(posts), [posts]);

  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter((p) => p.tags.includes(selectedTag));
  }, [posts, selectedTag]);

  const yearGroups = useMemo(() => groupPostsByYear(filteredPosts), [filteredPosts]);

  return (
    <div className="space-y-8">
      {/* 标签筛选栏 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              selectedTag === null
                ? 'bg-green-600 text-white dark:bg-green-500'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t.allTags}
          </button>
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                selectedTag === tag
                  ? 'bg-green-600 text-white dark:bg-green-500'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              #{tag}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* 文章列表 */}
      {yearGroups.length > 0 ? (
        yearGroups.map((group) => (
          <section key={group.year}>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur py-2 z-10">
              {group.year}
            </h2>
            <div className="space-y-4">
              {group.posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg">{t.empty}</p>
        </div>
      )}
    </div>
  );
}
