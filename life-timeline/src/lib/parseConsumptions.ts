// ============================================================
// 读书观影清单 — 数据加载
// ============================================================

/** 媒介类型 */
export type ConsumptionType =
  | 'book'
  | 'novel'
  | 'movie'
  | 'tv'
  | 'anime'
  | 'variety'
  | 'music';

export interface ConsumptionItem {
  id: string;
  title: string;
  type: ConsumptionType;
  status: 'done' | 'doing';
  rating: number; // 1-5
  review: string;
  date: string; // YYYY-MM or YYYY-MM-DD
  cover: string;
  tags: string[];
  /** 发行/出版年份 */
  year?: number;
  /** 发行/上映日期（YYYY-MM-DD 或 YYYY-MM） */
  releaseDate?: string;
  /** 作者 / 导演 */
  author?: string;
  /** 来源 ID（TMDB id 或豆瓣 subject id） */
  sourceId?: string;
  /** 元数据来源 */
  source?: 'tmdb' | 'douban' | 'weread' | 'itunes' | 'local' | 'manual';
  /** 来源详情链接 */
  sourceUrl?: string;
}

export interface ConsumptionData {
  items: ConsumptionItem[];
}

/** 元数据自动获取的候选结果 */
export interface MetadataCandidate {
  title: string;
  year?: number;
  /** 发行/上映日期 */
  releaseDate?: string;
  author?: string;
  cover: string;
  /** 建议类型（点击候选时可自动切换表单类型） */
  suggestedType?: ConsumptionType;
  source: 'tmdb' | 'douban' | 'weread' | 'itunes' | 'local' | 'manual';
  sourceId: string;
  sourceUrl?: string;
  desc?: string;
}

/** 媒介类型配置 */
export const CONSUMPTION_TYPES = [
  { key: 'book', label: '📖 书籍', emoji: '📖' },
  { key: 'novel', label: '📕 小说', emoji: '📕' },
  { key: 'movie', label: '🎬 电影', emoji: '🎬' },
  { key: 'tv', label: '📺 电视剧', emoji: '📺' },
  { key: 'anime', label: '🎨 动漫', emoji: '🎨' },
  { key: 'variety', label: '🎤 综艺', emoji: '🎤' },
  { key: 'music', label: '🎵 音乐', emoji: '🎵' },
] as const;

export const CONSUMPTION_STATUSES = [
  { key: 'done', label: '✅ 已看', color: 'badge-success' },
  { key: 'doing', label: '📖 在看', color: 'badge-info' },
] as const;

/** 渲染星级 */
export function renderStars(rating: number): string {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
}

/**
 * 加载消费清单数据（服务端）
 * 使用 fs.readFileSync 直接读取 JSON，与 parseMedia 模式一致
 */
export async function loadConsumptions(): Promise<ConsumptionData> {
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const filePath = path.join(process.cwd(), 'src/data/consumptions.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as ConsumptionData;
  } catch {
    return { items: [] };
  }
}
