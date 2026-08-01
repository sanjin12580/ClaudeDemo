// ============================================================
// 人生统计 — 聚合全部数据，输出总览指标与按年摘要
// 仅服务端使用（构建时静态生成），不依赖外部 API
// ============================================================

import { loadEvents } from './parseEvents';
import { loadPosts } from './parsePosts';
import { loadConsumptions } from './parseConsumptions';
import { loadGoals } from './parseGoals';
import { loadBucketList } from './parseBucketList';
import { loadMedia } from './parseMedia';
import { loadProfile } from './parseProfile';
import { provinceFromLocation } from './regions';
import { siteConfig } from '../site.config';
import type { ConsumptionItem } from './parseConsumptions';

/** 预期寿命（与 LifeCounter 保持一致） */
export const EXPECTED_YEARS = 80;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CategoryCount {
  name: string;
  value: number;
}

export interface TagCount {
  name: string;
  count: number;
}

export interface YearCity {
  name: string;
  province: string | null;
}

export interface YearGoal {
  title: string;
  progress: number;
  status: string;
  category: string;
}

export interface YearConsumption {
  title: string;
  date: string;
  rating: number;
  type: string;
  cover: string;
}

/** 某一年份的浓缩摘要 */
export interface YearSummary {
  year: number;
  eventCount: number;
  importantCount: number;
  categoryCounts: CategoryCount[];
  topTags: TagCount[];
  postCount: number;
  posts: { slug: string; title: string; date: string }[];
  doneCount: number;
  consumptions: YearConsumption[];
  cityCount: number;
  cities: YearCity[];
  goalCount: number;
  goals: YearGoal[];
}

/** 全站总览指标 */
export interface LifeStats {
  birthDate: string;
  ageYears: number;
  ageDays: number;
  ageWeeks: number;
  expectedYears: number;
  oneOverE: number;
  passedOneOverE: boolean;
  currentYear: number;
  // 事件
  eventCount: number;
  eventYearStart: number | null;
  eventYearEnd: number | null;
  importantEventCount: number;
  locationCount: number;
  categoryCounts: CategoryCount[];
  topTags: TagCount[];
  // 旅行
  cityCount: number;
  provinceCount: number;
  provinces: string[];
  // 内容
  postCount: number;
  mediaCount: number;
  consumptionCounts: { done: number; doing: number };
  bucketListCounts: { done: number; total: number };
  // 目标
  goalCount: number;
  goalCompleted: number;
  goalDoneRate: number;
  goalAvgProgress: number;
  // 年度
  yearly: YearSummary[];
}

function toYear(dateStr: string): number {
  return parseInt(dateStr.slice(0, 4), 10);
}

function daysBetween(from: Date, to: Date): number {
  if (isNaN(from.getTime())) return 0;
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / DAY_MS));
}

