// ============================================================
// 纪念日 — 生日 + 重要事件（importance≥4）+ 手工条目
// 按 MM-DD 去重（手工 > 生日 > 事件），计算下次发生日与剩余天数
// ============================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEvents } from './parseEvents';
import { loadProfile } from './parseProfile';

export type AnniversarySource = 'manual' | 'birth' | 'event';

export interface ManualAnniversary {
  id: string;
  name: string;
  /** "MM-DD" 每年重复，或 "YYYY-MM-DD" 一次性日期 */
  date: string;
  emoji?: string;
  note?: string;
  /** 为 true 时只纪念一次（date 需为完整日期），否则每年重复 */
  once?: boolean;
}

export interface Anniversary {
  id: string;
  name: string;
  /** MM-DD */
  date: string;
  emoji: string;
  note?: string;
  source: AnniversarySource;
  eventSlug?: string;
  /** 原始年份（生日/事件/一次性手工条目才有） */
  originYear?: number;
}

export interface AnniversaryUpcoming extends Anniversary {
  /** 下一次发生的完整日期 YYYY-MM-DD */
  nextDate: string;
  /** 距离下次的天数（0 = 今天） */
  daysLeft: number;
}

const MANUAL_PATH = join(process.cwd(), 'src/data/anniversaries.json');

function loadManualAnniversaries(): ManualAnniversary[] {
  try {
    const raw = readFileSync(MANUAL_PATH, 'utf-8');
    const data = JSON.parse(raw) as { items: ManualAnniversary[] };
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

/** 归一化为 MM-DD，非法日期返回 null */
function toMonthDay(dateStr: string): string | null {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}-${m[3]}`;
  const d = dateStr.match(/^(\d{2})-(\d{2})$/);
  return d ? `${d[1]}-${d[2]}` : null;
}

/** 解析日期得到下一次发生的日期与剩余天数 */
function nextOccurrence(monthDay: string, now: Date): { nextDate: string; daysLeft: number } {
  const year = now.getFullYear();
  const [m, d] = monthDay.split('-').map((n) => parseInt(n, 10));
  let candidate = new Date(year, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (candidate.getTime() < today.getTime()) {
    candidate = new Date(year + 1, m - 1, d);
  }
  const daysLeft = Math.round((candidate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    nextDate: `${candidate.getFullYear()}-${pad(candidate.getMonth() + 1)}-${pad(candidate.getDate())}`,
    daysLeft: Math.max(0, daysLeft),
  };
}

/**
 * 合并三类纪念日并按 MM-DD 去重，返回按剩余天数升序的列表
 * @param now 构建时间（默认当前时间）
 */
export async function loadAnniversaries(now = new Date()): Promise<AnniversaryUpcoming[]> {
  const [profile, events] = await Promise.all([loadProfile(), loadEvents()]);
  const collected: Anniversary[] = [];

  // 1. 手工条目（优先级最高）
  for (const item of loadManualAnniversaries()) {
    const md = toMonthDay(item.date);
    if (!md) continue;
    const originYear = item.date.length === 10 ? parseInt(item.date.slice(0, 4), 10) : undefined;
    // 一次性且已过去的日期不再展示
    if (item.once && originYear && originYear < now.getFullYear()) continue;
    if (item.once && originYear === now.getFullYear()) {
      const pass = new Date(`${item.date}T00:00:00`);
      if (pass.getTime() < now.getTime()) continue;
    }
    collected.push({
      id: item.id,
      name: item.name,
      date: md,
      emoji: item.emoji ?? '🎉',
      note: item.note,
      source: 'manual',
      originYear,
    });
  }

  // 2. 生日（取自个人档案）
  if (profile?.birthDate) {
    const md = toMonthDay(profile.birthDate);
    if (md) {
      collected.push({
        id: 'birthday',
        name: '生日',
        date: md,
        emoji: '🎂',
        source: 'birth',
        originYear: parseInt(profile.birthDate.slice(0, 4), 10),
      });
    }
  }

  // 3. 重要事件（importance ≥ 4，每年重复）
  for (const event of events) {
    if (event.importance < 4) continue;
    const md = toMonthDay(event.date);
    if (!md) continue;
    collected.push({
      id: `event-${event.slug}`,
      name: event.title,
      date: md,
      emoji: '🎉',
      source: 'event',
      eventSlug: event.slug,
      originYear: parseInt(event.date.slice(0, 4), 10),
    });
  }

  // 按 MM-DD 去重：手工 > 生日 > 事件（同来源保留重要性更高/先出现的）
  const seen = new Map<string, Anniversary>();
  const priority: Record<AnniversarySource, number> = { manual: 0, birth: 1, event: 2 };
  for (const item of collected) {
    const existing = seen.get(item.date);
    if (!existing || priority[item.source] < priority[existing.source]) {
      seen.set(item.date, item);
    }
  }

  return Array.from(seen.values())
    .map((item) => ({ ...item, ...nextOccurrence(item.date, now) }))
    .sort((a, b) => a.daysLeft - b.daysLeft || a.date.localeCompare(b.date));
}
