import { useState, useMemo, useCallback, useRef } from 'react';
import type { EventMeta, PostMeta, Category } from '../lib/types';
import { CATEGORY_COLORS } from '../lib/types';
import { useI18n } from '../lib/i18n';

const CATEGORIES: Category[] = ['教育', '工作', '旅行', '健康', '关系', '项目', '其他'];

type AdminMode = 'events' | 'posts';

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
}

// ============================================================
// 轻量 Markdown 渲染（不引入外部库）
// ============================================================
function renderMarkdown(text: string): string {
  if (!text) return '<p class="text-gray-400 italic">（空内容）</p>';
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
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-green-400 pl-3 italic text-gray-500 dark:text-gray-400 my-2">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^---$/gm, '<hr class="my-4 border-gray-200 dark:border-gray-700" />')
    .replace(/\n\n+/g, '</p><p class="mb-2 leading-relaxed">');

  return `<p class="mb-2 leading-relaxed">${html}</p>`;
}

// ============================================================
// 主组件
// ============================================================
export default function AdminPanel({ events: initialEvents, posts: initialPosts }: Props) {
  const { admin: t } = useI18n();

  // 模式切换
  const [mode, setMode] = useState<AdminMode>('events');

  // 事件列表
  const [events, setEvents] = useState<EventMeta[]>(initialEvents);
  // 文章列表
  const [posts, setPosts] = useState<PostMeta[]>(initialPosts);

  // 列表筛选
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');

  // 编辑状态
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editTab, setEditTab] = useState<'edit' | 'preview'>('edit');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<EventMeta | PostMeta | null>(null);

  // 图片上传
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ========== 图片上传 ==========
  async function handleUpload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setUploadMsg(t.imageMaxSize);
      return;
    }
    setUploading(true);
    setUploadMsg(t.imageUploading);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const resp = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, data: dataUrl }),
      });
      const result = await resp.json();
      if (resp.ok && result.success) {
        const md = `![${file.name.replace(/\.[^.]+$/, '')}](${result.url})`;
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
        setUploadMsg('');
        setUploading(false);
      } else {
        setUploadMsg(result.error || t.imageFailed);
        setUploading(false);
      }
    } catch (err) {
      setUploadMsg(t.imageFailed);
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleUpload(file);
    }
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
    setForm(EMPTY_FORM);
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
  async function handleSubmit(e: React.FormEvent) {
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

  // ========== 删除 ==========
  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const apiPath = mode === 'events' ? '/api/delete-event' : '/api/delete-post';
      const filePath = mode === 'events'
        ? `src/content/events/${deleteTarget.date.slice(0, 4)}/${deleteTarget.slug}.md`
        : `src/content/blog/${deleteTarget.slug}.md`;

      const resp = await fetch(apiPath, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (mode === 'events') {
          setEvents((prev) => prev.filter((e) => e.slug !== deleteTarget.slug));
        } else {
          setPosts((prev) => prev.filter((p) => p.slug !== deleteTarget.slug));
        }
        if (selectedSlug === deleteTarget.slug) newItem();
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
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-b-2 border-transparent'
              }`}
          >
            {t.tabEvents}
          </button>
          <button
            onClick={() => switchMode('posts')}
            className={`flex-1 text-sm px-4 py-3 transition-colors font-medium
              ${mode === 'posts'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-500 bg-white dark:bg-gray-900'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-b-2 border-transparent'
              }`}
          >
            {t.tabPosts}
          </button>
        </div>

        {/* 列表头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{mode === 'events' ? t.eventList : t.postList}</h2>
            <span className="text-xs text-gray-400">{filteredCount}</span>
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
                      : 'bg-gray-200/50 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
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
            <div className="text-center py-12 text-xs text-gray-400">{t.emptyList}</div>
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
                      <span className="text-[11px] text-gray-400 font-mono">{event.date}</span>
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
                      <span className="text-[10px] text-gray-400">
                        {post.tags.slice(0, 2).map(tg => `#${tg}`).join(' ')}
                        {post.tags.length > 2 && ' …'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400 font-mono">{post.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ========== 右侧：编辑面板 ========== */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Tab 切换 */}
        {selectedSlug || (mode === 'events' ? !initialEvents.some((e) => e.slug === selectedSlug) : !initialPosts.some((p) => p.slug === selectedSlug)) ? (
          <div className="flex items-center border-b border-gray-200 dark:border-gray-800 px-4">
            <button
              onClick={() => setEditTab('edit')}
              className={`text-sm px-4 py-3 border-b-2 transition-colors
                ${editTab === 'edit'
                  ? 'border-green-500 text-green-600 dark:text-green-400 font-medium'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              {t.editTab}
            </button>
            <button
              onClick={() => setEditTab('preview')}
              className={`text-sm px-4 py-3 border-b-2 transition-colors
                ${editTab === 'preview'
                  ? 'border-green-500 text-green-600 dark:text-green-400 font-medium'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
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
          {!selectedSlug && !form.title ? (
            /* 空状态 */
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
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

              <p className="text-[11px] text-gray-400 -mt-2">{t.dateHint}</p>

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
                              : 'border-gray-300 dark:border-gray-700 text-gray-500 hover:border-gray-400'
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
                    <div className="flex justify-between text-[10px] text-gray-400">
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
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500">
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

                {/* 图片上传区域 */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mb-2 border-2 border-dashed rounded-lg px-4 py-3 text-center cursor-pointer transition-colors
                    ${dragOver
                      ? 'border-green-400 bg-green-50 dark:bg-green-950'
                      : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {uploading ? (
                    <span className="text-xs text-gray-500">{uploadMsg}</span>
                  ) : uploadMsg ? (
                    <span className="text-xs text-red-500">{uploadMsg}</span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {t.imageUpload} — {t.imageDrop}
                    </span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
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
                  <span className="text-sm text-gray-500 font-mono">{form.date}</span>
                  {mode === 'events' && form.location && <span className="text-sm text-gray-400">📍 {form.location}</span>}
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
                      <span key={tag} className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">#{tag}</span>
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
    </div>
  );
}
