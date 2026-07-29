import type { PostMeta } from '../lib/types';
import { to } from '../lib/base';

interface Props {
  post: PostMeta;
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[0]} 年 ${parseInt(parts[1])} 月 ${parseInt(parts[2])} 日`;
  }
  return dateStr;
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
      className="group card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5
                 shadow-sm hover:shadow-md hover:-translate-y-0.5
                 transition-all duration-300 cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
