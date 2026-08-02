// ============================================================
// TrendingSidebar — 悬浮 Top 10 总榜
// 右侧粘性面板，展示全时段最热项目
// ============================================================

import type { TrendingRepo } from '../lib/fetchTrending';

interface Props {
  title: string;
  description: string;
  repos: TrendingRepo[];
}

/** star 数格式化 */
function fmtStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** 排名徽章样式 */
const RANK_COLORS: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600',
};

export default function TrendingSidebar({ title, description, repos }: Props) {
  if (repos.length === 0) return null;

  return (
    <aside className="w-52 flex-shrink-0">
      <div className="sticky top-24 card bg-base-100 border border-base-300 p-4 shadow-sm">
        {/* 标题 */}
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
          🏆 {title}
        </h3>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
          {description}
        </p>

        {/* 排名列表 */}
        <ol className="space-y-2">
          {repos.slice(0, 10).map((repo, i) => {
            const rank = i + 1;
            return (
              <li key={repo.id}>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 group/item text-current no-underline"
                >
                  {/* 排名 */}
                  <span
                    className={`text-xs font-bold w-4 text-right tabular-nums flex-shrink-0 ${
                      RANK_COLORS[rank] ?? 'text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {rank}
                  </span>

                  {/* 项目名 + star */}
                  <span className="min-w-0 flex-1 flex items-center gap-1">
                    <span className="text-xs truncate group-hover/item:text-green-600 transition-colors">
                      {repo.full_name}
                    </span>
                  </span>

                  <span className="text-[10px] text-yellow-500 flex-shrink-0 font-medium tabular-nums">
                    ★ {fmtStars(repo.stargazers_count)}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
