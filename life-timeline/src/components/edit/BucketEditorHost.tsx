// ============================================================
// BucketEditorHost — 愿望清单编辑宿主（仅 dev）
// 监听服务端卡片派发的 bucket-edit / bucket-new 事件，
// 维护唯一编辑抽屉与 Toaster
// ============================================================

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '../../lib/i18n';
import EditDrawer from './EditDrawer';
import BucketItemEditor from './BucketItemEditor';
import ConfirmDialog from '../admin/ConfirmDialog';
import { Toaster } from '../ui/toaster';
import { EMPTY_BUCKET_FORM, type BucketFormShape } from '../admin/shapes';
import { saveBucketList } from '../../lib/editActions';
import type { BucketListItem, BucketCategory } from '../../lib/types';

const CATEGORIES: BucketCategory[] = ['旅行', '体验', '学习', '健康', '成就', '其他'];

interface Props {
  items: BucketListItem[];
}

function itemToForm(item: BucketListItem): BucketFormShape {
  return {
    title: item.title,
    description: item.description ?? '',
    category: item.category,
    done: item.done,
    doneDate: item.doneDate ?? '',
    tags: item.tags.join(', '),
  };
}

export default function BucketEditorHost({ items }: Props) {
  const { editMode: t, bucketList: bt, admin } = useI18n();
  const [editing, setEditing] = useState<BucketListItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<BucketFormShape>(EMPTY_BUCKET_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const openEdit = (id: string | null) => {
      if (!id) return;
      const item = items.find((i) => i.id === id);
      if (!item) return;
      setEditing(item);
      setIsNew(false);
      setForm(itemToForm(item));
    };
    const openNew = () => {
      setEditing(null);
      setIsNew(true);
      setForm(EMPTY_BUCKET_FORM);
    };

    const onEditClick = (e: Event) => {
      e.preventDefault();
      openEdit((e.currentTarget as HTMLElement).getAttribute('data-bucket-edit'));
    };
    const onNewClick = (e: Event) => {
      e.preventDefault();
      openNew();
    };

    const editBtns = document.querySelectorAll<HTMLElement>('[data-bucket-edit]');
    const newBtns = document.querySelectorAll<HTMLElement>('[data-bucket-new]');
    editBtns.forEach((btn) => btn.addEventListener('click', onEditClick));
    newBtns.forEach((btn) => btn.addEventListener('click', onNewClick));

    return () => {
      editBtns.forEach((btn) => btn.removeEventListener('click', onEditClick));
      newBtns.forEach((btn) => btn.removeEventListener('click', onNewClick));
    };
  }, [items]);

  function close() {
    setEditing(null);
    setIsNew(false);
    setConfirmDelete(false);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(admin.validationError);
      return;
    }
    setSaving(true);
    const item: BucketListItem = {
      id: editing?.id ?? `b-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: CATEGORIES.includes(form.category as BucketCategory)
        ? (form.category as BucketCategory)
        : '其他',
      done: form.done,
      tags: form.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      ...(form.done && form.doneDate ? { doneDate: form.doneDate } : {}),
    };
    const updated = editing
      ? items.map((i) => (i.id === editing.id ? item : i))
      : [item, ...items];
    const res = await saveBucketList(updated);
    setSaving(false);
    if (res.ok) {
      toast.success(admin.saved(res.path ?? ''));
      window.location.reload();
    } else {
      toast.error(res.error || admin.saveFailed);
    }
  }

  async function doDelete() {
    if (!editing) return;
    const res = await saveBucketList(items.filter((i) => i.id !== editing.id));
    setConfirmDelete(false);
    if (res.ok) {
      toast.success(admin.deleted);
      window.location.reload();
    } else {
      toast.error(res.error || admin.deleteFailed);
    }
  }

  return (
    <>
      {(editing || isNew) && (
        <EditDrawer
          open
          onClose={close}
          title={isNew ? t.bucketNewTitle : t.bucketEditTitle}
        >
          {(container) => (
            <>
              <BucketItemEditor
                form={form}
                onField={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
                container={container}
                t={t}
                categoryLabels={bt.categories}
                saveLabel={admin.saveBtn}
                saving={saving}
                onSubmit={handleSave}
              />
              <ConfirmDialog
                open={confirmDelete}
                title={admin.deleteTitle}
                message={admin.deleteConfirm.replace('{title}', editing?.title ?? '')}
                confirmText={admin.deleteBtn}
                danger
                cancelText={admin.cancelBtn}
                container={container}
                onCancel={() => setConfirmDelete(false)}
                onConfirm={doDelete}
              />
            </>
          )}
        </EditDrawer>
      )}
      <Toaster />
    </>
  );
}
