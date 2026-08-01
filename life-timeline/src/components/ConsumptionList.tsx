// ============================================================
// ConsumptionList — 读书观影清单
// 「状态管理」分栏（想看/在看/看过） + 「时间轴」两种视图 + 搜索
// ============================================================

import { useState, useMemo } from 'react';
import { CONSUMPTION_TYPES, renderStars } from '../lib/parseConsumptions';
import type { ConsumptionItem } from '../lib/parseConsumptions';
import { useI18n } from '../lib/i18n';
import { to, coverUrl } from '../lib/base';

interface Props {
  items: ConsumptionItem[];
}

type View = 'board' | 'timeline';

const STATUS_ORDER = ['want', 'doing', 'done'] as const;

export default function ConsumptionList({ items }: Props) {
  const { consumptionsPage: t, admin: adminT } = useI18n();
  const [view, setView] = useState<View>('board');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      if (item.title.toLowerCase().includes(q)) return true;
      if ((item.author ?? '').toLowerCase().includes(q)) return true;
      if (item.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [items, searchQuery]);

  const typeLabel = (type: ConsumptionItem['type']) =>
    adminT.consumptionTypeOptions[type] ?? type;

  const statusLabel: Record<string, string> = {
    want: t.want,
    doing: t.doing,
    done: t.done,
  };

  const metaLine = (item: ConsumptionItem) =>
    [item.year, item.author, typeLabel(item.type)].filter(Boolean).join(' · ');

  const reviewPreview = (review: string) =>
    review.replace(/[#>*-]/g, '').trim();

  const cover = (item: ConsumptionItem) =>
    item.cover ? (
      <img
        src={coverUrl(item.cover)}
        alt={item.title}
        loading="lazy"
        className="w-12 h-16 object-cover rounded shrink-0 bg-gray-100 dark:bg-gray-800"
      />
    ) : (
      <div className="w-12 h-16 rounded shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl">
        {CONSUMPTION_TYPES.find((x) => x.key === item.type)?.emoji ?? '📦'}
      </div>
    );

  const row = (item: ConsumptionItem) => (
    <a
      key={item.id}
      href={to(`/consumptions/${item.id}`)}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
    >
      {cover(item)}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold truncate">{item.title}</h3>
        </div>
        {metaLine(item) && (
          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {metaLine(item)}
          </div>
        )}
        <div className="text-[11px] text-amber-500 mt-0.5">{renderStars(item.rating)}</div>
        {item.review && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mt-1">
            {reviewPreview(item.review)}
          </p>
        )}
      </div>
    </a>
  );

  // 时间轴：只看「已看」，按年份倒序分组
  const timelineGroups = useMemo(() => {
    const done = filtered.filter((i) => i.status === 'done');
    const map = new Map<number, ConsumptionItem[]>();
    for (const item of done) {
      const year = parseInt(item.date.slice(0, 4), 10);
      if (isNaN(year)) continue;
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(item);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b - a)
      .map(([year, list]) => ({
        year,
        list: list.sort((a, b) => b.date.localeCompare(a.date)),
      }));
  }, [filtered]);

  return (
    <div>
      {/* 视图切换 + 搜索 */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1.5">
          <button
            className={`btn btn-xs ${view === 'board' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('board')}
          >
            {t.board}
          </button>
          <button
            className={`btn btn-xs ${view === 'timeline' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setView('timeline')}
          >
            {t.timeline}
          </button>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.search}
          className="input input-bordered input-xs flex-1 min-w-[180px]"
        />
      </div>

      {view === 'board' ? (
        /* 状态分栏 */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_ORDER.map((status) => {
            const list = filtered.filter((i) => i.status === status);
            return (
              <div
                key={status}
                className="card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-sm font-semibold">{statusLabel[status]}</h2>
                  <span className="badge badge-sm badge-ghost">{list.length}</span>
                </div>
                <div className="p-2">
                  {list.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
                      {t.empty}
                    </p>
                  ) : (
                    list.map(row)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 时间轴 */
        <div className="space-y-8">
          {timelineGroups.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-16">
              {t.noResults}
            </p>
          ) : (
            timelineGroups.map((group) => (
              <section key={group.year}>
                <h2 className="text-2xl font-bold text-gray-200 dark:text-gray-700 mb-4">
                  {group.year}
                </h2>
                <div className="space-y-3 pl-6 border-l-2 border-green-200 dark:border-green-800">
                  {group.list.map((item) => (
                    <a
                      key={item.id}
                      href={to(`/consumptions/${item.id}`)}
                      className="relative flex items-start gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="absolute -left-[calc(1.5rem+5px)] top-5 w-2.5 h-2.5 rounded-full bg-green-600 dark:bg-green-500 ring-2 ring-base-100" />
                      {cover(item)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold truncate">{item.title}</h3>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                            {item.date}
                          </span>
                        </div>
                        {metaLine(item) && (
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                            {metaLine(item)}
                          </div>
                        )}
                        <div className="text-[11px] text-amber-500 mt-0.5">{renderStars(item.rating)}</div>
                        {item.review && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1">
                            {reviewPreview(item.review)}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
