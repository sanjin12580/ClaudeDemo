// ============================================================
// EventPostEditor — 事件 / 文章编辑器（shadcn 表单 + 富文本工具栏 + 预览）
// ============================================================

import { Trash2 } from 'lucide-react';
import MarkdownToolbar from '../MarkdownToolbar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import TagInput from './TagInput';
import { renderMarkdown } from './renderMarkdown';
import { cn } from '@/lib/utils';
import type { EventPostForm } from './shapes';
import type { Category } from '../../lib/types';
import type { zh } from '../../lib/i18n';

const CATEGORIES: Category[] = ['教育', '工作', '旅行', '健康', '关系', '项目', '其他'];

interface Props {
  mode: 'events' | 'posts';
  form: EventPostForm;
  editTab: 'edit' | 'preview';
  status: 'idle' | 'saving' | 'success' | 'error';
  message: string;
  selectedSlug: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  t: typeof zh['admin'];
  onUpdate: (field: keyof EventPostForm, value: string | number | boolean) => void;
  onTabChange: (tab: 'edit' | 'preview') => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onInsert: (template: string) => void;
  onPickImage: () => void;
  onUploadImage: () => void;
  onDirty: () => void;
}

export default function EventPostEditor({
  mode,
  form,
  editTab,
  status,
  message,
  selectedSlug,
  textareaRef,
  t,
  onUpdate,
  onTabChange,
  onSubmit,
  onDelete,
  onInsert,
  onPickImage,
  onUploadImage,
  onDirty,
}: Props) {
  return (
    <>
      <div className="flex items-center border-b border-border/60 px-4">
        <Tabs value={editTab} onValueChange={(v) => onTabChange(v as 'edit' | 'preview')}>
          <TabsList className="my-2">
            <TabsTrigger value="edit">{t.editTab}</TabsTrigger>
            <TabsTrigger value="preview">{t.previewTab}</TabsTrigger>
          </TabsList>
        </Tabs>
        {selectedSlug && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-destructive hover:text-destructive"
            title={t.deleteBtn}
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {editTab === 'edit' ? (
          <form onChange={onDirty} onSubmit={onSubmit} className="space-y-4 max-w-xl">
            {/* 日期 & 标题 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t.dateLabel}</Label>
                <Input type="date" value={form.date} onChange={(e) => onUpdate('date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t.titleLabel}</Label>
                <Input
                  type="text"
                  value={form.title}
                  onChange={(e) => onUpdate('title', e.target.value)}
                  placeholder={t.titlePlaceholder}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-2">{t.dateHint}</p>

            {/* 分类 & 重要性（仅事件） */}
            {mode === 'events' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t.categoryLabel}</Label>
                  <div className="flex gap-1 flex-wrap pt-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => onUpdate('category', cat)}
                        className={cn(
                          'text-[11px] px-2 py-1 rounded-full transition-colors border',
                          form.category === cat
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border text-muted-foreground hover:border-ring'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {t.importanceLabel}: {form.importance}/5
                  </Label>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={[form.importance]}
                    onValueChange={(v) => onUpdate('importance', v[0])}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{t.importanceMin}</span>
                    <span>{t.importanceMax}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 地点 & 标签 */}
            <div className={`grid ${mode === 'events' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
              {mode === 'events' && (
                <div className="space-y-1.5">
                  <Label>{t.locationLabel}</Label>
                  <Input
                    type="text"
                    value={form.location}
                    onChange={(e) => onUpdate('location', e.target.value)}
                    placeholder={t.locationPlaceholder}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>{t.tagsLabel}</Label>
                <TagInput value={form.tags} onChange={(v) => onUpdate('tags', v)} placeholder={t.tagsPlaceholder} />
              </div>
            </div>

            {/* 草稿开关 */}
            <div className="flex items-center gap-2">
              <Switch
                id="draft-switch"
                checked={form.draft}
                onCheckedChange={(checked) => onUpdate('draft', checked)}
              />
              <Label htmlFor="draft-switch" className="text-xs text-muted-foreground cursor-pointer">
                {t.draftToggle}
              </Label>
            </div>

            {/* 正文 */}
            <div className="space-y-1.5">
              <Label>{t.contentLabel}</Label>
              <div className="rounded-md border border-input overflow-hidden bg-background">
                <MarkdownToolbar
                  onInsert={onInsert}
                  onPickImage={onPickImage}
                  onUploadImage={onUploadImage}
                />
                <Textarea
                  ref={textareaRef}
                  value={form.content}
                  onChange={(e) => onUpdate('content', e.target.value)}
                  rows={14}
                  placeholder={t.contentPlaceholder}
                  className="rounded-none border-0 font-mono text-sm resize-y shadow-none focus-visible:ring-0"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{t.insertMediaHint}</p>
            </div>

            {/* 提交 */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={status === 'saving'}>
                {status === 'saving' ? t.savingBtn : t.submitBtn}
              </Button>
              {message && (
                <span className={cn('text-xs', status === 'success' ? 'text-green-600' : 'text-destructive')}>
                  {message}
                </span>
              )}
            </div>
          </form>
        ) : (
          <div className="max-w-xl">
            {/* 元信息预览 */}
            <div className="mb-6 p-4 rounded-xl bg-muted/60 border border-border/60">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                {mode === 'events' ? (
                  <Badge variant="secondary">{form.category}</Badge>
                ) : (
                  <Badge>{t.articleBadge}</Badge>
                )}
                <span className="text-sm text-muted-foreground font-mono">{form.date}</span>
                {mode === 'events' && form.location && (
                  <span className="text-sm text-muted-foreground">📍 {form.location}</span>
                )}
                {mode === 'events' && (
                  <span className="text-yellow-500 text-sm">
                    {'★'.repeat(form.importance)}
                    {'☆'.repeat(5 - form.importance)}
                  </span>
                )}
                {form.draft && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                    {t.draftBadge}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold">{form.title || t.noTitle}</h2>
              {form.tags && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {form.tags
                    .split(/[,，]/)
                    .map((tg) => tg.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Markdown 渲染 */}
            <div
              className="prose-sm dark:prose-invert text-foreground/80"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content, t.emptyContent) }}
            />
          </div>
        )}
      </div>
    </>
  );
}
