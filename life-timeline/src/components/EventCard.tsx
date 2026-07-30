import type { EventMeta } from '../lib/types';
import { CATEGORY_COLORS } from '../lib/types';
import { useI18n } from '../lib/i18n';
import { to, formatDate, CARD_CLASSES } from '../lib/base';

interface Props {
  event: EventMeta;
}

function StarRating({ value }: { value: number }) {
  const { eventCard: t } = useI18n();
  return (
    <span className="inline-flex gap-0.5" title={t.importance(value)}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-xs ${i < value ? 'text-yellow-500' : 'text-base-300'}`}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function EventCard({ event }: Props) {
  const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['其他'];

  return (
    <a
      href={to(`/events/${event.slug}`)}
      className={CARD_CLASSES}
    >
      {/* 头部：分类 + 日期 + 星级 */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className={`badge badge-sm font-medium ${catColor}`}>
          {event.category}
        </span>
        <time className="text-sm text-gray-500 dark:text-gray-400 font-mono tabular-nums">
          {formatDate(event.date)}
        </time>
        {event.location && (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            📍 {event.location}
          </span>
        )}
        <div className="ml-auto">
          <StarRating value={event.importance} />
        </div>
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
        {event.title}
      </h3>

      {/* 摘要 */}
      {event.body && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
          {event.body.replace(/[#*`>![\]()]/g, '').slice(0, 200)}
        </p>
      )}

      {/* 标签 */}
      {event.tags.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {event.tags.map((tag) => (
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
