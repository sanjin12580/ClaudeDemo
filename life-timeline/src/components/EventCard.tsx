import type { EventMeta } from '../lib/types';
import { CATEGORY_COLORS } from '../lib/types';
import { useI18n } from '../lib/i18n';

interface Props {
  event: EventMeta;
}

function StarRating({ value }: { value: number }) {
  const { eventCard: t } = useI18n();
  return (
    <span className="inline-flex gap-0.5" title={t.importance(value)}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-xs ${i < value ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}>
          ★
        </span>
      ))}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[0]} 年 ${parseInt(parts[1])} 月 ${parseInt(parts[2])} 日`;
  }
  if (parts.length === 2) {
    return `${parts[0]} 年 ${parseInt(parts[1])} 月`;
  }
  return `${parts[0]} 年`;
}

export default function EventCard({ event }: Props) {
  const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['其他'];

  return (
    <article
      className="group border border-gray-200 dark:border-gray-800 rounded-xl p-5
                 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-200
                 hover:shadow-sm bg-white dark:bg-gray-900"
    >
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
          {event.category}
        </span>
        <time className="text-sm text-gray-500 dark:text-gray-400 font-mono">
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

      <h3 className="text-lg font-semibold mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
        {event.title}
      </h3>

      {event.body && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
          {event.body.replace(/[#*`>![\]()]/g, '').slice(0, 200)}
        </p>
      )}

      {event.tags.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800
                         px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
