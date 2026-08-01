// ============================================================
// ConsumptionList — 读书观影清单
// 封面海报墙：类型 Tab + 状态筛选（全部/在看/看过）+ 搜索
// ============================================================

import { useState, useMemo } from 'react';
import { CONSUMPTION_TYPES, renderStars } from '../lib/parseConsumptions';
import type { ConsumptionItem } from '../lib/parseConsumptions';
import { useI18n } from '../lib/i18n';
import { to, coverUrl } from '../lib/base';

interface Props {
  items: ConsumptionItem[];
}

type StatusFilter = 'all' | ConsumptionItem['status'];

/** 状态徽标配色 */
const STATUS_BADGE: Record<ConsumptionItem['status'], string> = {
  doing: 'bg-sky-500/90',
  done: 'bg-green-600/90',
};

export default function ConsumptionList({ items }: Props) {
  const { consumptionsPage: t, admin: adminT } = useI18n();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 类型计数（基于全部数据，不受筛选影响）
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const item of items) {
      map[item.type] = (map[item.type] ?? 0) + 1;
    }
    return map;
  }, [items]);

  // 状态计数
  const statusCounts = useMemo(() => {
    const map: Record<StatusFilter, number> = { all: items.length, doing: 0, done: 0 };
    for (const item of items) {
      map[item.status] = (map[item.status] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      if (item.title.toLowerCase().includes(q)) return true;
      if ((item.author ?? '').toLowerCase().includes(q)) return true;
      if (item.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [items, typeFilter, statusFilter, searchQuery]);

  const metaLine = (item: ConsumptionItem) =>
    [item.year, item.author].filter(Boolean).join(' · ');

  const reviewPreview = (review: string) => review.replace(/[#>*-]/g, '').trim();

  const typeEmoji = (type: ConsumptionItem['type']) =>
    CONSUMPTION_TYPES.find((x) => x.key === type)?.emoji ?? '📦';

  const statusLabel: Record<ConsumptionItem['status'], string> = {
    doing: t.doing,
    done: t.done,
  };

  const card = (item: ConsumptionItem) => (
    <a key={item.id} href={to(`/consumptions/${item.id}`)} className="group block">
      {/* 封面 */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm group-hover:shadow-md transition-shadow">
        {item.cover ? (
          <img
            src={coverUrl(item.cover)}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {typeEmoji(item.type)}
          </div>
        )}
        {/* 状态徽标 */}
        <span
          className={`absolute top-2 right-2 text-[10px] font-medium text-white rounded-full px-2 py-0.5 backdrop-blur-sm ${STATUS_BADGE[item.status]}`}
        >
          {statusLabel[item.status]}
        </span>
        {/* hover 浮现短评 */}
        {item.review && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <p className="text-[11px] text-white leading-relaxed line-clamp-3">
              {reviewPreview(item.review)}
            </p>
          </div>
        )}
      </div>
      {/* 标题与元信息 */}
      <div className="mt-2 px-0.5">
        <h3 className="text-sm font-semibold truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
          {item.title}
        </h3>
        {metaLine(item) && (
          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
            {metaLine(item)}
          </div>
        )}
        <div className="text-[11px] text-amber-500 mt-0.5 tracking-tight">{renderStars(item.rating)}</div>
      </div>
    </a>
  );

  const emptyBlock = (
    <div className="text-center py-20 text-gray-400 dark:text-gray-500">
      <p className="text-5xl mb-4">📭</p>
      <p className="text-sm">{t.noResults}</p>
    </div>
  );

  return (
    <div>
      {/* 搜索 + 状态筛选 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="w-full rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow"
          />
        </div>
        {/* 状态分段筛选 */}
        <div className="flex rounded-full bg-gray-100 dark:bg-gray-800 p-1 gap-1">
          {(['all', 'doing', 'done'] as StatusFilter[]).map((status) => {
            const active = statusFilter === status;
            return (
              <button
                key={status}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' ? t.all : statusLabel[status]}
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {statusCounts[status]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 类型筛选 Tab */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 -mx-1 px-1 scrollbar-thin">
        <button
          className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            typeFilter === 'all'
              ? 'bg-green-600 text-white shadow-sm'
              : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-green-400 dark:hover:border-green-600'
          }`}
          onClick={() => setTypeFilter('all')}
        >
          {t.all}
          <span
            className={`text-[10px] rounded-full px-1.5 py-0.5 ${
              typeFilter === 'all' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            }`}
          >
            {typeCounts.all ?? 0}
          </span>
        </button>
        {CONSUMPTION_TYPES.map((tp) => {
          const active = typeFilter === tp.key;
          return (
            <button
              key={tp.key}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-green-400 dark:hover:border-green-600'
              }`}
              onClick={() => setTypeFilter(tp.key)}
            >
              {adminT.consumptionTypeOptions[tp.key]}
              <span
                className={`text-[10px] rounded-full px-1.5 py-0.5 ${
                  active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}
              >
                {typeCounts[tp.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* 海报墙网格 */}
      {filtered.length === 0 ? (
        emptyBlock
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
          {filtered.map(card)}
        </div>
      )}
    </div>
  );
}
