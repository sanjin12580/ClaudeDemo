// ============================================================
// 人生清单 — 数据加载
// ============================================================

import type { BucketListData, BucketListItem, BucketCategory } from './types';

const VALID_CATEGORIES: BucketCategory[] = ['旅行', '体验', '学习', '健康', '成就', '其他'];

/**
 * 加载人生清单数据（src/data/bucketlist.json）
 */
export async function loadBucketList(): Promise<BucketListData> {
  const { default: data } = await import('../data/bucketlist.json');
  const items: BucketListItem[] = (data.items || []).map((b: any) => ({
    id: b.id ?? '',
    title: b.title ?? '',
    description: b.description ?? '',
    category: VALID_CATEGORIES.includes(b.category) ? b.category : '其他',
    done: !!b.done,
    doneDate: b.doneDate ?? undefined,
    tags: b.tags ?? [],
  }));
  return { items };
}
