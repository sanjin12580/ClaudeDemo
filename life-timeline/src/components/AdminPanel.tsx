import { useState, useMemo, useCallback, useRef } from 'react';
import type { EventMeta, PostMeta, Profile, Goal, MediaItem, Category } from '../lib/types';
import type { ConsumptionItem, MetadataCandidate } from '../lib/parseConsumptions';
import { CATEGORY_COLORS, ALLOWED_EXTENSIONS, classifyFileType, getIconForFile } from '../lib/types';
import { useI18n } from '../lib/i18n';
import { getFileUrl } from '../lib/filePreview';

const CATEGORIES: Category[] = ['教育', '工作', '旅行', '健康', '关系', '项目', '其他'];

// 所有允许上传的文件扩展名（扁平集合用于 accept 属性）
const ALL_EXTENSIONS = Object.values(ALLOWED_EXTENSIONS).flat();

type AdminMode = 'events' | 'posts' | 'profile' | 'goals' | 'media' | 'consumptions';

interface FormData {
  date: string;
  title: string;
  category: Category;
  tags: string;
  importance: number;
  location: string;
  content: string;
  draft: boolean;
}

const EMPTY_FORM: FormData = {
  date: '',
  title: '',
  category: '其他',
  tags: '',
  importance: 3,
  location: '',
  content: '',
  draft: false,
};

interface Props {
  events: EventMeta[];
  posts: PostMeta[];
  profile: Profile | null;
  goals: Goal[];
  media: MediaItem[];
  consumptions: ConsumptionItem[];
}