function topTagsFrom(tagMap: Map<string, number>, limit = 5): TagCount[] {
  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * 聚合全站数据，返回总览指标与按年摘要
 */
export async function loadLifeStats(): Promise<LifeStats> {
  const [events, posts, consumptionData, goalData, bucketData, media, profile] = await Promise.all([
    loadEvents(),
    loadPosts(),
    loadConsumptions(),
    loadGoals(),
    loadBucketList(),
    loadMedia(),
    loadProfile(),
  ]);
  const consumptions = consumptionData.items;
  const goals = [...goalData.short, ...goalData.long];
  const bucketListCounts = {
    done: bucketData.items.filter((b) => b.done).length,
    total: bucketData.items.length,
  };

  // ---------- 生命 ----------
  const birthDate = profile?.birthDate ?? siteConfig.birthDate;
  const now = new Date();
  const birth = new Date(`${birthDate}T00:00:00`);
  const ageDays = daysBetween(birth, now);
  const ageYears = Math.round((ageDays / 365.2425) * 10) / 10;
  const ageWeeks = Math.floor(ageDays / 7);
  const oneOverE = Math.round((EXPECTED_YEARS / Math.E) * 10) / 10;
  const passedOneOverE = ageYears >= oneOverE;

  // ---------- 事件 ----------
  const locations = new Set<string>();
  const cities = new Set<string>();
  const provinces = new Set<string>();
  for (const event of events) {
    if (!event.location) continue;
    locations.add(event.location);
    cities.add(event.location);
    const province = provinceFromLocation(event.location);
    if (province) provinces.add(province);
  }

  const catMap = new Map<string, number>();
  const tagMap = new Map<string, number>();
  let eventYearStart: number | null = null;
  let eventYearEnd: number | null = null;
  for (const event of events) {
    const year = toYear(event.date);
    if (eventYearStart === null || year < eventYearStart) eventYearStart = year;
    if (eventYearEnd === null || year > eventYearEnd) eventYearEnd = year;
    catMap.set(event.category, (catMap.get(event.category) ?? 0) + 1);
    for (const tag of event.tags) tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
  }
  const categoryCounts: CategoryCount[] = Array.from(catMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // ---------- 内容 ----------
  const consumptionCounts = { done: 0, doing: 0 } as Record<ConsumptionItem['status'], number>;
  for (const item of consumptions) consumptionCounts[item.status] += 1;

  // ---------- 目标 ----------
  const goalCompleted = goals.filter((g) => g.status === 'completed').length;
  const goalDoneRate = goals.length ? Math.round((goalCompleted / goals.length) * 100) : 0;
  const goalAvgProgress = goals.length
    ? Math.round((goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) * 10) / 10
    : 0;

  // ---------- 按年摘要 ----------
  const yearMap = new Map<number, YearSummary>();
  const yearTags = new Map<number, Map<string, number>>();
  const yearCats = new Map<number, Map<string, number>>();

  const ensureYear = (year: number): YearSummary => {
    let summary = yearMap.get(year);
    if (!summary) {
      summary = {
        year,
        eventCount: 0,
        importantCount: 0,
        categoryCounts: [],
        topTags: [],
        postCount: 0,
        posts: [],
        doneCount: 0,
        consumptions: [],
        cityCount: 0,
        cities: [],
        goalCount: 0,
        goals: [],
      };
      yearMap.set(year, summary);
    }
    return summary;
  };

  for (const event of events) {
    const year = toYear(event.date);
    const summary = ensureYear(year);
    summary.eventCount += 1;
    if (event.importance >= 4) summary.importantCount += 1;

    const catForYear = yearCats.get(year) ?? new Map<string, number>();
    catForYear.set(event.category, (catForYear.get(event.category) ?? 0) + 1);
    yearCats.set(year, catForYear);

    const tagsForYear = yearTags.get(year) ?? new Map<string, number>();
    for (const tag of event.tags) tagsForYear.set(tag, (tagsForYear.get(tag) ?? 0) + 1);
    yearTags.set(year, tagsForYear);

    if (event.location && !summary.cities.some((c) => c.name === event.location)) {
      summary.cities.push({
        name: event.location,
        province: provinceFromLocation(event.location),
      });
    }
  }

  for (const post of posts) {
    const summary = ensureYear(toYear(post.date));
    summary.postCount += 1;
    summary.posts.push({ slug: post.slug, title: post.title, date: post.date });
  }

  for (const item of consumptions) {
    if (item.status !== 'done') continue;
    if (!item.date) continue;
    const year = toYear(item.date);
    const summary = ensureYear(year);
    summary.doneCount += 1;
    summary.consumptions.push({
      title: item.title,
      date: item.date,
      rating: item.rating,
      type: item.type,
      cover: item.cover,
    });
  }

  for (const goal of goals) {
    if (!goal.createdAt) continue;
    const summary = ensureYear(toYear(goal.createdAt));
    summary.goalCount += 1;
    summary.goals.push({
      title: goal.title,
      progress: goal.progress,
      status: goal.status,
      category: goal.category,
    });
  }

  const yearly: YearSummary[] = Array.from(yearMap.values())
    .map((summary) => {
      const cats = yearCats.get(summary.year) ?? new Map<string, number>();
      const tags = yearTags.get(summary.year) ?? new Map<string, number>();
      return {
        ...summary,
        categoryCounts: Array.from(cats.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
        topTags: topTagsFrom(tags),
        cityCount: summary.cities.length,
        consumptions: summary.consumptions.sort((a, b) => b.date.localeCompare(a.date)),
      };
    })
    .sort((a, b) => b.year - a.year);

  return {
    birthDate,
    ageYears,
    ageDays,
    ageWeeks,
    expectedYears: EXPECTED_YEARS,
    oneOverE,
    passedOneOverE,
    currentYear: now.getFullYear(),
    eventCount: events.length,
    eventYearStart,
    eventYearEnd,
    importantEventCount: events.filter((e) => e.importance >= 4).length,
    locationCount: locations.size,
    categoryCounts,
    topTags: topTagsFrom(tagMap),
    cityCount: cities.size,
    provinceCount: provinces.size,
    provinces: Array.from(provinces).sort(),
    postCount: posts.length,
    mediaCount: media.length,
    consumptionCounts,
    bucketListCounts,
    goalCount: goals.length,
    goalCompleted,
    goalDoneRate,
    goalAvgProgress,
    yearly,
  };
}
