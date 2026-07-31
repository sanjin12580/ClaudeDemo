// ============================================================
// ConsumptionCard — 单条读书观影卡片
// ============================================================

import { CARD_CLASSES } from '../lib/base';
import { renderStars, CONSUMPTION_TYPES, CONSUMPTION_STATUSES } from '../lib/parseConsumptions';
import type { ConsumptionItem } from '../lib/parseConsumptions';

export default function ConsumptionCard({ item }: { item: ConsumptionItem }) {
  const typeInfo = CONSUMPTION_TYPES.find((t) => t.key === item.type);
  const statusInfo = CONSUMPTION_STATUSES.find((s) => s.key === item.status);

  return (
    <div
      className={`${CARD_CLASSES} block`}
    >
      {/* 封面 + 类型标签 */}
      <div className="relative mb-3">
        {item.cover ? (
          <img
            src={item.cover}
            alt={item.title}
            className="w-full h-40 object-cover rounded-lg bg-gray-100 dark:bg-gray-800"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-40 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl">
            {typeInfo?.emoji ?? '📦'}
          </div>
        )}
        <span className="absolute top-2 left-2 badge badge-sm bg-white/90 dark:bg-gray-900/90 text-xs">
          {typeInfo?.label}
        </span>
        {statusInfo && (
          <span className={`absolute top-2 right-2 badge badge-sm ${statusInfo.color} text-xs`}>
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* 标题 */}
      <h3 className="text-sm font-semibold truncate mb-1.5 group-hover:text-green-600 transition-colors">
        {item.title}
      </h3>

      {/* 星级 */}
      <div className="text-xs mb-2">{renderStars(item.rating)}</div>

      {/* 标签 */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {item.tags.map((t) => (
            <span key={t} className="badge badge-xs badge-ghost text-[10px]">{t}</span>
          ))}
        </div>
      )}

      {/* 感受预览（截断） */}
      {item.review && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {item.review.replace(/[#>*-]/g, '').trim()}
        </p>
      )}
    </div>
  );
}