// ============================================================
// 轻量 Markdown 渲染（不引入外部库）
// ============================================================
function renderMarkdown(text: string): string {
  if (!text) return '<p class="text-gray-400 dark:text-gray-500 italic">（空内容）</p>';
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-green-600 dark:text-green-400 underline">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-2" />')
    .replace(/`([^`]+)`/g, '<code class="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-green-400 pl-3 italic text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 my-2">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^---$/gm, '<hr class="my-4 border-gray-200 dark:border-gray-700" />')
    .replace(/\n\n+/g, '</p><p class="mb-2 leading-relaxed">');

  return `<p class="mb-2 leading-relaxed">${html}</p>`;
}

// ============================================================
// 主组件
// ============================================================
export default function AdminPanel({ events: initialEvents, posts: initialPosts, profile: initialProfile, goals: initialGoals, media: initialMedia, consumptions: initialConsumptions }: Props) {
  const { admin: t } = useI18n();

  // 模式切换
  const [mode, setMode] = useState<AdminMode>('events');

  // 事件列表
  const [events, setEvents] = useState<EventMeta[]>(initialEvents);
  // 文章列表
  const [posts, setPosts] = useState<PostMeta[]>(initialPosts);
  // 目标列表
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  // 清单列表
  const [consumptions, setConsumptions] = useState<ConsumptionItem[]>(initialConsumptions);

  // 档案表单
  const [profileForm, setProfileForm] = useState({
    name: initialProfile?.name ?? '',
    tagline: initialProfile?.tagline ?? '',
    avatar: initialProfile?.avatar ?? '',
    birthDate: initialProfile?.birthDate ?? '',
    skills: initialProfile?.skills?.join(', ') ?? '',
    shortGoal: initialProfile?.shortGoal ?? '',
    longGoal: initialProfile?.longGoal ?? '',
  });

  // 目标表单
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const EMPTY_GOAL_FORM = {
    title: '',
    description: '',
    progress: 0,
    category: 'short' as 'short' | 'long',
    status: 'active' as 'active' | 'completed' | 'paused',
    relatedEvents: '',
  };
  const [goalForm, setGoalForm] = useState(EMPTY_GOAL_FORM);

  // 媒体列表
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const EMPTY_MEDIA_FORM = {
    title: '',
    description: '',
    album: '',
  };
  const [mediaForm, setMediaForm] = useState(EMPTY_MEDIA_FORM);

  // 清单表单
  const [consumptionId, setConsumptionId] = useState<string | null>(null);
  const [consumptionTitle, setConsumptionTitle] = useState('');
  const [consumptionType, setConsumptionType] = useState<'book' | 'novel' | 'movie' | 'tv' | 'anime' | 'variety' | 'music'>('book');
  const [consumptionStatus, setConsumptionStatus] = useState<'done' | 'doing' | 'want'>('done');
  const [consumptionRating, setConsumptionRating] = useState(3);
  const [consumptionReview, setConsumptionReview] = useState('');
  const [consumptionDate, setConsumptionDate] = useState(new Date().toISOString().slice(0, 7));
  const [consumptionCover, setConsumptionCover] = useState('');
  const [consumptionTags, setConsumptionTags] = useState('');
  const [consumptionYear, setConsumptionYear] = useState('');
  const [consumptionAuthor, setConsumptionAuthor] = useState('');
  const [consumptionSource, setConsumptionSource] = useState<'tmdb' | 'douban' | 'manual' | undefined>(undefined);
  const [consumptionSourceId, setConsumptionSourceId] = useState('');
  const [consumptionSourceUrl, setConsumptionSourceUrl] = useState('');
  const [metadataCandidates, setMetadataCandidates] = useState<MetadataCandidate[]>([]);
  const [metadataHint, setMetadataHint] = useState('');
  const [fetchingMeta, setFetchingMeta] = useState(false);

  // 列表筛选
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');

  // 编辑状态
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editTab, setEditTab] = useState<'edit' | 'preview'>('edit');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EventMeta | PostMeta | { id: string; title: string; mode: string } | null>(null);

  // 图片上传
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 媒体选择器
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerFilter, setMediaPickerFilter] = useState('');

  // ========== 文件上传（支持图片+所有文件类型） ==========
  async function handleUpload(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      setUploadMsg('文件不能超过 50MB');
      return;
    }
    setUploading(true);
    setUploadMsg('上传中...');
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('文件读取失败'));
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

        // 创建媒体记录
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
          // 自动持久化媒体元数据
          fetch('/api/write-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ media: updated }),
          }).catch(() => {});
          return updated;
        });

        setUploadMsg('');
        setUploading(false);
      } else {
        setUploadMsg(result.error || '上传失败');
        setUploading(false);
      }
    } catch (err) {
      setUploadMsg('上传失败');
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

  // ========== 筛选逻辑 ==========
  const filteredEvents = useMemo(() => {
    let result = events;
    if (filterCategory !== '全部') {
      result = result.filter((e) => e.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [events, filterCategory, searchQuery]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, searchQuery]);

  // ========== 选中项计数 ==========
  const filteredCount = mode === 'events' ? filteredEvents.length : filteredPosts.length;

  // ========== 加载到表单 ==========
  const selectEvent = useCallback((event: EventMeta) => {
    setSelectedSlug(event.slug);
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
    setMessage('');
  }, []);

  const selectPost = useCallback((post: PostMeta) => {
    setSelectedSlug(post.slug);
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
    setMessage('');
  }, []);

  // ========== 新建 ==========
  const newItem = useCallback(() => {
    setSelectedSlug(null);
    setForm(EMPTY_FORM);
    setEditTab('edit');
    setStatus('idle');
    setMessage('');
    setSearchQuery('');
    setFilterCategory('全部');
  }, []);

  // ========== 切换模式时重置 ==========
  function switchMode(newMode: AdminMode) {
    setMode(newMode);
    setSelectedSlug(null);
    setSelectedGoalId(null);
    setForm(EMPTY_FORM);
    setGoalForm(EMPTY_GOAL_FORM);
    resetConsumptionForm();
    setEditTab('edit');
    setStatus('idle');
    setMessage('');
    setSearchQuery('');
    setFilterCategory('全部');
  }

  // ========== 表单更新 ==========
  function update(field: keyof FormData, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ========== 提交 ==========
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
      const body = mode === 'events'
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
        setStatus('success');
        setMessage(t.saved(data.path));
        setTimeout(() => window.location.reload(), 800);
      } else {
        setStatus('error');
        setMessage(data.error || t.saveFailed);
      }
    } catch (err) {
      setStatus('error');
      setMessage(t.networkError(err instanceof Error ? err.message : t.unknownError));
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
        setStatus('success');
        setMessage(t.saved(data.path));
        setTimeout(() => window.location.reload(), 800);
      } else {
        setStatus('error');
        setMessage(data.error || t.saveFailed);
      }
    } catch (err) {
      setStatus('error');
      setMessage(t.networkError(err instanceof Error ? err.message : t.unknownError));
    }
  }

  // ========== 清单操作 ==========
  function resetConsumptionForm() {
    setConsumptionId(null);
    setConsumptionTitle('');
    setConsumptionType('book');
    setConsumptionStatus('done');
    setConsumptionRating(3);
    setConsumptionReview('');
    setConsumptionDate(new Date().toISOString().slice(0, 7));
    setConsumptionCover('');
    setConsumptionTags('');
    setConsumptionYear('');
    setConsumptionAuthor('');
    setConsumptionSource(undefined);
    setConsumptionSourceId('');
    setConsumptionSourceUrl('');
    setMetadataCandidates([]);
    setMetadataHint('');
    setFetchingMeta(false);
  }

  function selectConsumption(id: string) {
    const c = consumptions.find((x) => x.id === id);
    if (!c) return;
    setConsumptionId(c.id);
    setConsumptionTitle(c.title);
    setConsumptionType(c.type);
    setConsumptionStatus(c.status);
    setConsumptionRating(c.rating);
    setConsumptionReview(c.review);
    setConsumptionDate(c.date);
    setConsumptionCover(c.cover || '');
    setConsumptionTags(c.tags.join(', '));
    setConsumptionYear(c.year ? String(c.year) : '');
    setConsumptionAuthor(c.author ?? '');
    setConsumptionSource(c.source);
    setConsumptionSourceId(c.sourceId ?? '');
    setConsumptionSourceUrl(c.sourceUrl ?? '');
    setMetadataCandidates([]);
    setMetadataHint('');
  }

  // ========== 元数据自动获取 ==========
  async function handleFetchMetadata() {
    if (!consumptionTitle.trim()) {
      alert('请先填写标题');
      return;
    }
    setFetchingMeta(true);
    setMetadataCandidates([]);
    setMetadataHint('');
    try {
      const url =
        `/api/fetch-metadata?type=${encodeURIComponent(consumptionType)}` +
        `&title=${encodeURIComponent(consumptionTitle.trim())}`;
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

  async function applyMetadataCandidate(c: MetadataCandidate) {
    setFetchingMeta(true);
    setMetadataHint(t.consumptionSavingCover);
    let cover = c.cover;
    try {
      // 下载到本地 public/covers/，避免豆瓣防盗链导致封面加载失败
      const resp = await fetch('/api/save-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: c.cover }),
      });
      const json = await resp.json();
      if (resp.ok && json.success && json.url) {
        cover = json.url;
      }
    } catch {
      // 下载失败时回退到远程 URL
    }
    setConsumptionTitle(c.title);
    if (c.year) setConsumptionYear(String(c.year));
    if (c.author) setConsumptionAuthor(c.author);
    setConsumptionCover(cover);
    setConsumptionSource(c.source);
    setConsumptionSourceId(c.sourceId);
    setConsumptionSourceUrl(c.sourceUrl ?? '');
    setMetadataCandidates([]);
    setMetadataHint('');
    setFetchingMeta(false);
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
    setMessage('');
  }, []);

  const newGoal = useCallback(() => {
    setSelectedGoalId(null);
    setGoalForm(EMPTY_GOAL_FORM);
    setStatus('idle');
    setMessage('');
  }, []);

  async function handleGoalSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!goalForm.title) {
      setStatus('error');
      setMessage(t.validationError);
      return;
    }
    setStatus('saving');
    setMessage('');

    const newGoal: Goal = {
      id: selectedGoalId || `g-${Date.now()}`,
      title: goalForm.title,
      description: goalForm.description,
      progress: goalForm.progress,
      category: goalForm.category,
      status: goalForm.status,
      relatedEvents: goalForm.relatedEvents.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      createdAt: selectedGoalId
        ? (goals.find((g) => g.id === selectedGoalId)?.createdAt || new Date().toISOString().slice(0, 10))
        : new Date().toISOString().slice(0, 10),
    };

    const updatedGoals = selectedGoalId
      ? goals.map((g) => (g.id === selectedGoalId ? newGoal : g))
      : [...goals, newGoal];

    try {
      const resp = await fetch('/api/write-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: updatedGoals }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setGoals(updatedGoals);
        setStatus('success');
        setMessage(t.goalSaved(data.path));
        setTimeout(() => window.location.reload(), 800);
      } else {
        setStatus('error');
        setMessage(data.error || t.saveFailed);
      }
    } catch (err) {
      setStatus('error');
      setMessage(t.networkError(err instanceof Error ? err.message : t.unknownError));
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
        setMessage(t.deleted);
        setStatus('success');
      } else {
        setMessage(data.error || t.deleteFailed);
        setStatus('error');
      }
    } catch (err) {
      setMessage(t.networkError(err instanceof Error ? err.message : t.unknownError));
      setStatus('error');
    }
  }

  // ========== 清单提交 ==========
  async function handleConsumptionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consumptionTitle.trim()) {
      alert('请填写标题');
      return;
    }
    setStatus('saving');
    setMessage('');

    const newItem: ConsumptionItem = {
      id: consumptionId || `c-${Date.now()}`,
      title: consumptionTitle.trim(),
      type: consumptionType,
      status: consumptionStatus,
      rating: consumptionRating,
      review: consumptionReview,
      date: consumptionDate,
      cover: consumptionCover.trim(),
      ...(consumptionYear ? { year: Number(consumptionYear) } : {}),
      ...(consumptionAuthor ? { author: consumptionAuthor.trim() } : {}),
      ...(consumptionSource ? { source: consumptionSource } : {}),
      ...(consumptionSourceId ? { sourceId: consumptionSourceId.trim() } : {}),
      ...(consumptionSourceUrl ? { sourceUrl: consumptionSourceUrl.trim() } : {}),
      tags: consumptionTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
    };

    const updated = consumptionId
      ? consumptions.map((c) => (c.id === consumptionId ? newItem : c))
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
        setStatus('success');
        setMessage(t.consumptionSaved(json.path));
        resetConsumptionForm();
      }
    } catch (err) {
      setStatus('error');
      setMessage(t.networkError(err instanceof Error ? err.message : ''));
    }
  }

  function handleConsumptionDelete(id: string) {
    const c = consumptions.find((x) => x.id === id);
    if (!c) return;
    setDeleteTarget({
      id,
      title: c.title,
      mode: 'consumptions',
    });
    (document.getElementById('delete_modal') as HTMLDialogElement)?.showModal();
  }

  // ========== 删除 ==========
  async function confirmDelete() {
    if (!deleteTarget) return;

    // 清单删除
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
          if (consumptionId === dt.id) resetConsumptionForm();
          setMessage(t.deleted);
          setStatus('success');
        } else {
          setMessage(json.error || t.deleteFailed);
          setStatus('error');
        }
      } catch (err) {
        setMessage(t.networkError(err instanceof Error ? err.message : t.unknownError));
        setStatus('error');
      }
      setDeleteTarget(null);
      return;
    }

    // 后续代码只处理 EventMeta | PostMeta
    const target = deleteTarget as EventMeta | PostMeta;

    try {
      const apiPath = mode === 'events' ? '/api/delete-event' : '/api/delete-post';
      const filePath = mode === 'events'
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
        setMessage(t.deleted);
        setStatus('success');
      } else {
        setMessage(data.error || t.deleteFailed);
        setStatus('error');
      }
    } catch (err) {
      setMessage(t.networkError(err instanceof Error ? err.message : t.unknownError));
      setStatus('error');
    }
    setDeleteTarget(null);
  }

  return (
    <div className="flex gap-0 min-h-[600px] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
      {/* ========== 左侧：列表 ========== */}
      <aside className="w-80 shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-950/50">
        {/* Tab 切换 */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => switchMode('events')}
            className={`flex-1 text-sm px-4 py-3 transition-colors font-medium
              ${mode === 'events'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500 bg-white dark:bg-gray-900'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-b-2 border-transparent'
              }`}
          >
            {t.tabEvents}
          </button>
          <button
            onClick={() => switchMode('posts')}
            className={`flex-1 text-sm px-4 py-3 transition-colors font-medium
              ${mode === 'posts'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500 bg-white dark:bg-gray-900'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-b-2 border-transparent'
              }`}
          >
            {t.tabPosts}
          </button>
          <button
            onClick={() => switchMode('profile')}
            className={`flex-1 text-sm px-4 py-3 transition-colors font-medium
              ${mode === 'profile'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500 bg-white dark:bg-gray-900'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-b-2 border-transparent'
              }`}
          >
            {t.tabProfile}
          </button>
          <button
            onClick={() => switchMode('goals')}
            className={`flex-1 text-sm px-4 py-3 transition-colors font-medium
              ${mode === 'goals'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500 bg-white dark:bg-gray-900'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-b-2 border-transparent'
              }`}
          >
            {t.tabGoals}
          </button>
          <button
            onClick={() => switchMode('media')}
            className={`flex-1 text-sm px-4 py-3 transition-colors font-medium
              ${mode === 'media'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500 bg-white dark:bg-gray-900'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-b-2 border-transparent'
              }`}
          >
            {t.tabMedia}
          </button>
          <button
            onClick={() => switchMode('consumptions')}
            className={`flex-1 text-sm px-4 py-3 transition-colors font-medium
              ${mode === 'consumptions'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500 bg-white dark:bg-gray-900'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-b-2 border-transparent'
              }`}
          >
            {t.tabConsumptions}
          </button>
        </div>

        {/* 列表头部 — 仅在事件/文章模式下显示 */}
        {mode !== 'profile' && mode !== 'goals' && mode !== 'consumptions' && (<>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{mode === 'events' ? t.eventList : t.postList}</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">{filteredCount}</span>
          </div>

          {/* 搜索 */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                       px-3 py-1.5 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />

          {/* 分类筛选（仅事件模式） */}
          {mode === 'events' && (
            <div className="flex gap-1 flex-wrap">
              {['全部', ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`text-[11px] px-2 py-0.5 rounded-full transition-colors
                    ${filterCategory === cat
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'bg-gray-200/50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* 新建按钮 */}
          <button
            onClick={newItem}
            className="w-full text-xs px-3 py-2 rounded-lg bg-green-600 text-white font-medium
                       hover:bg-green-700 transition-colors"
          >
            {mode === 'events' ? t.newEvent : t.newPost}
          </button>
        </div>

        {/* 列表内容 */}
        <div className="flex-1 overflow-y-auto">
          {filteredCount === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400 dark:text-gray-500">{t.emptyList}</div>
          ) : mode === 'events' ? (
            /* ======== 事件列表 ======== */
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredEvents.map((event) => {
                const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['其他'];
                return (
                  <div
                    key={event.slug}
                    onClick={() => selectEvent(event)}
                    className={`p-3 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800
                      ${selectedSlug === event.slug ? 'bg-green-50 dark:bg-green-950 border-l-2 border-green-500' : 'border-l-2 border-transparent'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${catColor}`}>
                        {event.category}
                      </span>
                      {event.draft && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                          {t.draftBadge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">{event.date}</span>
                      <span className="text-[11px] text-yellow-500">{'★'.repeat(event.importance)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ======== 文章列表 ======== */
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredPosts.map((post) => (
                <div
                  key={post.slug}
                  onClick={() => selectPost(post)}
                  className={`p-3 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800
                    ${selectedSlug === post.slug ? 'bg-green-50 dark:bg-green-950 border-l-2 border-green-500' : 'border-l-2 border-transparent'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {post.draft && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        {t.draftBadge}
                      </span>
                    )}
                    {post.tags.length > 0 && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {post.tags.slice(0, 2).map(tg => `#${tg}`).join(' ')}
                        {post.tags.length > 2 && ' …'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">{post.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>)}

        {/* 目标列表 */}
        {mode === 'goals' && (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">{t.tabGoals}</h2>
                <span className="text-xs text-gray-400 dark:text-gray-500">{goals.length}</span>
              </div>
              <button
                onClick={newGoal}
                className="w-full text-xs px-3 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
              >
                {t.goalNew}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {goals.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 dark:text-gray-500">{t.goalEmpty}</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {goals.map((goal) => {
                    const statusCls = goal.status === 'completed' ? 'badge-success' : goal.status === 'paused' ? 'badge-ghost' : 'badge-info';
                    const statusLabel = goal.status === 'completed' ? t.goalStatusCompleted : goal.status === 'paused' ? t.goalStatusPaused : t.goalStatusActive;
                    return (
                      <div
                        key={goal.id}
                        onClick={() => selectGoal(goal)}
                        className={`p-3 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800
                          ${selectedGoalId === goal.id ? 'bg-green-50 dark:bg-green-950 border-l-2 border-green-500' : 'border-l-2 border-transparent'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge badge-xs ${statusCls}`}>{statusLabel}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{goal.category === 'short' ? t.goalCategoryShort : t.goalCategoryLong}</span>
                        </div>
                        <p className="text-sm font-medium truncate">{goal.title}</p>
                        <div className="mt-1.5 w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${goal.status === 'completed' ? 'bg-green-500' : goal.status === 'paused' ? 'bg-gray-400' : 'bg-green-500'}`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 block text-right">{goal.progress}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* 清单列表 */}
        {mode === 'consumptions' && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-sm">{t.tabConsumptions}</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">{consumptions.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <button
                className="btn btn-sm btn-ghost w-full mb-2 text-green-600"
                onClick={resetConsumptionForm}
              >
                {t.consumptionNew}
              </button>
              {consumptions.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">{t.consumptionEmpty}</p>
              ) : (
                consumptions.map((c) => (
                  <button
                    key={c.id}
                    className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-xs transition-colors ${
                      consumptionId === c.id
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => selectConsumption(c.id)}
                  >
                    <div className="font-medium truncate">{c.title}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {t.consumptionTypeOptions[c.type]} · {'⭐'.repeat(c.rating)} · {t.consumptionStatusOptions[c.status]}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* 媒体列表 */}
        {mode === 'media' && (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">{t.tabMedia}</h2>
                <span className="text-xs text-gray-400 dark:text-gray-500">{media.length}</span>
              </div>
              <button
                onClick={() => { setSelectedMediaId(null); setMediaForm(EMPTY_MEDIA_FORM); }}
                className="w-full text-xs px-3 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
              >
                {t.mediaNew}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {media.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 dark:text-gray-500">{t.mediaEmpty}</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedMediaId(item.id);
                        setMediaForm({
                          title: item.title || '',
                          description: item.description || '',
                          album: item.album === '未分类' ? '' : item.album,
                        });
                      }}
                      className={`p-3 cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800
                        ${selectedMediaId === item.id ? 'bg-green-50 dark:bg-green-950 border-l-2 border-green-500' : 'border-l-2 border-transparent'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {item.fileType === 'image'
                            ? <img src={getFileUrl(item.url)} alt="" className="w-6 h-6 object-cover rounded" />
                            : <span className="text-base">{getIconForFile(item.filename, item.fileType)}</span>
                          }
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.title || item.filename}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{item.filename}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </aside>

      {/* ========== 右侧：编辑面板 ========== */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Tab 切换 */}
        {mode !== 'profile' && mode !== 'goals' && mode !== 'consumptions' && mode !== 'media' && (selectedSlug || (mode === 'events' ? !initialEvents.some((e) => e.slug === selectedSlug) : !initialPosts.some((p) => p.slug === selectedSlug))) ? (
          <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-4">
            <button
              onClick={() => setEditTab('edit')}
              className={`text-sm px-4 py-3 border-b-2 transition-colors
                ${editTab === 'edit'
                  ? 'border-green-500 text-green-600 dark:text-green-400 font-medium'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600'
                }`}
            >
              {t.editTab}
            </button>
            <button
              onClick={() => setEditTab('preview')}
              className={`text-sm px-4 py-3 border-b-2 transition-colors
                ${editTab === 'preview'
                  ? 'border-green-500 text-green-600 dark:text-green-400 font-medium'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600'
                }`}
            >
              {t.previewTab}
            </button>

            {/* 删除按钮 */}
            {selectedSlug && (
              <button
                onClick={() => {
                  if (mode === 'events') {
                    const ev = events.find((e) => e.slug === selectedSlug);
                    if (ev) setDeleteTarget(ev);
                  } else {
                    const p = posts.find((p) => p.slug === selectedSlug);
                    if (p) setDeleteTarget(p);
                  }
                }}
                className="ml-auto text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1"
              >
                🗑️
              </button>
            )}
          </div>
        ) : null}

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'media' ? (
            /* ======== 媒体编辑/上传 ======== */
            <div className="space-y-6 max-w-xl">
              {/* 上传区 */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => mediaFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${dragOver
                    ? 'border-green-400 bg-green-50 dark:bg-green-950'
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                  }`}
              >
                {uploading ? (
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    <span className="loading loading-spinner loading-sm mr-2" />
                    {uploadMsg}
                  </div>
                ) : (
                  <>
                    <div className="text-3xl mb-2">📎</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t.fileUpload}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.fileDrop}</p>
                  </>
                )}
                <input
                  ref={mediaFileInputRef}
                  type="file"
                  accept={ALL_EXTENSIONS.map((e) => `.${e}`).join(',')}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              {uploadMsg && !uploading && (
                <p className="text-xs text-red-400 -mt-4">{uploadMsg}</p>
              )}

              <hr className="border-gray-200 dark:border-gray-700" />

              {/* 编辑表单 */}
              {selectedMediaId ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedMediaId) return;
                    setMedia((prev) => {
                      const updated = prev.map((m) =>
                        m.id === selectedMediaId
                          ? { ...m, title: mediaForm.title, description: mediaForm.description, album: mediaForm.album || '未分类' }
                          : m
                      );
                      fetch('/api/write-media', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ media: updated }),
                      }).catch(() => {});
                      return updated;
                    });
                    setStatus('success');
                    setMessage('已保存');
                    setTimeout(() => setMessage(''), 2000);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium mb-1">{t.mediaTitle}</label>
                    <input
                      type="text"
                      value={mediaForm.title}
                      onChange={(e) => setMediaForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder={t.mediaTitlePlaceholder}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">{t.mediaDesc}</label>
                    <input
                      type="text"
                      value={mediaForm.description}
                      onChange={(e) => setMediaForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder={t.mediaDescPlaceholder}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">{t.mediaAlbum}</label>
                    <input
                      type="text"
                      value={mediaForm.album}
                      onChange={(e) => setMediaForm((p) => ({ ...p, album: e.target.value }))}
                      placeholder={t.mediaAlbumPlaceholder}
                      list="album-suggestions"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                    <datalist id="album-suggestions">
                      {Array.from(new Set(media.map((m) => m.album).filter(Boolean))).map((a) => (
                        <option key={a} value={a} />
                      ))}
                    </datalist>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedMediaId) return;
                        const item = media.find((m) => m.id === selectedMediaId);
                        if (!item) return;
                        if (!confirm(t.mediaDeleteConfirm.replace('{title}', item.title || item.filename))) return;
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
                      }}
                      className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-900 text-red-500 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      {t.deleteBtn}
                    </button>
                    {message && (
                      <span className={`text-xs ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message}</span>
                    )}
                  </div>
                </form>
              ) : (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  ← 从左侧选择媒体或上传新文件
                </div>
              )}
            </div>
          ) : mode === 'goals' ? (
            /* ======== 目标编辑表单 ======== */
            <form onSubmit={handleGoalSubmit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-medium mb-1">{t.goalTitle}</label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="如：完成人生时间线项目"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t.goalDesc}</label>
                <input
                  type="text"
                  value={goalForm.description}
                  onChange={(e) => setGoalForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.goalProgress}: {goalForm.progress}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goalForm.progress}
                    onChange={(e) => setGoalForm((p) => ({ ...p, progress: Number(e.target.value) }))}
                    className="w-full accent-green-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.goalCategory}</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm((p) => ({ ...p, category: e.target.value as 'short' | 'long' }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="short">{t.goalCategoryShort}</option>
                    <option value="long">{t.goalCategoryLong}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t.goalStatus}</label>
                <select
                  value={goalForm.status}
                  onChange={(e) => setGoalForm((p) => ({ ...p, status: e.target.value as 'active' | 'completed' | 'paused' }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  <option value="active">{t.goalStatusActive}</option>
                  <option value="completed">{t.goalStatusCompleted}</option>
                  <option value="paused">{t.goalStatusPaused}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t.goalRelated}</label>
                <input
                  type="text"
                  value={goalForm.relatedEvents}
                  onChange={(e) => setGoalForm((p) => ({ ...p, relatedEvents: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              {/* 提交 */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={status === 'saving'}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'saving' ? t.savingBtn : t.profileSave}
                </button>

                {selectedGoalId && (
                  <button
                    type="button"
                    onClick={() => {
                      const g = goals.find((g) => g.id === selectedGoalId);
                      if (g && confirm(t.goalDeleteConfirm.replace('{title}', g.title))) {
                        handleGoalDelete();
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1"
                  >
                    🗑️ {t.deleteBtn}
                  </button>
                )}

                {message && (
                  <span className={`text-xs ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {message}
                  </span>
                )}
              </div>
            </form>
          ) : mode === 'consumptions' ? (
            <form onSubmit={handleConsumptionSubmit} className="space-y-4 max-w-xl">
              <h3 className="font-semibold text-sm">
                {consumptionId ? `编辑: ${consumptionTitle}` : t.consumptionNew}
              </h3>

              <div className="flex gap-4">
                <label className="form-control flex-1">
                  <div className="label"><span className="label-text text-xs">{t.consumptionTitle}</span></div>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    value={consumptionTitle}
                    onInput={(e) => setConsumptionTitle(e.currentTarget.value)}
                    required
                  />
                </label>
                <label className="form-control w-32">
                  <div className="label"><span className="label-text text-xs">{t.consumptionDate}</span></div>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    placeholder="2024-06"
                    value={consumptionDate}
                    onInput={(e) => setConsumptionDate(e.currentTarget.value)}
                  />
                </label>
              </div>

              <div className="flex gap-4">
                <label className="form-control flex-1">
                  <div className="label"><span className="label-text text-xs">{t.consumptionAuthor}</span></div>
                  <input
                    type="text"
                    className="input input-bordered input-sm"
                    placeholder="刘慈欣 / 克里斯托弗·诺兰"
                    value={consumptionAuthor}
                    onInput={(e) => setConsumptionAuthor(e.currentTarget.value)}
                  />
                </label>
                <label className="form-control w-32">
                  <div className="label"><span className="label-text text-xs">{t.consumptionYear}</span></div>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    className="input input-bordered input-sm"
                    placeholder="2014"
                    value={consumptionYear}
                    onInput={(e) => setConsumptionYear(e.currentTarget.value)}
                  />
                </label>
              </div>

              <div className="flex gap-4">
                <label className="form-control flex-1">
                  <div className="label"><span className="label-text text-xs">{t.consumptionType}</span></div>
                  <select className="select select-bordered select-sm" value={consumptionType} onChange={(e) => setConsumptionType(e.currentTarget.value as any)}>
                    {Object.entries(t.consumptionTypeOptions).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>
                <label className="form-control flex-1">
                  <div className="label"><span className="label-text text-xs">{t.consumptionStatus}</span></div>
                  <select className="select select-bordered select-sm" value={consumptionStatus} onChange={(e) => setConsumptionStatus(e.currentTarget.value as any)}>
                    {Object.entries(t.consumptionStatusOptions).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>
                <label className="form-control w-24">
                  <div className="label"><span className="label-text text-xs">{t.consumptionRating}</span></div>
                  <select className="select select-bordered select-sm" value={consumptionRating} onChange={(e) => setConsumptionRating(Number(e.currentTarget.value))}>
                    {[1,2,3,4,5].map((n) => (<option key={n} value={n}>{'⭐'.repeat(n)}</option>))}
                  </select>
                </label>
              </div>

              <label className="form-control">
                <div className="label">
                  <span className="label-text text-xs">{t.consumptionCover}</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-primary"
                    onClick={handleFetchMetadata}
                    disabled={fetchingMeta}
                  >
                    {fetchingMeta ? t.consumptionFetching : t.consumptionAutoFetch}
                  </button>
                </div>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="https://..."
                  value={consumptionCover}
                  onInput={(e) => setConsumptionCover(e.currentTarget.value)}
                />
                {
                  metadataCandidates.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="text-[11px] text-gray-400">{t.consumptionCandidates}</div>
                      {metadataCandidates.map((c, idx) => (
                        <button
                          key={`${c.source}-${c.sourceId}-${idx}`}
                          type="button"
                          onClick={() => applyMetadataCandidate(c)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-colors text-left"
                        >
                          {
                            c.cover ? (
                              <img
                                src={`/api/img-proxy?url=${encodeURIComponent(c.cover)}`}
                                alt={c.title}
                                className="w-8 h-11 object-cover rounded shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-11 rounded bg-gray-100 dark:bg-gray-800 shrink-0" />
                            )
                          }
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{c.title}</div>
                            <div className="text-[10px] text-gray-400 truncate">
                              {[c.year, c.author, c.desc].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                }
                {metadataHint && (
                  <p className="mt-1.5 text-[11px] text-gray-400">{metadataHint}</p>
                )}
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text text-xs">{t.consumptionReview}</span></div>
                <textarea
                  className="textarea textarea-bordered text-sm h-32"
                  placeholder="Markdown 格式，支持标题、引用、图片等..."
                  value={consumptionReview}
                  onInput={(e) => setConsumptionReview(e.currentTarget.value)}
                />
              </label>

              <label className="form-control">
                <div className="label"><span className="label-text text-xs">{t.consumptionTags}</span></div>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  placeholder="科幻, 刘慈欣"
                  value={consumptionTags}
                  onInput={(e) => setConsumptionTags(e.currentTarget.value)}
                />
              </label>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-sm btn-primary" disabled={status === 'saving'}>
                  {status === 'saving' ? t.savingBtn : t.submitBtn}
                </button>
                {consumptionId && (
                  <button type="button" className="btn btn-sm btn-error btn-outline" onClick={() => handleConsumptionDelete(consumptionId)}>
                    {t.deleteBtn}
                  </button>
                )}
              </div>
            </form>
          ) : mode === 'profile' ? (
            /* ======== 档案编辑表单 ======== */
            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.profileName}</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.profileTagline}</label>
                  <input
                    type="text"
                    value={profileForm.tagline}
                    onChange={(e) => setProfileForm((p) => ({ ...p, tagline: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.profileAvatar}</label>
                  <input
                    type="text"
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm((p) => ({ ...p, avatar: e.target.value }))}
                    placeholder="/images/avatar.jpg"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.profileBirthDate}</label>
                  <input
                    type="date"
                    value={profileForm.birthDate}
                    onChange={(e) => setProfileForm((p) => ({ ...p, birthDate: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t.profileSkills}</label>
                <input
                  type="text"
                  value={profileForm.skills}
                  onChange={(e) => setProfileForm((p) => ({ ...p, skills: e.target.value }))}
                  placeholder={t.tagsPlaceholder}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t.profileShortGoal}</label>
                <input
                  type="text"
                  value={profileForm.shortGoal}
                  onChange={(e) => setProfileForm((p) => ({ ...p, shortGoal: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">{t.profileLongGoal}</label>
                <input
                  type="text"
                  value={profileForm.longGoal}
                  onChange={(e) => setProfileForm((p) => ({ ...p, longGoal: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              {/* 提交 */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={status === 'saving'}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'saving' ? t.savingBtn : t.profileSave}
                </button>

                {message && (
                  <span className={`text-xs ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {message}
                  </span>
                )}
              </div>
            </form>
          ) : !selectedSlug && !form.title ? (
            /* 空状态 */
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
              {t.noSelection}
            </div>
          ) : editTab === 'edit' ? (
            /* ======== 编辑表单 ======== */
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
              {/* 日期 & 标题 同行 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.dateLabel}</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => update('date', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                               px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.titleLabel}</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder={t.titlePlaceholder}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                               px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-2">{t.dateHint}</p>

              {/* 分类 & 重要性 同行（仅事件模式） */}
              {mode === 'events' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">{t.categoryLabel}</label>
                    <div className="flex gap-1 flex-wrap">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => update('category', cat)}
                          className={`text-[11px] px-2 py-1 rounded-full transition-colors border
                            ${form.category === cat
                              ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                              : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400'
                            }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">{t.importanceLabel}: {form.importance}/5</label>
                    <input
                      type="range" min="1" max="5" value={form.importance}
                      onChange={(e) => update('importance', parseInt(e.target.value, 10))}
                      className="w-full accent-green-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                      <span>{t.importanceMin}</span>
                      <span>{t.importanceMax}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 地点 & 标签 同行（仅事件模式显示地点） */}
              <div className={`grid ${mode === 'events' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {mode === 'events' && (
                  <div>
                    <label className="block text-xs font-medium mb-1">{t.locationLabel}</label>
                    <input
                      type="text" value={form.location}
                      onChange={(e) => update('location', e.target.value)}
                      placeholder={t.locationPlaceholder}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                                 px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1">{t.tagsLabel}</label>
                  <input
                    type="text" value={form.tags}
                    onChange={(e) => update('tags', e.target.value)}
                    placeholder={t.tagsPlaceholder}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                               px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* 草稿开关 */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={form.draft}
                  onChange={(e) => update('draft', e.target.checked)}
                  className="rounded accent-green-500"
                />
                {t.draftToggle}
              </label>

              {/* 正文 */}
              <div>
                <label className="block text-xs font-medium mb-1">{t.contentLabel}</label>

                {/* 插入媒体按钮 */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700
                               text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                               transition-colors inline-flex items-center gap-1"
                  >
                    <span>🖼️</span>
                    {t.insertMedia}
                  </button>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{t.insertMediaHint}</span>
                </div>

                <textarea
                  ref={textareaRef}
                  value={form.content}
                  onChange={(e) => update('content', e.target.value)}
                  rows={10}
                  placeholder={t.contentPlaceholder}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                             px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent
                             outline-none resize-y"
                />
              </div>

              {/* 提交 */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={status === 'saving'}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium
                             hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === 'saving' ? t.savingBtn : t.submitBtn}
                </button>

                {message && (
                  <span className={`text-xs ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {message}
                  </span>
                )}
              </div>
            </form>
          ) : (
            /* ======== 预览 ======== */
            <div className="max-w-xl">
              {/* 元信息预览 */}
              <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {mode === 'events' ? (
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{form.category}</span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">{t.articleBadge}</span>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{form.date}</span>
                  {mode === 'events' && form.location && <span className="text-sm text-gray-400 dark:text-gray-500">📍 {form.location}</span>}
                  {mode === 'events' && (
                    <span className="text-yellow-500 text-sm">{'★'.repeat(form.importance)}{'☆'.repeat(5 - form.importance)}</span>
                  )}
                  {form.draft && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                      {t.draftBadge}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold">{form.title || '（无标题）'}</h2>
                {form.tags && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {form.tags.split(/[,，]/).map((tg) => tg.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Markdown 渲染 */}
              <div
                className="prose-sm dark:prose-invert text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
              />
            </div>
          )}
        </div>
      </main>

      {/* ========== 删除确认弹窗 ========== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">{t.deleteTitle}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-500 mb-4">
              {t.deleteConfirm.replace('{title}', deleteTarget.title)}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t.cancelBtn}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                {t.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== 媒体选择器弹窗 ========== */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
             onClick={() => { setShowMediaPicker(false); setMediaPickerFilter(''); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl max-w-lg w-full max-h-[70vh] flex flex-col"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t.insertMediaTitle}</h3>
              <button onClick={() => { setShowMediaPicker(false); setMediaPickerFilter(''); }}
                      className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {/* 搜索 */}
            <input
              type="text"
              value={mediaPickerFilter}
              onChange={(e) => setMediaPickerFilter(e.target.value)}
              placeholder={t.search}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                         px-3 py-1.5 text-xs mb-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />

            {/* 媒体列表 */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {media
                .filter((m) => {
                  if (!mediaPickerFilter) return true;
                  const q = mediaPickerFilter.toLowerCase();
                  return m.title.toLowerCase().includes(q) || m.filename.toLowerCase().includes(q);
                })
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const isImage = item.fileType === 'image';
                      const linkTitle = item.title || item.filename;
                      const md = isImage
                        ? `![${linkTitle}](${getFileUrl(item.url)})`
                        : `[${linkTitle}](${getFileUrl(item.url)})`;
                      const ta = textareaRef.current;
                      if (ta) {
                        const start = ta.selectionStart;
                        const end = ta.selectionEnd;
                        const before = form.content.slice(0, start);
                        const after = form.content.slice(end);
                        const newContent = before + (before && !before.endsWith('\n') ? '\n' : '') + md + '\n' + after;
                        update('content', newContent);
                        setTimeout(() => {
                          ta.focus();
                          ta.selectionStart = ta.selectionEnd = start + md.length + (before && !before.endsWith('\n') ? 1 : 0) + 1;
                        }, 0);
                      }
                      setShowMediaPicker(false);
                      setMediaPickerFilter('');
                    }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg
                               hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-xl shrink-0">
                      {item.fileType === 'image'
                        ? <img src={getFileUrl(item.url)} alt="" className="w-8 h-8 object-cover rounded" />
                        : <span>{getIconForFile(item.filename, item.fileType)}</span>
                      }
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.title || item.filename}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{item.filename}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0 ml-auto">
                      {item.fileType}
                    </span>
                  </button>
                ))}
              {media.filter((m) => {
                if (!mediaPickerFilter) return true;
                const q = mediaPickerFilter.toLowerCase();
                return m.title.toLowerCase().includes(q) || m.filename.toLowerCase().includes(q);
              }).length === 0 && (
                <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
                  {media.length === 0 ? t.insertMediaEmpty : t.emptyList}
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 text-center">
              {t.insertMediaFooter}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
