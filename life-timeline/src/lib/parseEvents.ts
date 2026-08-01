import type { EventMeta, CellData, GridData, YearGroup } from './types';
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

/**
 * 获取指定周的事件（ISO 周数）
 * 返回该周的事件列表和总强度
 */
function getWeekEvents(
  events: EventMeta[],
  year: number,
  weekNum: number
): { events: EventMeta[]; intensity: number } {
  const weekEvents = events.filter((event) => {
    const d = parseDate(event.date);
    if (!d || d.getFullYear() !== year) return false;
    return getISOWeek(d) === weekNum;
  });

  // 强度 = 事件数量 × 平均重要性，映射到 0-4
  const totalImportance = weekEvents.reduce((sum, e) => sum + e.importance, 0);
  const intensity = weekEvents.length === 0 ? 0 : Math.min(4, Math.ceil(totalImportance / weekEvents.length));

  return { events: weekEvents, intensity };
}

/**
 * 构建贡献图数据
 * @param events 所有事件
 * @param startYear 出生年份
 * @param endYear 截止年份（默认当前年）
 */
export function buildGridData(
  events: EventMeta[],
  startYear: number,
  endYear?: number
): GridData {
  const end = endYear ?? new Date().getFullYear();
  const cells: CellData[] = [];

  for (let year = startYear; year <= end; year++) {
    for (let week = 1; week <= 52; week++) {
      const { events: weekEvents, intensity } = getWeekEvents(events, year, week);
      if (intensity > 0 || weekEvents.length > 0) {
        cells.push({ year, week, intensity, events: weekEvents });
      }
    }
  }

  return { startYear, endYear: end, cells };
}

/**
 * 解析日期字符串，返回 Date 对象（缺失部分补为 1 月 1 日）
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
  const day = parts[2] ? parseInt(parts[2], 10) : 1;
  return new Date(year, month, day);
}

/**
 * 获取日期的 ISO 周数
 */
function getISOWeek(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}
