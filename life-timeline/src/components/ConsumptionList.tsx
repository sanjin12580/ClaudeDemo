// ============================================================
// ConsumptionList — 读书观影清单（筛选 + 卡片网格）
// ============================================================

import { useState, useMemo } from 'react';
import ConsumptionCard from './ConsumptionCard';
import { CONSUMPTION_TYPES, CONSUMPTION_STATUSES } from '../lib/parseConsumptions';
import type { ConsumptionItem } from '../lib/parseConsumptions';

interface Props {
  items: ConsumptionItem[];
}

export default function ConsumptionList({ items }: Props) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return true;
    });
  }, [items, typeFilter, statusFilter]);

  return (
    <div>
      {/* 类型筛选 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          className={`btn btn-xs ${typeFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setTypeFilter('all')}
        >
          全部
        </button>
        {CONSUMPTION_TYPES.map((t) => (
          <button
            key={t.key}
            className={`btn btn-xs ${typeFilter === t.key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTypeFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 状态筛选 */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          className={`btn btn-xs ${statusFilter === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setStatusFilter('all')}
        >
          全部
        </button>
        {CONSUMPTION_STATUSES.map((s) => (
          <button
            key={s.key}
            className={`btn btn-xs ${statusFilter === s.key ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => setStatusFilter(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 统计 */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        共 {filtered.length} 条记录
      </p>

      {/* 卡片网格 */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <ConsumptionCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p className="text-4xl mb-4">📭</p>
          <p>暂无匹配的记录</p>
        </div>
      )}
    </div>
  );
}
