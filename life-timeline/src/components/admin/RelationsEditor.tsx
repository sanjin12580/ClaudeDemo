// ============================================================
// RelationsEditor — 关系图谱编辑器（shadcn 表单）
// 人物增删改 + 连线选择 + 共同经历动态行
// ============================================================

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '@/lib/utils';
import type { Person } from '../../lib/types';
import type { PersonFormShape, StoryRow } from './shapes';
import type { zh } from '../../lib/i18n';

/** 关系类型枚举（与图谱渲染保持一致） */
const RELATION_TYPES = [
  '家人',
  '爱人',
  '挚友',
  '导师',
  '同事',
  '同学',
  '萍水相逢',
  '观众',
  '其他',
] as const;

interface Props {
  people: Person[];
  selectedId: string | null;
  form: PersonFormShape;
  status: 'idle' | 'saving' | 'success' | 'error';
  message: string;
  t: typeof zh['admin'];
  /** Select 弹层挂载容器（管理端根节点，继承主题令牌） */
  container: HTMLElement | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: () => void;
  onField: <K extends keyof PersonFormShape>(
    field: K,
    value: PersonFormShape[K],
  ) => void;
  onStoriesChange: (stories: StoryRow[]) => void;
  onToggleLink: (id: string) => void;
  onSubmit: () => void;
}

export default function RelationsEditor({
  people,
  selectedId,
  form,
  status,
  message,
  t,
  container,
  onSelect,
  onNew,
  onDelete,
  onField,
  onStoriesChange,
  onToggleLink,
  onSubmit,
}: Props) {
  const selected = people.find((p) => p.id === selectedId);

  const updateStory = (index: number, field: keyof StoryRow, value: string) => {
    const next = form.stories.map((s, i) =>
      i === index ? { ...s, [field]: value } : s,
    );
    onStoriesChange(next);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 左侧人物列表 */}
      <div className="w-56 shrink-0 border-r border-border/60 flex flex-col">
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/60">
          {t.relationList}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {people.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-6 text-center">
              {t.relationEmpty}
            </p>
          )}
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-sm transition-colors',
                selectedId === p.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-accent',
              )}
            >
              <span className="w-6 h-6 rounded-full grid place-items-center text-xs bg-muted shrink-0 overflow-hidden">
                {p.avatar ? (
                  <img src={p.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span aria-hidden="true">{p.name.charAt(0)}</span>
                )}
              </span>
              <span className="flex-1 min-w-0 truncate">{p.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {p.relation}
              </span>
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onNew}
          >
            {t.relationAddPerson}
          </Button>
        </div>
      </div>

      {/* 右侧表单 */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <p className="text-3xl mb-3" aria-hidden="true">
              🕸️
            </p>
            <p className="text-sm">{t.relationSelectHint}</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            className="space-y-4 max-w-xl"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t.relationName}</Label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => onField('name', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t.relationType}</Label>
                <Select
                  value={form.relation}
                  onValueChange={(v) => onField('relation', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent container={container}>
                    {RELATION_TYPES.map((rel) => (
                      <SelectItem key={rel} value={rel}>
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                {t.relationImportance}：{'★'.repeat(form.importance)}
                {'☆'.repeat(5 - form.importance)}
              </Label>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[form.importance]}
                onValueChange={(v) => onField('importance', v[0])}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t.relationAvatar}</Label>
              <Input
                type="text"
                value={form.avatar}
                onChange={(e) => onField('avatar', e.target.value)}
                placeholder="/images/people/xxx.jpg"
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t.relationDescription}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => onField('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* 关联人物（多选 chips） */}
            <div className="space-y-2">
              <Label>{t.relationLinks}</Label>
              {people.filter((p) => p.id !== form.id).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t.relationEmpty}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {people
                    .filter((p) => p.id !== form.id)
                    .map((p) => {
                      const active = form.links.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onToggleLink(p.id)}
                          className={cn(
                            'text-xs px-2.5 py-1 rounded-full border transition-colors',
                            active
                              ? 'bg-primary/15 border-primary/40 text-primary font-medium'
                              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                          )}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            {/* 共同经历动态行 */}
            <div className="space-y-2">
              <Label>{t.relationStories}</Label>
              {form.stories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t.relationEmpty}
                </p>
              )}
              <div className="space-y-2">
                {form.stories.map((story, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={story.date}
                      onChange={(e) => updateStory(i, 'date', e.target.value)}
                      className="w-36 shrink-0"
                      aria-label={t.relationStoryDate}
                    />
                    <Input
                      type="text"
                      value={story.event}
                      onChange={(e) => updateStory(i, 'event', e.target.value)}
                      placeholder={t.relationStoryEvent}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="删除"
                      onClick={() =>
                        onStoriesChange(
                          form.stories.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onStoriesChange([...form.stories, { date: '', event: '' }])
                }
              >
                {t.relationAddStory}
              </Button>
            </div>

            {/* 操作栏 */}
            <div className="flex items-center gap-3 pt-4">
              <Button type="submit" disabled={status === 'saving'}>
                {status === 'saving' ? t.savingBtn : t.relationSave}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
              >
                {t.relationDeletePerson}
              </Button>
              {message && (
                <span
                  className={cn(
                    'text-xs',
                    status === 'success'
                      ? 'text-green-600'
                      : 'text-destructive',
                  )}
                >
                  {message}
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
