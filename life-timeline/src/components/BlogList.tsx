import { useState, useMemo, lazy, Suspense } from 'react';
import type { PostMeta } from '../lib/types';
import { groupPostsByYear, getAllTags } from '../lib/postUtils';
import BlogCard from './BlogCard';
import { useI18n } from '../lib/i18n';

const EventPostEditDialog = lazy(() => import('./edit/EventPostEditDialog'));
const DevToaster = lazy(() => import('./edit/DevToaster'));

interface Props {
  posts: PostMeta[];
  /** 仅开发环境：启用卡片原地编辑与新建 */
  editable?: boolean;
}

export default function BlogList({ posts, editable }: Props) {
  const { blog: t, editMode: em } = useI18n();
  const [editingPost, setEditingPost] = useState<PostMeta | null>(null);
  const [creating, setCreating] = useState(false);
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
      <div className="flex flex-wrap items-center gap-2">
        {tags.length > 0 && (
          <>
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
          </>
        )}
        {editable && (
          <button
            type="button"
            className="btn btn-primary btn-sm ml-auto"
            onClick={() => setCreating(true)}
          >
            {em.newPost}
          </button>
        )}
      </div>

      {/* 文章列表 */}
      {yearGroups.length > 0 ? (
        yearGroups.map((group) => (
          <section key={group.year}>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 sticky top-16 bg-white dark:bg-gray-900/80 backdrop-blur py-2 z-10">
              {group.year}
            </h2>
            <div className="space-y-4">
              {group.posts.map((post) => (
                <BlogCard key={post.slug} post={post} editable={editable} onEdit={setEditingPost} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-lg">{t.empty}</p>
        </div>
      )}
      {editable && (editingPost || creating) && (
        <Suspense fallback={null}>
          <EventPostEditDialog
            key={editingPost?.slug ?? 'new'}
            mode="posts"
            item={editingPost}
            open
            onClose={() => {
              setEditingPost(null);
              setCreating(false);
            }}
          />
        </Suspense>
      )}
      {editable && (
        <Suspense fallback={null}>
          <DevToaster />
        </Suspense>
      )}
    </div>
  );
}
