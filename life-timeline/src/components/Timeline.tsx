import { useState, useMemo } from 'react';
import type { EventMeta, YearGroup } from '../lib/types';
import { useI18n } from '../lib/i18n';
import EventCard from './EventCard';
import SearchBar from './SearchBar';

interface Props {
  events: EventMeta[];
}

export default function Timeline({ events }: Props) {
  const { timeline: t, categories: catT } = useI18n();

  const allCats: Array<string> = [catT.all, ...Object.keys(catT).filter(k => k !== 'all')];
  const [selectedCategory, setSelectedCategory] = useState<string>(catT.all);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 收集所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    events.forEach((e) => e.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [events]);

  // 搜索过滤
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase().trim();
    return events.filter((event) => {
      if (event.title.toLowerCase().includes(q)) return true;
      if (event.category.includes(q)) return true;
      if (event.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
      if (event.location?.toLowerCase().includes(q)) return true;
      if (event.body.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [events, searchQuery]);

  // 分类/标签筛选
  const filteredEvents = useMemo(() => {
    let result = searchFiltered;
    if (selectedCategory !== catT.all) {
      result = result.filter((e) => e.category === selectedCategory);
    }
    if (selectedTag) {
      result = result.filter((e) => e.tags.includes(selectedTag));
    }
    return result;
  }, [searchFiltered, selectedCategory, selectedTag, catT.all]);

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
      .sort((a, b) => b.year - a.year);
  }, [filteredEvents]);

  return (
    <div className="space-y-8">
      {/* 搜索框 */}
      <SearchBar events={events} onQueryChange={setSearchQuery} />

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* 分类筛选 */}
        <div className="flex gap-1 flex-wrap">
          {allCats.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm text-xs transition-all duration-200
                  ${isActive ? 'btn-primary' : 'btn-ghost'}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {allTags.map((tag) => {
              const isActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isActive ? null : tag)}
                  className={`badge badge-sm cursor-pointer transition-all duration-200
                    ${isActive
                      ? 'badge-primary'
                      : 'badge-ghost hover:badge-outline'
                    }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 统计 */}
      <p className="text-sm text-gray-400 dark:text-gray-500">
        {t.count(filteredEvents.length)}
        {selectedCategory !== catT.all && t.filterBy(selectedCategory)}
        {selectedTag && ` · #${selectedTag}`}
      </p>

      {/* 时间线 */}
      {yearGroups.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">{t.noEvents}</div>
      ) : (
        <div className="space-y-14">
          {yearGroups.map((group) => (
            <section key={group.year}>
              {/* 年份标题 */}
              <div className="sticky top-16 z-10 mb-6">
                <h2 className="text-6xl font-black text-gray-900 dark:text-gray-100/5 select-none -ml-2">
                  {group.year}
                </h2>
              </div>

              {/* 事件列表 */}
              <div className="space-y-4 relative pl-8 border-l-2 border-green-200 dark:border-green-800">
                {group.events.map((event) => (
                  <div key={event.slug} className="relative">
                    {/* 时间轴圆点 */}
                    <div className="absolute -left-[calc(0.5rem+5px)] top-6 w-3 h-3 rounded-full bg-green-600 dark:bg-green-500 ring-2 ring-base-100" />
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
