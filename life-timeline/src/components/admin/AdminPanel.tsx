// ============================================================
// AdminPanel — 管理后台壳组件（v1.5.0 shadcn 重写版）
// 三栏布局：左图标导航 + 列表列 + 编辑工作区
// 数据与 API 契约与 v1.4.0 完全一致
// ============================================================

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type {
  EventMeta,
  PostMeta,
  Profile,
  Goal,
  MediaItem,
  RelationsData,
  RelationType,
} from '../../lib/types';
import { ALLOWED_EXTENSIONS, classifyFileType } from '../../lib/types';
import type { ConsumptionItem, MetadataCandidate } from '../../lib/parseConsumptions';
import { useI18n } from '../../lib/i18n';
import { getFileUrl } from '../../lib/filePreview';
import { cn } from '@/lib/utils';
import { Toaster } from '../ui/toaster';
import ModuleNav, { type AdminMode } from './ModuleNav';
import ConfirmDialog from './ConfirmDialog';
import MediaPicker from './MediaPicker';
import EventPostEditor from './EventPostEditor';
import GoalEditor from './GoalEditor';
import ConsumptionEditor from './ConsumptionEditor';
import MediaEditor from './MediaEditor';
import ProfileEditor from './ProfileEditor';
import RelationsEditor from './RelationsEditor';
import { EventPostList, GoalList, ConsumptionListPanel, MediaListPanel } from './Lists';
import {
  EMPTY_EVENT_POST_FORM,
  EMPTY_GOAL_FORM,
  EMPTY_MEDIA_FORM,
  emptyConsumptionForm,
  emptyPersonForm,
  type EventPostForm,
  type GoalFormShape,
  type MediaFormShape,
  type ProfileFormShape,
  type ConsumptionFormShape,
  type PersonFormShape,
  type StoryRow,
} from './shapes';

const ALL_EXTENSIONS = Object.values(ALLOWED_EXTENSIONS).flat();

interface Props {
  events: EventMeta[];
  posts: PostMeta[];
  profile: Profile | null;
  goals: Goal[];
  media: MediaItem[];
  consumptions: ConsumptionItem[];
  relations: RelationsData;
}

