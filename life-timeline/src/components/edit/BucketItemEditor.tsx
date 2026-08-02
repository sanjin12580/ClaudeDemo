// ============================================================
// BucketItemEditor — 愿望清单表单（公共页 dev 编辑 / 后续可给 admin 复用）
// ============================================================

import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import TagInput from '../admin/TagInput';
import type { BucketFormShape } from '../admin/shapes';
import type { zh } from '../../lib/i18n';

interface Props {
  form: BucketFormShape;
  onField: <K extends keyof BucketFormShape>(field: K, value: BucketFormShape[K]) => void;
  container?: HTMLElement | null;
  t: typeof zh['editMode'];
  categoryLabels: Record<string, string>;
  saveLabel: string;
  saving: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function BucketItemEditor({
  form,
  onField,
  container,
  t,
  categoryLabels,
  saveLabel,
  saving,
  onSubmit,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>{t.bucketTitle}</Label>
          <Input value={form.title} onChange={(e) => onField('title', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>{t.bucketCategory}</Label>
          <Select value={form.category} onValueChange={(v) => onField('category', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent container={container}>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t.bucketDesc}</Label>
          <Textarea
            className="h-24"
            value={form.description}
            onChange={(e) => onField('description', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t.bucketTags}</Label>
          <TagInput value={form.tags} onChange={(v) => onField('tags', v)} placeholder="回车或逗号添加标签" />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="bucket-done"
            checked={form.done}
            onCheckedChange={(v) => onField('done', v)}
          />
          <Label htmlFor="bucket-done" className="cursor-pointer">
            {t.bucketDone}
          </Label>
        </div>

        {form.done && (
          <div className="space-y-1.5">
            <Label>{t.bucketDoneDate}</Label>
            <Input
              type="date"
              value={form.doneDate}
              onChange={(e) => onField('doneDate', e.target.value)}
            />
          </div>
        )}

        <div className="pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? '保存中…' : saveLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
