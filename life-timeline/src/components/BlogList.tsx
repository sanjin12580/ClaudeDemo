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
            className={`btn btn-sm text-xs transition-all duration-200
              ${selectedTag === null ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t.allTags}
          </button>
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`btn btn-sm text-xs transition-all duration-200
                ${selectedTag === tag ? 'btn-primary' : 'btn-ghost'}`}
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
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 sticky top-16 bg-white dark:bg-gray-900/80 backdrop-blur py-2 z-10">
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
