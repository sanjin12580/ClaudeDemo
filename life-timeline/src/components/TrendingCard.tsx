// ============================================================
// TrendingCard — 单个 GitHub 热门项目卡片
// ============================================================

import { CARD_CLASSES } from '../lib/base';
import { getLanguageColor } from '../lib/languageColors';
import type { TrendingRepo } from '../lib/fetchTrending';

/** 将 star 数格式化为人类可读 */
function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** 相对时间 */
function relativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 30) return `${days} 天前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

export default function TrendingCard({ repo }: { repo: TrendingRepo }) {
  const langColor = getLanguageColor(repo.language);
  const topics = (repo.topics ?? []).slice(0, 3);

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${CARD_CLASSES} block no-underline text-current`}
    >
      {/* 头部：头像 + 项目名 + star */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
          className="w-8 h-8 rounded-md flex-shrink-0 bg-gray-100 dark:bg-gray-800"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold truncate group-hover:text-green-600 transition-colors">
            {repo.full_name}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          <span className="text-yellow-500 text-sm">★</span>
          <span className="font-medium tabular-nums">{formatStars(repo.stargazers_count)}</span>
        </div>
      </div>

      {/* 描述 */}
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3 min-h-[2.5em]">
        {repo.description || '暂无描述'}
      </p>

      {/* 底部：语言 + 时间 + 标签 */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400 dark:text-gray-500">
        {/* 语言 */}
        {repo.language && (
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: langColor }}
            />
            {repo.language}
          </span>
        )}

        {/* 创建时间 */}
        <span>📅 {relativeTime(repo.created_at)}</span>

        {/* 主题标签 */}
        {topics.map((t) => (
          <span key={t} className="badge badge-xs badge-ghost text-[10px]">{t}</span>
        ))}
      </div>
    </a>
  );
}
