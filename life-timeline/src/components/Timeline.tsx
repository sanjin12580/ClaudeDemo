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
        <div className="flex gap-1.5 flex-wrap">
          {allCats.map((cat) => (
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

      <p className="text-sm text-gray-400">
        {t.count(filteredEvents.length)}
        {selectedCategory !== catT.all && t.filterBy(selectedCategory)}
        {selectedTag && ` · #${selectedTag}`}
      </p>

      {yearGroups.length === 0 ? (
        <div className="text-center py-16 text-gray-400">{t.noEvents}</div>
      ) : (
        <div className="space-y-12">
          {yearGroups.map((group) => (
            <section key={group.year}>
              <div className="sticky top-4 z-10 mb-6">
                <h2 className="text-5xl font-bold text-gray-200 dark:text-gray-800 select-none">
                  {group.year}
                </h2>
              </div>

              <div className="space-y-4 relative pl-8 border-l-2 border-gray-200 dark:border-gray-800">
                {group.events.map((event) => (
                  <div key={event.slug} className="relative">
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