export default function AdminPanel({
  events: initialEvents,
  posts: initialPosts,
  profile: initialProfile,
  goals: initialGoals,
  media: initialMedia,
  consumptions: initialConsumptions,
  relations: initialRelations,
}: Props) {
  const { admin: t } = useI18n();

  // 管理端根节点（shadcn 弹窗/下拉挂载到此处以继承主题令牌）
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);

  // ========== 模块与数据 ==========
  const [mode, setMode] = useState<AdminMode>('events');
  const [events, setEvents] = useState<EventMeta[]>(initialEvents);
  const [posts, setPosts] = useState<PostMeta[]>(initialPosts);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [consumptions, setConsumptions] = useState<ConsumptionItem[]>(initialConsumptions);
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [relations, setRelations] = useState<RelationsData>(initialRelations);

  // 档案表单
  const [profileForm, setProfileForm] = useState<ProfileFormShape>({
    name: initialProfile?.name ?? '',
    tagline: initialProfile?.tagline ?? '',
    avatar: initialProfile?.avatar ?? '',
    birthDate: initialProfile?.birthDate ?? '',
    skills: initialProfile?.skills?.join(', ') ?? '',
    shortGoal: initialProfile?.shortGoal ?? '',
    longGoal: initialProfile?.longGoal ?? '',
  });
  // 档案 Tab 分段（个人资料 / 关系图谱）
  const [profileTab, setProfileTab] = useState<'profile' | 'relations'>(
    'profile',
  );
  // 关系图谱表单
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [personForm, setPersonForm] = useState<PersonFormShape>(
    emptyPersonForm(),
  );
  const [relationsDeleteOpen, setRelationsDeleteOpen] = useState(false);
  const [relationStatus, setRelationStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [relationMessage, setRelationMessage] = useState('');

  // 目标
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState<GoalFormShape>(EMPTY_GOAL_FORM);

  // 媒体
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [mediaForm, setMediaForm] = useState<MediaFormShape>(EMPTY_MEDIA_FORM);

  // 清单
  const [consumptionForm, setConsumptionForm] = useState<ConsumptionFormShape>(emptyConsumptionForm());
  const [metadataCandidates, setMetadataCandidates] = useState<MetadataCandidate[]>([]);
  const [metadataHint, setMetadataHint] = useState('');
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const autoSearchTimer = useRef<number | undefined>(undefined);
  const skipAutoSearchRef = useRef(false);

  // 列表筛选
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');

  // 事件 / 文章编辑
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<EventPostForm>(EMPTY_EVENT_POST_FORM);
  const [editTab, setEditTab] = useState<'edit' | 'preview'>('edit');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // ========== 统一反馈：sonner toast / 确认弹窗 / 未保存标记 ==========
  const notify = useCallback((type: 'success' | 'error', text: string) => {
    if (type === 'success') toast.success(text);
    else toast.error(text);
  }, []);

  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    danger?: boolean;
  } | null>(null);
  const askConfirm = useCallback(
    (title: string, message: string, onConfirm: () => void, opts?: { confirmText?: string; danger?: boolean }) => {
      setConfirmState({ title, message, onConfirm, confirmText: opts?.confirmText, danger: opts?.danger });
    },
    []
  );

  const [dirty, setDirty] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    EventMeta | PostMeta | { id: string; title: string; mode: string } | null
  >(null);

  // 上传
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 媒体选择器
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // ========== 工具栏插入 ==========
  const insertContent = useCallback((template: string) => {
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
  }, [form.content]);

  const pendingImageInsertRef = useRef(false);
  const handleToolbarUpload = useCallback(() => {
    pendingImageInsertRef.current = true;
    mediaFileInputRef.current?.click();
  }, []);

  // ========== 文件上传 ==========
  async function handleUpload(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      setUploadMsg(t.uploadTooLarge);
      return;
    }
    setUploading(true);
    setUploadMsg(t.uploading);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(t.uploadReadError));
        reader.readAsDataURL(file);
      });

      const resp = await fetch('/api/upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, data: dataUrl }),
      });
      const result = await resp.json();
      if (resp.ok && result.success) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const fileType = classifyFileType(ext);
        const newItem: MediaItem = {
          id: `m-${Date.now()}`,
          filename: result.filename,
          url: result.url,
          title: file.name,
          description: '',
          album: '未分类',
          fileType,
          mimeType: file.type,
          fileSize: file.size,
          tags: [],
          createdAt: new Date().toISOString(),
        };

        setMedia((prev) => {
          const updated = [newItem, ...prev];
          fetch('/api/write-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ media: updated }),
          }).catch(() => {});
          return updated;
        });

        if (pendingImageInsertRef.current) {
          pendingImageInsertRef.current = false;
          const url = getFileUrl(result.url);
          if (fileType === 'image') {
            insertContent(`\n![${file.name.replace(/\.[^.]+$/, '')}](${url})\n`);
          } else {
            insertContent(`\n[${file.name}](${url})\n`);
          }
        }

        setUploadMsg('');
        setUploading(false);
      } else {
        setUploadMsg(result.error || t.uploadFailed);
        setUploading(false);
      }
    } catch (err) {
      setUploadMsg(t.uploadFailed);
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  // ========== 筛选 ==========
  const filteredEvents = useMemo(() => {
    let result = events;
    if (filterCategory !== '全部') {
      result = result.filter((e) => e.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) => e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, filterCategory, searchQuery]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, searchQuery]);

  // ========== 事件 / 文章加载 ==========
  const doSelectEvent = useCallback((event: EventMeta) => {
    setSelectedSlug(event.slug);
    setIsNew(false);
    setForm({
      date: event.date,
      title: event.title,
      category: event.category,
      tags: event.tags.join(', '),
      importance: event.importance,
      location: event.location || '',
      content: event.body.trim(),
      draft: event.draft,
    });
    setEditTab('edit');
    setStatus('idle');
    setDirty(false);
  }, []);

  const selectEvent = useCallback(
    (event: EventMeta) => {
      if (dirty) {
        askConfirm(t.unsavedTitle, t.unsavedMessage, () => doSelectEvent(event));
        return;
      }
      doSelectEvent(event);
    },
    [dirty, askConfirm, doSelectEvent, t]
  );

  const doSelectPost = useCallback((post: PostMeta) => {
    setSelectedSlug(post.slug);
    setIsNew(false);
    setForm({
      date: post.date,
      title: post.title,
      category: '其他',
      tags: post.tags.join(', '),
      importance: 3,
      location: '',
      content: post.body.trim(),
      draft: post.draft,
    });
    setEditTab('edit');
    setStatus('idle');
    setDirty(false);
  }, []);

  const selectPost = useCallback(
    (post: PostMeta) => {
      if (dirty) {
        askConfirm(t.unsavedTitle, t.unsavedMessage, () => doSelectPost(post));
        return;
      }
      doSelectPost(post);
    },
    [dirty, askConfirm, doSelectPost, t]
  );

  const doNewItem = useCallback(() => {
    setSelectedSlug(null);
    setIsNew(true);
    setForm(EMPTY_EVENT_POST_FORM);
    setEditTab('edit');
    setStatus('idle');
    setSearchQuery('');
    setFilterCategory('全部');
    setDirty(false);
  }, []);

  const newItem = useCallback(() => {
    if (dirty) {
      askConfirm(t.unsavedTitle, t.unsavedMessage, doNewItem, { confirmText: t.continueBtn });
      return;
    }
    doNewItem();
  }, [dirty, askConfirm, doNewItem, t]);

  // ========== 切换模块 ==========
  function resetConsumptionForm() {
    setConsumptionForm(emptyConsumptionForm());
    setMetadataCandidates([]);
    setMetadataHint('');
    setFetchingMeta(false);
    setDirty(false);
  }

  function switchMode(newMode: AdminMode) {
    const doSwitch = () => {
      setMode(newMode);
      setSelectedSlug(null);
      setIsNew(false);
      setSelectedGoalId(null);
      setForm(EMPTY_EVENT_POST_FORM);
      setGoalForm(EMPTY_GOAL_FORM);
      resetConsumptionForm();
      setEditTab('edit');
      setStatus('idle');
      setMessage('');
      setSearchQuery('');
      setFilterCategory('全部');
      setDirty(false);
    };
    if (dirty) {
      askConfirm(t.unsavedTitle, t.unsavedMessage, doSwitch, { confirmText: t.continueBtn });
      return;
    }
    doSwitch();
  }

  // ========== 事件 / 文章提交 ==========
  function update(field: keyof EventPostForm, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    try {
      const apiPath = mode === 'events' ? '/api/write-event' : '/api/write-post';
      const body =
        mode === 'events'
          ? JSON.stringify({
              date: form.date,
              title: form.title,
              category: form.category,
              tags: form.tags.split(/[,，]/).map((tg) => tg.trim()).filter(Boolean),
              importance: form.importance,
              location: form.location || undefined,
              content: form.content,
              draft: form.draft,
            })
          : JSON.stringify({
              date: form.date,
              title: form.title,
              tags: form.tags.split(/[,，]/).map((tg) => tg.trim()).filter(Boolean),
              content: form.content,
              draft: form.draft,
            });

      const resp = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (mode === 'events') {
          const slug = data.path.replace('src/content/events/', '').replace(/\.md$/, '');
          const meta: EventMeta = {
            slug,
            date: form.date,
            title: form.title,
            category: form.category,
            tags: form.tags.split(/[,，]/).map((tg) => tg.trim()).filter(Boolean),
            importance: form.importance,
            location: form.location || undefined,
            draft: form.draft,
            body: form.content,
            images: [],
          };
          setEvents((prev) =>
            [meta, ...prev.filter((e) => e.slug !== slug)].sort((a, b) => a.date.localeCompare(b.date))
          );
          setSelectedSlug(slug);
          setIsNew(false);
        } else {
          const slug = data.path.replace('src/content/blog/', '').replace(/\.md$/, '');
          const meta: PostMeta = {
            slug,
            date: form.date,
            title: form.title,
            tags: form.tags.split(/[,，]/).map((tg) => tg.trim()).filter(Boolean),
            draft: form.draft,
            body: form.content,
          };
          setPosts((prev) =>
            [meta, ...prev.filter((p) => p.slug !== slug)].sort((a, b) => b.date.localeCompare(a.date))
          );
          setSelectedSlug(slug);
          setIsNew(false);
        }
        setStatus('idle');
        setDirty(false);
        notify('success', t.saved(data.path));
      } else {
        notify('error', data.error || t.saveFailed);
      }
    } catch (err) {
      notify('error', t.networkError(err instanceof Error ? err.message : t.unknownError));
    }
  }

  // ========== 档案提交 ==========
  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profileForm.name || !profileForm.birthDate) {
      setStatus('error');
      setMessage(t.validationError);
      return;
    }
    setStatus('saving');
    setMessage('');
    try {
      const resp = await fetch('/api/write-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          tagline: profileForm.tagline,
          avatar: profileForm.avatar,
          birthDate: profileForm.birthDate,
          skills: profileForm.skills.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
          shortGoal: profileForm.shortGoal,
          longGoal: profileForm.longGoal,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setStatus('idle');
        setDirty(false);
        notify('success', t.saved(data.path));
      } else {
        notify('error', data.error || t.saveFailed);
      }
    } catch (err) {
      notify('error', t.networkError(err instanceof Error ? err.message : t.unknownError));
    }
  }

  // ========== 关系图谱操作 ==========
  function selectPerson(id: string) {
    const p = relations.people.find((x) => x.id === id);
    if (!p) return;
    setSelectedPersonId(id);
    setPersonForm({
      id: p.id,
      name: p.name,
      relation: p.relation,
      importance: p.importance,
      avatar: p.avatar ?? '',
      description: p.description,
      links: [...p.links],
      stories: p.stories.map((s) => ({ ...s })),
    });
    setRelationStatus('idle');
    setRelationMessage('');
    setDirty(false);
  }

  function handleNewPerson() {
    const id = `p-${Date.now().toString(36)}`;
    setRelations((prev) => ({
      people: [
        ...prev.people,
        {
          id,
          name: '',
          relation: '家人',
          importance: 3,
          description: '',
          links: [],
          stories: [],
        },
      ],
    }));
    setSelectedPersonId(id);
    setPersonForm(emptyPersonForm());
    setPersonForm((prev) => ({ ...prev, id }));
    setRelationStatus('idle');
    setRelationMessage('');
    setDirty(true);
  }

  /** 全量保存关系图谱（删除后立即生效也走这里） */
  async function saveRelations(people: RelationsData['people']) {
    setRelationStatus('saving');
    setRelationMessage('');
    try {
      const resp = await fetch('/api/write-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setRelations({ people });
        setRelationStatus('idle');
        setDirty(false);
        notify('success', t.relationSaved(data.path));
        return true;
      }
      setRelationStatus('error');
      setRelationMessage(data.error || t.saveFailed);
      notify('error', data.error || t.saveFailed);
      return false;
    } catch (err) {
      setRelationStatus('error');
      setRelationMessage(
        t.networkError(err instanceof Error ? err.message : t.unknownError),
      );
      notify(
        'error',
        t.networkError(err instanceof Error ? err.message : t.unknownError),
      );
      return false;
    }
  }

  async function handleRelationsSubmit() {
    if (!personForm.name.trim()) {
      setRelationStatus('error');
      setRelationMessage(t.relationNameRequired);
      notify('error', t.relationNameRequired);
      return;
    }
    const next = relations.people.map((p) =>
      p.id === personForm.id
        ? {
            ...p,
            name: personForm.name.trim(),
            relation: personForm.relation as RelationType,
            importance: personForm.importance,
            avatar: personForm.avatar.trim(),
            description: personForm.description,
            links: personForm.links,
            stories: personForm.stories.filter((s) => s.date || s.event),
          }
        : p,
    );
    const ok = await saveRelations(next);
    if (ok) {
      setPersonForm((prev) => ({
        ...prev,
        stories: prev.stories.filter((s) => s.date || s.event),
      }));
    }
  }

  function confirmDeletePerson() {
    setRelationsDeleteOpen(false);
    if (!selectedPersonId) return;
    const next = relations.people.filter((p) => p.id !== selectedPersonId);
    // 删除后清理其他人物对该人物的连线引用
    const cleaned = next.map((p) => ({
      ...p,
      links: p.links.filter((l) => l !== selectedPersonId),
    }));
    setSelectedPersonId(null);
    setPersonForm(emptyPersonForm());
    void saveRelations(cleaned);
  }

  function handleToggleLink(id: string) {
    setPersonForm((prev) => ({
      ...prev,
      links: prev.links.includes(id)
        ? prev.links.filter((l) => l !== id)
        : [...prev.links, id],
    }));
    setDirty(true);
  }

  function handleStoriesChange(stories: StoryRow[]) {
    setPersonForm((prev) => ({ ...prev, stories }));
    setDirty(true);
  }

  // ========== 清单操作 ==========
  function selectConsumption(id: string) {
    const c = consumptions.find((x) => x.id === id);
    if (!c) return;
    setConsumptionForm({
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
    });
    setMetadataCandidates([]);
    setMetadataHint('');
    setDirty(false);
    skipAutoSearchRef.current = true;
  }

  async function handleFetchMetadata() {
    if (!consumptionForm.title.trim()) {
      notify('error', t.metadataTitleRequired);
      return;
    }
    setFetchingMeta(true);
    setMetadataCandidates([]);
    setMetadataHint('');
    try {
      const url =
        // type=all：同时搜索影视与书籍，候选带类型徽标，点击自动切换类型
        `/api/fetch-metadata?type=all` +
        `&title=${encodeURIComponent(consumptionForm.title.trim())}` +
        (consumptionForm.author.trim()
          ? `&author=${encodeURIComponent(consumptionForm.author.trim())}`
          : '') +
        (consumptionForm.year.trim()
          ? `&year=${encodeURIComponent(consumptionForm.year.trim())}`
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

  // 标题/类型变化后防抖自动搜索（程序化设置表单时跳过，避免选择条目后重复搜索）
  useEffect(() => {
    const title = consumptionForm.title.trim();
    if (!title) {
      setMetadataCandidates([]);
      setMetadataHint('');
      return;
    }
    if (skipAutoSearchRef.current) {
      skipAutoSearchRef.current = false;
      return;
    }
    window.clearTimeout(autoSearchTimer.current);
    autoSearchTimer.current = window.setTimeout(() => {
      void handleFetchMetadata();
    }, 600);
    return () => window.clearTimeout(autoSearchTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumptionForm.title, consumptionForm.type]);

  async function applyMetadataCandidate(c: MetadataCandidate) {
    // 立即填充字段（封面先用远程 URL），避免等待封面下载
    setConsumptionForm((prev) => ({
      ...prev,
      // 智能填充：已手动填写的字段不被覆盖
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
    skipAutoSearchRef.current = true;

    // 后台下载封面到本地（成功则替换 URL，失败保留远程 URL）；本地书库封面路径无需下载
    if (/^https?:\/\//.test(c.cover)) {
      setFetchingMeta(true);
      try {
        const resp = await fetch('/api/save-cover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: c.cover }),
        });
        const json = await resp.json();
        if (resp.ok && json.success && json.url) {
          setConsumptionForm((prev) => ({ ...prev, cover: json.url }));
        }
      } catch {
        // 下载失败时保留远程 URL
      } finally {
        setFetchingMeta(false);
      }
    }
  }

  async function handleConsumptionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consumptionForm.title.trim()) {
      notify('error', t.consumptionTitleRequired);
      return;
    }
    // 日期格式校验（YYYY / YYYY-MM / YYYY-MM-DD）
    if (
      consumptionForm.date.trim() &&
      !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(consumptionForm.date.trim())
    ) {
      notify('error', t.consumptionDateInvalid);
      return;
    }
    // 年份校验（1900-2100 整数，允许空）
    const yearTrim = consumptionForm.year.trim();
    let yearNum: number | undefined;
    if (yearTrim) {
      yearNum = Number(yearTrim);
      if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) {
        notify('error', t.consumptionYearInvalid);
        return;
      }
    }
    setStatus('saving');

    const newItem: ConsumptionItem = {
      id: consumptionForm.id || `c-${Date.now()}`,
      title: consumptionForm.title.trim(),
      type: consumptionForm.type,
      status: consumptionForm.status,
      rating: consumptionForm.rating,
      review: consumptionForm.review,
      date: consumptionForm.date,
      cover: consumptionForm.cover.trim(),
      ...(yearNum ? { year: yearNum } : {}),
      ...(consumptionForm.releaseDate.trim()
        ? { releaseDate: consumptionForm.releaseDate.trim() }
        : {}),
      ...(consumptionForm.author ? { author: consumptionForm.author.trim() } : {}),
      ...(consumptionForm.source ? { source: consumptionForm.source } : {}),
      ...(consumptionForm.sourceId ? { sourceId: consumptionForm.sourceId.trim() } : {}),
      ...(consumptionForm.sourceUrl ? { sourceUrl: consumptionForm.sourceUrl.trim() } : {}),
      tags: consumptionForm.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
    };

    const updated = consumptionForm.id
      ? consumptions.map((c) => (c.id === consumptionForm.id ? newItem : c))
      : [newItem, ...consumptions];

    try {
      const resp = await fetch('/api/write-consumptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updated }),
      });
      const json = await resp.json();
      if (resp.ok && json.success) {
        setConsumptions(updated);
        setStatus('idle');
        setDirty(false);
        notify('success', t.consumptionSaved(json.path));
        resetConsumptionForm();
      }
    } catch (err) {
      notify('error', t.networkError(err instanceof Error ? err.message : ''));
    }
  }

  function handleConsumptionDelete() {
    const c = consumptions.find((x) => x.id === consumptionForm.id);
    if (!c) return;
    setDeleteTarget({ id: c.id, title: c.title, mode: 'consumptions' });
  }

  // ========== 目标操作 ==========
  const selectGoal = useCallback((goal: Goal) => {
    setSelectedGoalId(goal.id);
    setGoalForm({
      title: goal.title,
      description: goal.description,
      progress: goal.progress,
      category: goal.category,
      status: goal.status,
      relatedEvents: goal.relatedEvents.join(', '),
    });
    setStatus('idle');
    setDirty(false);
  }, []);

  const newGoal = useCallback(() => {
    setSelectedGoalId(null);
    setGoalForm(EMPTY_GOAL_FORM);
    setStatus('idle');
    setDirty(false);
  }, []);

  async function handleGoalSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!goalForm.title) {
      notify('error', t.validationError);
      return;
    }
    setStatus('saving');

    const goal: Goal = {
      id: selectedGoalId || `g-${Date.now()}`,
      title: goalForm.title,
      description: goalForm.description,
      progress: goalForm.progress,
      category: goalForm.category,
      status: goalForm.status,
      relatedEvents: goalForm.relatedEvents.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      createdAt: selectedGoalId
        ? goals.find((g) => g.id === selectedGoalId)?.createdAt || new Date().toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    };

    const updatedGoals = selectedGoalId
      ? goals.map((g) => (g.id === selectedGoalId ? goal : g))
      : [...goals, goal];

    try {
      const resp = await fetch('/api/write-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: updatedGoals }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setGoals(updatedGoals);
        setStatus('idle');
        setDirty(false);
        notify('success', t.goalSaved(data.path));
      } else {
        notify('error', data.error || t.saveFailed);
      }
    } catch (err) {
      notify('error', t.networkError(err instanceof Error ? err.message : t.unknownError));
    }
  }

  async function handleGoalDelete() {
    if (!selectedGoalId) return;
    const updatedGoals = goals.filter((g) => g.id !== selectedGoalId);
    try {
      const resp = await fetch('/api/write-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: updatedGoals }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setGoals(updatedGoals);
        setSelectedGoalId(null);
        setGoalForm(EMPTY_GOAL_FORM);
        setDirty(false);
        notify('success', t.deleted);
      } else {
        notify('error', data.error || t.deleteFailed);
      }
    } catch (err) {
      notify('error', t.networkError(err instanceof Error ? err.message : t.unknownError));
    }
  }

  // ========== 删除 ==========
  async function confirmDelete() {
    if (!deleteTarget) return;

    if ('mode' in deleteTarget && deleteTarget.mode === 'consumptions') {
      const dt = deleteTarget;
      const updated = consumptions.filter((c) => c.id !== dt.id);
      try {
        const resp = await fetch('/api/write-consumptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: updated }),
        });
        const json = await resp.json();
        if (resp.ok && json.success) {
          setConsumptions(updated);
          if (consumptionForm.id === dt.id) resetConsumptionForm();
          setDirty(false);
          notify('success', t.deleted);
        } else {
          notify('error', json.error || t.deleteFailed);
        }
      } catch (err) {
        notify('error', t.networkError(err instanceof Error ? err.message : t.unknownError));
      }
      setDeleteTarget(null);
      return;
    }

    const target = deleteTarget as EventMeta | PostMeta;
    try {
      const apiPath = mode === 'events' ? '/api/delete-event' : '/api/delete-post';
      const filePath =
        mode === 'events'
          ? `src/content/events/${target.date.slice(0, 4)}/${target.slug}.md`
          : `src/content/blog/${target.slug}.md`;

      const resp = await fetch(apiPath, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (mode === 'events') {
          setEvents((prev) => prev.filter((e) => e.slug !== target.slug));
        } else {
          setPosts((prev) => prev.filter((p) => p.slug !== target.slug));
        }
        if (selectedSlug === target.slug) newItem();
        setDirty(false);
        notify('success', t.deleted);
      } else {
        notify('error', data.error || t.deleteFailed);
      }
    } catch (err) {
      notify('error', t.networkError(err instanceof Error ? err.message : t.unknownError));
    }
    setDeleteTarget(null);
  }

  // ========== 媒体操作 ==========
  function handleMediaSelect(item: MediaItem) {
    setSelectedMediaId(item.id);
    setMediaForm({
      title: item.title || '',
      description: item.description || '',
      album: item.album === '未分类' ? '' : item.album,
    });
    setDirty(false);
  }

  function handleMediaNew() {
    setSelectedMediaId(null);
    setMediaForm(EMPTY_MEDIA_FORM);
  }

  async function handleMediaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMediaId) return;
    setMedia((prev) => {
      const updated = prev.map((m) =>
        m.id === selectedMediaId
          ? {
              ...m,
              title: mediaForm.title,
              description: mediaForm.description,
              album: mediaForm.album || '未分类',
            }
          : m
      );
      fetch('/api/write-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media: updated }),
      }).catch(() => {});
      return updated;
    });
    setDirty(false);
    notify('success', t.mediaSaved);
  }

  function handleMediaDelete() {
    if (!selectedMediaId) return;
    const item = media.find((m) => m.id === selectedMediaId);
    if (!item) return;
    askConfirm(
      t.deleteTitle,
      t.mediaDeleteConfirm.replace('{title}', item.title || item.filename),
      async () => {
        try {
          await fetch('/api/delete-media', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: item.filename }),
          });
        } catch {}
        setMedia((prev) => {
          const updated = prev.filter((m) => m.id !== selectedMediaId);
          fetch('/api/write-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ media: updated }),
          }).catch(() => {});
          return updated;
        });
        setSelectedMediaId(null);
        setMediaForm(EMPTY_MEDIA_FORM);
        setDirty(false);
        notify('success', t.deleted);
      },
      { danger: true }
    );
  }

  function handleEditorDelete() {
    if (mode === 'events') {
      const ev = events.find((e) => e.slug === selectedSlug);
      if (ev) setDeleteTarget(ev);
    } else {
      const p = posts.find((p) => p.slug === selectedSlug);
      if (p) setDeleteTarget(p);
    }
  }

  // ========== 媒体选择器插入 ==========
  function handleMediaPickerInsert(item: MediaItem) {
    const isImage = item.fileType === 'image';
    const linkTitle = item.title || item.filename;
    const md = isImage ? `![${linkTitle}](${getFileUrl(item.url)})` : `[${linkTitle}](${getFileUrl(item.url)})`;
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = form.content.slice(0, start);
      const after = form.content.slice(end);
      const newContent = before + (before && !before.endsWith('\n') ? '\n' : '') + md + '\n' + after;
      setForm((prev) => ({ ...prev, content: newContent }));
      setTimeout(() => {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + md.length + (before && !before.endsWith('\n') ? 1 : 0) + 1;
      }, 0);
    }
    setShowMediaPicker(false);
  }

  // ========== 导航 ==========
  const tabItems = [
    { key: 'events' as AdminMode, label: t.tabEvents, count: events.length },
    { key: 'posts' as AdminMode, label: t.tabPosts, count: posts.length },
    { key: 'consumptions' as AdminMode, label: t.tabConsumptions, count: consumptions.length },
    { key: 'goals' as AdminMode, label: t.tabGoals, count: goals.length },
    { key: 'media' as AdminMode, label: t.tabMedia, count: media.length },
    { key: 'profile' as AdminMode, label: t.tabProfile, count: initialProfile ? 1 : 0 },
  ];

  const isEventPost = mode === 'events' || mode === 'posts';
  const listItems: Array<EventMeta | PostMeta> = mode === 'events' ? filteredEvents : filteredPosts;

  return (
    <div
      ref={setRootEl}
      className="admin-root flex flex-col min-h-[600px] border border-border/60 rounded-xl overflow-hidden bg-background"
    >
      {/* 全局隐藏文件输入（工具栏上传 / 媒体上传共用） */}
      <input
        ref={mediaFileInputRef}
        type="file"
        accept={ALL_EXTENSIONS.map((e) => `.${e}`).join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-1 min-h-0">
        <ModuleNav tabs={tabItems} mode={mode} ariaLabel={t.moduleNav} onSwitch={switchMode} />

        {/* 列表列 */}
        {mode !== 'profile' && (
          <aside className="w-72 shrink-0 border-r border-border/60 hidden md:flex flex-col bg-muted/30">
            {isEventPost ? (
              <EventPostList
                mode={mode}
                items={listItems}
                count={mode === 'events' ? filteredEvents.length : filteredPosts.length}
                search={searchQuery}
                categoryFilter={filterCategory}
                selectedSlug={selectedSlug}
                labels={{
                  listTitle: mode === 'events' ? t.eventList : t.postList,
                  search: t.search,
                  newBtn: mode === 'events' ? t.newEvent : t.newPost,
                  empty: t.emptyList,
                  draftBadge: t.draftBadge,
                  allCategories: t.allEvents,
                }}
                onSearch={setSearchQuery}
                onCategory={setFilterCategory}
                onSelect={(item) =>
                  mode === 'events' ? selectEvent(item as EventMeta) : selectPost(item as PostMeta)
                }
                onNew={newItem}
              />
            ) : mode === 'goals' ? (
              <GoalList
                goals={goals}
                selectedId={selectedGoalId}
                labels={{
                  title: t.tabGoals,
                  newBtn: t.goalNew,
                  empty: t.goalEmpty,
                  statusActive: t.goalStatusActive,
                  statusCompleted: t.goalStatusCompleted,
                  statusPaused: t.goalStatusPaused,
                  short: t.goalCategoryShort,
                  long: t.goalCategoryLong,
                }}
                onSelect={selectGoal}
                onNew={newGoal}
              />
            ) : mode === 'consumptions' ? (
              <ConsumptionListPanel
                items={consumptions}
                selectedId={consumptionForm.id}
                labels={{
                  title: t.tabConsumptions,
                  newBtn: t.consumptionNew,
                  empty: t.consumptionEmpty,
                  search: t.search,
                  all: t.consumptionAll,
                  typeOptions: t.consumptionTypeOptions,
                  statusOptions: t.consumptionStatusOptions,
                }}
                onSelect={selectConsumption}
                onNew={resetConsumptionForm}
              />
            ) : (
              <MediaListPanel
                items={media}
                selectedId={selectedMediaId}
                labels={{ title: t.tabMedia, newBtn: t.mediaNew, empty: t.mediaEmpty }}
                onSelect={handleMediaSelect}
                onNew={handleMediaNew}
              />
            )}
          </aside>
        )}

        {/* 编辑工作区 */}
        <main className="flex-1 flex flex-col min-w-0">
          {isEventPost ? (
            selectedSlug || isNew ? (
              <EventPostEditor
                mode={mode}
                form={form}
                editTab={editTab}
                status={status}
                message={message}
                selectedSlug={selectedSlug}
                textareaRef={textareaRef}
                t={t}
                onUpdate={update}
                onTabChange={setEditTab}
                onSubmit={handleSubmit}
                onDelete={handleEditorDelete}
                onInsert={insertContent}
                onPickImage={() => setShowMediaPicker(true)}
                onUploadImage={handleToolbarUpload}
                onDirty={() => setDirty(true)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                {t.noSelection}
              </div>
            )
          ) : mode === 'goals' ? (
            <GoalEditor
              form={goalForm}
              selectedId={selectedGoalId}
              status={status}
              message={message}
              t={t}
              onField={(field, value) => {
                setGoalForm((prev) => ({ ...prev, [field]: value }));
                setDirty(true);
              }}
              onSubmit={handleGoalSubmit}
              onDelete={() => {
                const g = goals.find((x) => x.id === selectedGoalId);
                if (g) {
                  askConfirm(
                    t.deleteTitle,
                    t.goalDeleteConfirm.replace('{title}', g.title),
                    () => handleGoalDelete(),
                    { danger: true }
                  );
                }
              }}
            />
          ) : mode === 'consumptions' ? (
            <ConsumptionEditor
              form={consumptionForm}
              metadataCandidates={metadataCandidates}
              metadataHint={metadataHint}
              fetchingMeta={fetchingMeta}
              t={t}
              onField={(field, value) => {
                setConsumptionForm((prev) => ({ ...prev, [field]: value }));
                setDirty(true);
              }}
              onSubmit={handleConsumptionSubmit}
              onDelete={handleConsumptionDelete}
              onFetchMetadata={handleFetchMetadata}
              onApplyCandidate={applyMetadataCandidate}
            />
          ) : mode === 'media' ? (
            <MediaEditor
              form={mediaForm}
              selectedId={selectedMediaId}
              uploading={uploading}
              uploadMsg={uploadMsg}
              dragOver={dragOver}
              albums={Array.from(new Set(media.map((m) => m.album).filter(Boolean)))}
              t={t}
              onField={(field, value) => setMediaForm((prev) => ({ ...prev, [field]: value }))}
              onDragOver={setDragOver}
              onDrop={handleDrop}
              onPickFile={() => mediaFileInputRef.current?.click()}
              onSubmit={handleMediaSubmit}
              onDelete={handleMediaDelete}
              onDirty={() => setDirty(true)}
            />
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 档案分段：个人资料 / 关系图谱 */}
              <div className="flex items-center gap-1 px-4 pt-3 border-b border-border/60">
                <button
                  type="button"
                  onClick={() => setProfileTab('profile')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    profileTab === 'profile'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.tabProfileInfo}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileTab('relations')}
                  className={cn(
                    'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    profileTab === 'relations'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.tabRelations}
                </button>
              </div>

              {profileTab === 'profile' ? (
                <ProfileEditor
                  form={profileForm}
                  status={status}
                  message={message}
                  t={t}
                  onField={(field, value) => {
                    setProfileForm((prev) => ({ ...prev, [field]: value }));
                    setDirty(true);
                  }}
                  onSubmit={handleProfileSubmit}
                />
              ) : (
                <RelationsEditor
                  people={relations.people}
                  selectedId={selectedPersonId}
                  form={personForm}
                  status={relationStatus}
                  message={relationMessage}
                  t={t}
                  container={rootEl}
                  onSelect={selectPerson}
                  onNew={handleNewPerson}
                  onDelete={() => setRelationsDeleteOpen(true)}
                  onField={(field, value) => {
                    setPersonForm((prev) => ({ ...prev, [field]: value }));
                    setDirty(true);
                  }}
                  onStoriesChange={handleStoriesChange}
                  onToggleLink={handleToggleLink}
                  onSubmit={handleRelationsSubmit}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* 关系图谱删除确认 */}
      <ConfirmDialog
        open={relationsDeleteOpen}
        title={t.deleteTitle}
        message={t.relationDeleteConfirm.replace(
          '{title}',
          personForm.name || t.noTitle,
        )}
        confirmText={t.deleteBtn}
        danger
        cancelText={t.cancelBtn}
        container={rootEl}
        onCancel={() => setRelationsDeleteOpen(false)}
        onConfirm={confirmDeletePerson}
      />

      {/* 删除确认（事件/文章/清单） */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t.deleteTitle}
        message={t.deleteConfirm.replace('{title}', deleteTarget ? deleteTarget.title : '')}
        confirmText={t.deleteBtn}
        danger
        cancelText={t.cancelBtn}
        container={rootEl}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {/* 通用确认（未保存切换等） */}
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        confirmText={confirmState?.confirmText}
        danger={confirmState?.danger}
        cancelText={t.cancelBtn}
        container={rootEl}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          const fn = confirmState?.onConfirm;
          setConfirmState(null);
          if (fn) fn();
        }}
      />

      {/* 媒体选择器 */}
      <MediaPicker
        open={showMediaPicker}
        media={media}
        searchPlaceholder={t.search}
        title={t.insertMediaTitle}
        emptyText={t.insertMediaEmpty}
        emptyListText={t.emptyList}
        footerText={t.insertMediaFooter}
        container={rootEl}
        onClose={() => setShowMediaPicker(false)}
        onInsert={handleMediaPickerInsert}
      />

      <Toaster />
    </div>
  );
}
