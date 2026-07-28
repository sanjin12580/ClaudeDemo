import { useState } from 'react';
import type { Category } from '../lib/types';
import { useI18n } from '../lib/i18n';

const CATEGORIES: Category[] = ['教育', '工作', '旅行', '健康', '关系', '项目', '其他'];

interface FormData {
  date: string;
  title: string;
  category: Category;
  tags: string;
  importance: number;
  location: string;
  content: string;
}

const EMPTY_FORM: FormData = {
  date: '',
  title: '',
  category: '其他',
  tags: '',
  importance: 3,
  location: '',
  content: '',
};

export default function AdminForm() {
  const { admin: t } = useI18n();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function update(field: keyof FormData, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

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
      const resp = await fetch('/api/write-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          title: form.title,
          category: form.category,
          tags: form.tags
            .split(/[,，]/)
            .map((tg) => tg.trim())
            .filter(Boolean),
          importance: form.importance,
          location: form.location || undefined,
          content: form.content,
        }),
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        setStatus('success');
        setMessage(t.saved(data.path));
        setForm(EMPTY_FORM);
      } else {
        setStatus('error');
        setMessage(data.error || t.saveFailed);
      }
    } catch (err) {
      setStatus('error');
      setMessage(t.networkError(err instanceof Error ? err.message : t.unknownError));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* 日期 */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.dateLabel}</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => update('date', e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">{t.dateHint}</p>
      </div>

      {/* 标题 */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.titleLabel}</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder={t.titlePlaceholder}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {/* 分类 */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.categoryLabel}</label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => update('category', cat)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors border
                ${form.category === cat
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                  : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-500'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 重要性 */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.importanceLabel}: {form.importance}/5</label>
        <input
          type="range"
          min="1"
          max="5"
          value={form.importance}
          onChange={(e) => update('importance', parseInt(e.target.value, 10))}
          className="w-full accent-green-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{t.importanceMin}</span>
          <span>{t.importanceMax}</span>
        </div>
      </div>

      {/* 地点 */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.locationLabel}</label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
          placeholder={t.locationPlaceholder}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {/* 标签 */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.tagsLabel}</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => update('tags', e.target.value)}
          placeholder={t.tagsPlaceholder}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {/* 正文 */}
      <div>
        <label className="block text-sm font-medium mb-1">{t.contentLabel}</label>
        <textarea
          value={form.content}
          onChange={(e) => update('content', e.target.value)}
          rows={6}
          placeholder={t.contentPlaceholder}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-y"
        />
      </div>

      {/* 提交按钮 */}
      <button
        type="submit"
        disabled={status === 'saving'}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium
                   hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'saving' ? t.savingBtn : t.submitBtn}
      </button>

      {/* 状态消息 */}
      {message && (
        <div
          className={`text-sm px-4 py-3 rounded-lg
            ${status === 'success' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' : ''}
            ${status === 'error' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' : ''}`}
        >
          {message}
        </div>
      )}
    </form>
  );
}
