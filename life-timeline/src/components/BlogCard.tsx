import type { PostMeta } from '../lib/types';
import { to, formatDate, CARD_CLASSES } from '../lib/base';

interface Props {
  post: PostMeta;
}

/** 去除 Markdown 标记，提取纯文本摘要 */
function getExcerpt(body: string, maxLen = 150): string {
  const plain = body
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/[>`#*_~]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain;
}

export default function BlogCard({ post }: Props) {
  return (
    <a
      href={to(`/blog/${post.slug}`)}
      className={CARD_CLASSES}
    >
      <time className="text-sm text-gray-500 dark:text-gray-400 font-mono tabular-nums">
        {formatDate(post.date)}
      </time>

      <h3 className="text-lg font-semibold mt-2 mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
        {post.title}
      </h3>

      {post.body && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
          {getExcerpt(post.body)}
        </p>
      )}

      {post.tags.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="badge badge-sm badge-ghost text-gray-500 dark:text-gray-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}
