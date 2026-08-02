// ============================================================
// GoalEditor — 目标编辑器（shadcn 表单）
// ============================================================

import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import type { GoalFormShape } from './shapes';
import type { zh } from '../../lib/i18n';

interface Props {
  form: GoalFormShape;
  selectedId: string | null;
  status: 'idle' | 'saving' | 'success' | 'error';
  message: string;
  t: typeof zh['admin'];
  onField: <K extends keyof GoalFormShape>(field: K, value: GoalFormShape[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
}

export default function GoalEditor({
  form,
  selectedId,
  status,
  message,
  t,
  onField,
  onSubmit,
  onDelete,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>{t.goalTitle}</Label>
          <Input
            type="text"
            value={form.title}
            onChange={(e) => onField('title', e.target.value)}
            placeholder="如：完成人生时间线项目"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t.goalDesc}</Label>
          <Input
            type="text"
            value={form.description}
            onChange={(e) => onField('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>
              {t.goalProgress}: {form.progress}%
            </Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[form.progress]}
              onValueChange={(v) => onField('progress', v[0])}
              className="mt-2"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.goalCategory}</Label>
            <Select value={form.category} onValueChange={(v) => onField('category', v as 'short' | 'long')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">{t.goalCategoryShort}</SelectItem>
                <SelectItem value="long">{t.goalCategoryLong}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t.goalStatus}</Label>
          <Select
            value={form.status}
            onValueChange={(v) => onField('status', v as 'active' | 'completed' | 'paused')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t.goalStatusActive}</SelectItem>
              <SelectItem value="completed">{t.goalStatusCompleted}</SelectItem>
              <SelectItem value="paused">{t.goalStatusPaused}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t.goalRelated}</Label>
          <Input
            type="text"
            value={form.relatedEvents}
            onChange={(e) => onField('relatedEvents', e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? t.savingBtn : t.profileSave}
          </Button>
          {selectedId && (
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 />
              <span className="sr-only">{t.deleteBtn}</span>
            </Button>
          )}
          {message && (
            <span className={cn('text-xs', status === 'success' ? 'text-green-600' : 'text-destructive')}>
              {message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
