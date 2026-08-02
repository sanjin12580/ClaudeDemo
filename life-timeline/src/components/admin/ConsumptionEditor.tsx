// ============================================================
// ConsumptionEditor — 读书观影清单编辑器（shadcn 表单 + 元数据拉取）
// ============================================================

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import TagInput from './TagInput';
import type { ConsumptionFormShape } from './shapes';
import type { MetadataCandidate } from '../../lib/parseConsumptions';
import type { zh } from '../../lib/i18n';

interface Props {
  form: ConsumptionFormShape;
  metadataCandidates: MetadataCandidate[];
  metadataHint: string;
  fetchingMeta: boolean;
  t: typeof zh['admin'];
  onField: <K extends keyof ConsumptionFormShape>(field: K, value: ConsumptionFormShape[K]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onFetchMetadata: () => void;
  onApplyCandidate: (c: MetadataCandidate) => void;
}

export default function ConsumptionEditor({
  form,
  metadataCandidates,
  metadataHint,
  fetchingMeta,
  t,
  onField,
  onSubmit,
  onDelete,
  onFetchMetadata,
  onApplyCandidate,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
        <h3 className="font-semibold text-sm">{form.id ? `编辑: ${form.title}` : t.consumptionNew}</h3>

        <div className="flex gap-4">
          <div className="space-y-1.5 flex-1">
            <Label>{t.consumptionTitle}</Label>
            <Input
              type="text"
              value={form.title}
              onInput={(e) => onField('title', e.currentTarget.value)}
              required
            />
          </div>
          <div className="space-y-1.5 w-32">
            <Label>{t.consumptionDate}</Label>
            <Input
              type="text"
              placeholder="2024-06"
              value={form.date}
              onInput={(e) => onField('date', e.currentTarget.value)}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="space-y-1.5 flex-1">
            <Label>{t.consumptionAuthor}</Label>
            <Input
              type="text"
              placeholder="刘慈欣 / 克里斯托弗·诺兰"
              value={form.author}
              onInput={(e) => onField('author', e.currentTarget.value)}
            />
          </div>
          <div className="space-y-1.5 w-32">
            <Label>{t.consumptionYear}</Label>
            <Input
              type="number"
              min={1900}
              max={2100}
              placeholder="2014"
              value={form.year}
              onInput={(e) => onField('year', e.currentTarget.value)}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="space-y-1.5 flex-1">
            <Label>{t.consumptionType}</Label>
            <Select value={form.type} onValueChange={(v) => onField('type', v as ConsumptionFormShape['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(t.consumptionTypeOptions).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex-1">
            <Label>{t.consumptionStatus}</Label>
            <Select value={form.status} onValueChange={(v) => onField('status', v as 'done' | 'doing')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(t.consumptionStatusOptions).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 w-28">
            <Label>{t.consumptionRating}</Label>
            <Select value={String(form.rating)} onValueChange={(v) => onField('rating', Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {'⭐'.repeat(n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>{t.consumptionCover}</Label>
            <Button type="button" variant="outline" size="sm" onClick={onFetchMetadata} disabled={fetchingMeta}>
              {fetchingMeta ? t.consumptionFetching : t.consumptionAutoFetch}
            </Button>
          </div>
          <Input
            type="text"
            placeholder="https://..."
            value={form.cover}
            onInput={(e) => onField('cover', e.currentTarget.value)}
          />
          {metadataCandidates.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="text-[11px] text-muted-foreground">{t.consumptionCandidates}</div>
              {metadataCandidates.map((c, idx) => (
                <button
                  key={`${c.source}-${c.sourceId}-${idx}`}
                  type="button"
                  onClick={() => onApplyCandidate(c)}
                  className="w-full flex items-center gap-3 p-2 rounded-md border border-border hover:border-primary transition-colors text-left"
                >
                  {c.cover ? (
                    <img
                      src={`/api/img-proxy?url=${encodeURIComponent(c.cover)}`}
                      alt={c.title}
                      className="w-8 h-11 object-cover rounded shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-11 rounded bg-muted shrink-0" />
                  )}
                  <span className="min-w-0">
                    <span className="block text-xs font-medium truncate">{c.title}</span>
                    <span className="block text-[10px] text-muted-foreground truncate">
                      {[c.year, c.author, c.desc].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {metadataHint && <p className="mt-1.5 text-[11px] text-muted-foreground">{metadataHint}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>{t.consumptionReview}</Label>
          <Textarea
            className="h-32"
            placeholder="Markdown 格式，支持标题、引用、图片等..."
            value={form.review}
            onInput={(e) => onField('review', e.currentTarget.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t.consumptionTags}</Label>
          <TagInput value={form.tags} onChange={(v) => onField('tags', v)} placeholder="回车或逗号添加标签" />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={fetchingMeta}>
            {t.submitBtn}
          </Button>
          {form.id && (
            <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={onDelete}>
              {t.deleteBtn}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
