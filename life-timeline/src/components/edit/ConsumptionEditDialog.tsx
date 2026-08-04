// ============================================================
// ConsumptionEditDialog — 公共页清单编辑抽屉（仅 dev）
// 复用 admin 的 ConsumptionEditor，开启元数据自动搜索与一键填充
// ============================================================

import { useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '../../lib/i18n';
import ConsumptionEditor from '../admin/ConsumptionEditor';
import ConfirmDialog from '../admin/ConfirmDialog';
import EditDrawer from './EditDrawer';
import { emptyConsumptionForm, type ConsumptionFormShape } from '../admin/shapes';
import { saveConsumptions } from '../../lib/editActions';
import type { ConsumptionItem, MetadataCandidate } from '../../lib/parseConsumptions';

interface Props {
  items: ConsumptionItem[];
  itemId: string | null;
  open: boolean;
  onClose: () => void;
}

function itemToForm(c: ConsumptionItem): ConsumptionFormShape {
  return {
    id: c.id,
    title: c.title,
    type: c.type,
    status: c.status,
    rating: c.rating,
    review: c.review,
    date: c.date,
    cover: c.cover || '',
    tags: c.tags.join(', '),
    year: c.year ? String(c.year) : '',
    releaseDate: c.releaseDate ?? '',
    author: c.author ?? '',
    source: c.source,
    sourceId: c.sourceId ?? '',
    sourceUrl: c.sourceUrl ?? '',
  };
}

export default function ConsumptionEditDialog({ items, itemId, open, onClose }: Props) {
  const { admin: t, editMode: em } = useI18n();
  const item = itemId ? items.find((i) => i.id === itemId) ?? null : null;
  const [form, setForm] = useState<ConsumptionFormShape>(() =>
    item ? itemToForm(item) : emptyConsumptionForm()
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [metadataCandidates, setMetadataCandidates] = useState<MetadataCandidate[]>([]);
  const [metadataHint, setMetadataHint] = useState('');
  const [fetchingMeta, setFetchingMeta] = useState(false);

  function onField<K extends keyof ConsumptionFormShape>(field: K, value: ConsumptionFormShape[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFetchMetadata() {
    const title = form.title.trim();
    if (!title) {
      toast.error(t.metadataTitleRequired);
      return;
    }
    setFetchingMeta(true);
    setMetadataCandidates([]);
    setMetadataHint('');
    try {
      const url =
        `/api/fetch-metadata?type=all&title=${encodeURIComponent(title)}` +
        (form.author.trim()
          ? `&author=${encodeURIComponent(form.author.trim())}`
          : '') +
        (form.year.trim()
          ? `&year=${encodeURIComponent(form.year.trim())}`
          : '');
      const resp = await fetch(url);
      const json = await resp.json();
      if (!resp.ok || !json.success) {
        setMetadataHint(json.error || t.consumptionFetchFailed);
      } else {
        setMetadataCandidates(json.candidates ?? []);
        setMetadataHint(json.hint ?? '');
      }
    } catch {
      setMetadataHint(t.consumptionFetchFailed);
    } finally {
      setFetchingMeta(false);
    }
  }

  async function applyCandidate(c: MetadataCandidate) {
    // 立即填充（不覆盖已手动填写字段），封面先取远程/本地原路径
    setForm((prev) => ({
      ...prev,
      title: prev.title.trim() ? prev.title : c.title,
      type: c.suggestedType ?? prev.type,
      year: prev.year.trim() ? prev.year : c.year ? String(c.year) : prev.year,
      releaseDate: prev.releaseDate || c.releaseDate || '',
      author: prev.author.trim() ? prev.author : c.author ?? prev.author,
      cover: c.cover,
      source: c.source,
      sourceId: c.sourceId,
      sourceUrl: c.sourceUrl ?? '',
    }));
    setMetadataCandidates([]);
    setMetadataHint('');

    // 仅对远程 http(s) 封面后台下载本地化，本地 /covers/ 直接使用
    if (!/^https?:\/\//.test(c.cover || '')) return;
    setFetchingMeta(true);
    try {
      const resp = await fetch('/api/save-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: c.cover }),
      });
      const json = await resp.json();
      if (resp.ok && json.success && json.url) {
        setForm((prev) => ({ ...prev, cover: json.url }));
      }
    } catch {
      // 下载失败保留远程 URL
    } finally {
      setFetchingMeta(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t.consumptionTitleRequired);
      return;
    }
    const newItem: ConsumptionItem = {
      id: form.id || `c-${Date.now()}`,
      title: form.title.trim(),
      type: form.type,
      status: form.status,
      rating: form.rating,
      review: form.review,
      date: form.date,
      cover: form.cover.trim(),
      ...(form.year ? { year: Number(form.year) } : {}),
      ...(form.releaseDate.trim()
        ? { releaseDate: form.releaseDate.trim() }
        : {}),
      ...(form.author ? { author: form.author.trim() } : {}),
      ...(form.source ? { source: form.source } : {}),
      ...(form.sourceId ? { sourceId: form.sourceId.trim() } : {}),
      ...(form.sourceUrl ? { sourceUrl: form.sourceUrl.trim() } : {}),
      tags: form.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
    };
    const updated = form.id
      ? items.map((c) => (c.id === form.id ? newItem : c))
      : [newItem, ...items];
    const res = await saveConsumptions(updated);
    if (res.ok) {
      toast.success(t.consumptionSaved(res.path ?? ''));
      window.location.reload();
    } else {
      toast.error(res.error || t.saveFailed);
    }
  }

  async function doDelete() {
    if (!form.id) return;
    const res = await saveConsumptions(items.filter((c) => c.id !== form.id));
    setConfirmDelete(false);
    if (res.ok) {
      toast.success(t.deleted);
      window.location.reload();
    } else {
      toast.error(res.error || t.deleteFailed);
    }
  }

  return (
    <EditDrawer
      open={open}
      onClose={onClose}
      title={item ? em.consumptionEditTitle : em.consumptionNewTitle}
    >
      {(container) => (
        <>
          <ConsumptionEditor
            form={form}
            metadataCandidates={metadataCandidates}
            metadataHint={metadataHint}
            fetchingMeta={fetchingMeta}
            t={t}
            onField={onField}
            onSubmit={handleSubmit}
            onDelete={() => setConfirmDelete(true)}
            onFetchMetadata={handleFetchMetadata}
            onApplyCandidate={applyCandidate}
            container={container}
            showMetaFetch
            autoSearch
          />
          <ConfirmDialog
            open={confirmDelete}
            title={t.deleteTitle}
            message={t.deleteConfirm.replace('{title}', item?.title ?? '')}
            confirmText={t.deleteBtn}
            danger
            cancelText={t.cancelBtn}
            container={container}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={doDelete}
          />
        </>
      )}
    </EditDrawer>
  );
}
