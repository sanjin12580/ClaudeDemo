// ============================================================
// EventPostEditDialog — 公共页事件 / 文章编辑抽屉（仅 dev）
// 直接复用 admin 的 EventPostEditor
// ============================================================

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useI18n } from '../../lib/i18n';
import EventPostEditor from '../admin/EventPostEditor';
import ConfirmDialog from '../admin/ConfirmDialog';
import EditDrawer from './EditDrawer';
import { EMPTY_EVENT_POST_FORM, type EventPostForm } from '../admin/shapes';
import { saveEventPost, deleteEventPost } from '../../lib/editActions';
import type { EventMeta, PostMeta } from '../../lib/types';

interface Props {
  mode: 'events' | 'posts';
  item: EventMeta | PostMeta | null;
  open: boolean;
  onClose: () => void;
}

function itemToForm(mode: 'events' | 'posts', item: EventMeta | PostMeta | null): EventPostForm {
  if (!item) return EMPTY_EVENT_POST_FORM;
  if (mode === 'events') {
    const ev = item as EventMeta;
    return {
      date: ev.date,
      title: ev.title,
      category: ev.category,
      tags: ev.tags.join(', '),
      importance: ev.importance,
      location: ev.location || '',
      content: ev.body.trim(),
      draft: ev.draft,
    };
  }
  const p = item as PostMeta;
  return {
    date: p.date,
    title: p.title,
    category: '其他',
    tags: p.tags.join(', '),
    importance: 3,
    location: '',
    content: p.body.trim(),
    draft: p.draft,
  };
}

export default function EventPostEditDialog({ mode, item, open, onClose }: Props) {
  const { admin: t, editMode: em } = useI18n();
  const [form, setForm] = useState<EventPostForm>(() => itemToForm(mode, item));
  const [editTab, setEditTab] = useState<'edit' | 'preview'>('edit');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function update(field: keyof EventPostForm, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function insertContent(template: string) {
    const ta = textareaRef.current;
    const content = form.content;
    const start = ta?.selectionStart ?? content.length;
    const end = ta?.selectionEnd ?? content.length;
    const sel = content.slice(start, end);
    const snippet = template.split('{{sel}}').join(sel);
    const next = content.slice(0, start) + snippet + content.slice(end);
    setForm((prev) => ({ ...prev, content: next }));
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.date || !form.title) {
      setStatus('error');
      setMessage(t.validationError);
      return;
    }
    setStatus('saving');
    setMessage('');
    const res = await saveEventPost(mode, form);
    if (res.ok) {
      toast.success(t.saved(res.path ?? ''));
      window.location.reload();
    } else {
      setStatus('idle');
      toast.error(res.error || t.saveFailed);
    }
  }

  async function doDelete() {
    if (!item) return;
    const res = await deleteEventPost(mode, item.slug, item.date);
    setConfirmDelete(false);
    if (res.ok) {
      toast.success(t.deleted);
      window.location.reload();
    } else {
      toast.error(res.error || t.deleteFailed);
    }
  }

  const title = item
    ? mode === 'events'
      ? em.eventEditTitle
      : em.postEditTitle
    : mode === 'events'
      ? em.eventNewTitle
      : em.postNewTitle;

  return (
    <EditDrawer open={open} onClose={onClose} title={title}>
      {(container) => (
        <>
          <EventPostEditor
            mode={mode}
            form={form}
            editTab={editTab}
            status={status}
            message={message}
            selectedSlug={item?.slug ?? null}
            textareaRef={textareaRef}
            t={t}
            onUpdate={update}
            onTabChange={setEditTab}
            onSubmit={handleSubmit}
            onDelete={() => setConfirmDelete(true)}
            onInsert={insertContent}
            onPickImage={() => toast.info(em.mediaAdminOnly)}
            onUploadImage={() => toast.info(em.mediaAdminOnly)}
            onDirty={() => {}}
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
