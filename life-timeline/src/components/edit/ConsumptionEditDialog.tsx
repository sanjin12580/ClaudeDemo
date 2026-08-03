// ============================================================
// ConsumptionEditDialog — 公共页清单编辑抽屉（仅 dev）
// 复用 admin 的 ConsumptionEditor（关闭元数据拉取）
// ============================================================

import { useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '../../lib/i18n';
import ConsumptionEditor from '../admin/ConsumptionEditor';
import ConfirmDialog from '../admin/ConfirmDialog';
import EditDrawer from './EditDrawer';
import { emptyConsumptionForm, type ConsumptionFormShape } from '../admin/shapes';
import { saveConsumptions } from '../../lib/editActions';
import type { ConsumptionItem } from '../../lib/parseConsumptions';

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

  function onField<K extends keyof ConsumptionFormShape>(field: K, value: ConsumptionFormShape[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
            metadataCandidates={[]}
            metadataHint=""
            fetchingMeta={false}
            t={t}
            onField={onField}
            onSubmit={handleSubmit}
            onDelete={() => setConfirmDelete(true)}
            onFetchMetadata={() => toast.info(em.mediaAdminOnly)}
            onApplyCandidate={() => {}}
            container={container}
            showMetaFetch={false}
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
