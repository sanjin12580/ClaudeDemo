// ============================================================
// editActions — 公共页原地编辑（仅 dev）的共享 API 调用
// 复用管理后台的 dev-only 写接口，返回统一结果
// ============================================================

import type { EventPostForm } from '../components/admin/shapes';
import type { ConsumptionItem } from './parseConsumptions';
import type { BucketListItem } from './types';

export interface EditApiResult {
  ok: boolean;
  path?: string;
  error?: string;
}

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: any }> {
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json().catch(() => ({}));
    return { ok: resp.ok && data.success, data };
  } catch {
    return { ok: false, data: {} };
  }
}

function splitTags(v: string): string[] {
  return v.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
}

/** 保存事件 / 文章（新建与编辑同一接口） */
export async function saveEventPost(
  mode: 'events' | 'posts',
  form: EventPostForm
): Promise<EditApiResult> {
  const body =
    mode === 'events'
      ? {
          date: form.date,
          title: form.title,
          category: form.category,
          tags: splitTags(form.tags),
          importance: form.importance,
          location: form.location || undefined,
          content: form.content,
          draft: form.draft,
        }
      : {
          date: form.date,
          title: form.title,
          tags: splitTags(form.tags),
          content: form.content,
          draft: form.draft,
        };
  const { ok, data } = await postJson(
    mode === 'events' ? '/api/write-event' : '/api/write-post',
    body
  );
  return ok ? { ok: true, path: data.path } : { ok: false, error: data.error || '保存失败' };
}

/** 删除事件 / 文章 */
export async function deleteEventPost(
  mode: 'events' | 'posts',
  slug: string,
  date: string
): Promise<EditApiResult> {
  const filePath =
    mode === 'events'
      ? `src/content/events/${date.slice(0, 4)}/${slug}.md`
      : `src/content/blog/${slug}.md`;
  try {
    const resp = await fetch(mode === 'events' ? '/api/delete-event' : '/api/delete-post', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath }),
    });
    const data = await resp.json().catch(() => ({}));
    return resp.ok && data.success
      ? { ok: true }
      : { ok: false, error: data.error || '删除失败' };
  } catch {
    return { ok: false, error: '网络错误' };
  }
}

/** 保存清单（全量写回） */
export async function saveConsumptions(items: ConsumptionItem[]): Promise<EditApiResult> {
  const { ok, data } = await postJson('/api/write-consumptions', { items });
  return ok ? { ok: true, path: data.path } : { ok: false, error: data.error || '保存失败' };
}

/** 保存人生清单 / 愿望清单（全量写回） */
export async function saveBucketList(items: BucketListItem[]): Promise<EditApiResult> {
  const { ok, data } = await postJson('/api/write-bucket-list', { items });
  return ok ? { ok: true, path: data.path } : { ok: false, error: data.error || '保存失败' };
}
