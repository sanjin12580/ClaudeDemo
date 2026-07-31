// ============================================================
// 读书观影清单 — 数据加载
// ============================================================

export interface ConsumptionItem {
  id: string;
  title: string;
  type: 'book' | 'novel' | 'movie' | 'tv' | 'anime' | 'variety' | 'music';
  status: 'done' | 'doing' | 'want';
  rating: number; // 1-5
  review: string;
  date: string; // YYYY-MM or YYYY-MM-DD
  cover: string;
  tags: string[];
}

export interface ConsumptionData {
  items: ConsumptionItem[];
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
  { key: 'want', label: '⭐ 想看', color: 'badge-warning' },
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
