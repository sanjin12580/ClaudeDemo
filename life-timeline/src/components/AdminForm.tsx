import { useState } from 'react';
import type { Category } from '../lib/types';

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
      setMessage('请填写日期和标题');
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
            .map((t) => t.trim())
            .filter(Boolean),
          importance: form.importance,
          location: form.location || undefined,
          content: form.content,
        }),
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        setStatus('success');
        setMessage(`事件已保存: ${data.path}`);
        setForm(EMPTY_FORM);
      } else {
        setStatus('error');
        setMessage(data.error || '保存失败');
      }
    } catch (err) {
      setStatus('error');
      setMessage(`网络错误: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* 日期 */}
      <div>
        <label className="block text-sm font-medium mb-1">日期 *</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => update('date', e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">精确到日，也可手动输入如 2024-03（只到月）</p>
      </div>

      {/* 标题 */}
      <div>
        <label className="block text-sm font-medium mb-1">标题 *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="如：入职新公司、武功山徒步"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {/* 分类 */}
      <div>
        <label className="block text-sm font-medium mb-1">分类</label>
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
        <label className="block text-sm font-medium mb-1">重要性: {form.importance}/5</label>
        <input
          type="range"
          min="1"
          max="5"
          value={form.importance}
          onChange={(e) => update('importance', parseInt(e.target.value, 10))}
          className="w-full accent-green-500"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>1（轻微）</span>
          <span>5（里程碑）</span>
        </div>
      </div>

      {/* 地点 */}
      <div>
        <label className="block text-sm font-medium mb-1">地点</label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => update('location', e.target.value)}
          placeholder="如：深圳、武功山"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {/* 标签 */}
      <div>
        <label className="block text-sm font-medium mb-1">标签</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => update('tags', e.target.value)}
          placeholder="多个标签用逗号分隔，如：前端, React, 转折点"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900
                     px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {/* 正文 */}
      <div>
        <label className="block text-sm font-medium mb-1">正文</label>
        <textarea
          value={form.content}
          onChange={(e) => update('content', e.target.value)}
          rows={6}
          placeholder="Markdown 格式，可嵌入图片链接和视频链接..."
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
        {status === 'saving' ? '保存中...' : '保存事件'}
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
