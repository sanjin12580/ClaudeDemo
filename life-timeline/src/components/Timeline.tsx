import { useState, useMemo } from 'react';
import type { EventMeta, Category, YearGroup } from '../lib/types';
import EventCard from './EventCard';

// 所有分类选项（含"全部"）
const ALL_CATEGORIES: Array<'全部' | Category> = ['全部', '教育', '工作', '旅行', '健康', '关系', '项目', '其他'];

interface Props {
  events: EventMeta[];
}

export default function Timeline({ events }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<'全部' | Category>('全部');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 收集所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    events.forEach((e) => e.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [events]);

  // 筛选事件
  const filteredEvents = useMemo(() => {
    let result = events;
    if (selectedCategory !== '全部') {
      result = result.filter((e) => e.category === selectedCategory);
    }
    if (selectedTag) {
      result = result.filter((e) => e.tags.includes(selectedTag));
    }
    return result;
  }, [events, selectedCategory, selectedTag]);

  // 按年分组
  const yearGroups: YearGroup[] = useMemo(() => {
    const map = new Map<number, EventMeta[]>();
    for (const event of filteredEvents) {
      const year = parseInt(event.date.slice(0, 4), 10);
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(event);
    }
    return Array.from(map.entries())
      .map(([year, evts]) => ({ year, events: evts }))
      .sort((a, b) => b.year - a.year); // 最新在前
  }, [filteredEvents]);

  return (
    <div className="space-y-8">
      {/* 筛选器 */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* 分类筛选 */}
        <div className="flex gap-1.5 flex-wrap">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1 rounded-full transition-colors
                ${selectedCategory === cat
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors
                  ${selectedTag === tag
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ring-1 ring-green-400'
                    : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
                  }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 结果计数 */}
      <p className="text-sm text-gray-400">
        {filteredEvents.length} 个事件
        {selectedCategory !== '全部' && ` · 筛选: ${selectedCategory}`}
        {selectedTag && ` · #${selectedTag}`}
      </p>

      {/* 时间线 */}
      {yearGroups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">暂无匹配的事件</div>
      ) : (
        <div className="space-y-12">
          {yearGroups.map((group) => (
            <section key={group.year}>
              {/* 年份标记 */}
              <div className="sticky top-4 z-10 mb-6">
                <h2 className="text-5xl font-bold text-gray-200 dark:text-gray-800 select-none">
                  {group.year}
                </h2>
              </div>

              {/* 事件列表 */}
              <div className="space-y-4 relative pl-8 border-l-2 border-gray-200 dark:border-gray-800">
                {group.events.map((event) => (
                  <div key={event.slug} className="relative">
                    {/* 时间轴上的圆点 */}
                    <div className="absolute -left-[calc(2rem+5px)] top-6 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-950" />
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
