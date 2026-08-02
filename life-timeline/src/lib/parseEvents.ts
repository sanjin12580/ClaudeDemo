import type { EventMeta, YearGroup } from './types';
import { getCollection } from 'astro:content';

/**
 * 从 Astro Content Collection 加载事件
 * @param includeDrafts 是否包含草稿（默认 false）
 */
export async function loadEvents(includeDrafts = false): Promise<EventMeta[]> {
  const entries = await getCollection('events', ({ data }) => includeDrafts || !data.draft);

  return entries
    .map((entry) => ({
      slug: entry.id.replace(/\.(md|mdx)$/, ''),
      date: entry.data.date,
      title: entry.data.title,
      category: entry.data.category,
      tags: entry.data.tags ?? [],
      importance: entry.data.importance ?? 3,
      location: entry.data.location,
      images: entry.data.images ?? [],
      draft: entry.data.draft ?? false,
      body: entry.body ?? '',
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 按年份分组事件
 */
export function groupByYear(events: EventMeta[]): YearGroup[] {
  const map = new Map<number, EventMeta[]>();
  for (const event of events) {
    const year = parseInt(event.date.slice(0, 4), 10);
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(event);
  }
  return Array.from(map.entries())
    .map(([year, events]) => ({ year, events }))
    .sort((a, b) => a.year - b.year);
}
