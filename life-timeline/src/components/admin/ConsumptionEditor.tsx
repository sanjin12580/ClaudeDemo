// ============================================================
// ConsumptionEditor — 读书观影清单编辑器（输入即搜 + 一键填充）
// 作品信息自动带出 / 我的记录手动填写 / 来源信息折叠
// ============================================================

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import TagInput from './TagInput';
import { to } from '../../lib/base';
import type { ConsumptionFormShape } from './shapes';
import type { MetadataCandidate } from '../../lib/parseConsumptions';
import type { zh } from '../../lib/i18n';

interface Props {
  form: ConsumptionFormShape;
  metadataCandidates: MetadataCandidate[];
  metadataHint: string;
  fetchingMeta: boolean;
  t: typeof zh['admin'];
  /** Select 弹层挂载容器（公共页抽屉需传，admin 默认 body） */
  container?: HTMLElement | null;
  /** 是否显示「自动获取元数据」（公共页关闭） */
  showMetaFetch?: boolean;
  onField: <K extends keyof ConsumptionFormShape>(
    field: K,
    value: ConsumptionFormShape[K],
  ) => void;
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
  container,
  showMetaFetch = true,
  onField,
  onSubmit,
  onDelete,
  onFetchMetadata,
  onApplyCandidate,
}: Props) {
  const coverPreview =
    form.cover.trim() && (form.cover.startsWith('http') ? form.cover : to(form.cover));

  // 按类型分组：影视（movie/tv/anime）与书籍（book/novel），同名书影不再互相淹没
  const isBook = (c: MetadataCandidate) =>
    c.suggestedType === 'book' || c.suggestedType === 'novel';
  const movieCandidates = metadataCandidates.filter((c) => !isBook(c));
  const bookCandidates = metadataCandidates.filter(isBook);

  const renderCandidate = (c: MetadataCandidate, idx: number) => (
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
          className="w-9 h-12 object-cover rounded shrink-0"
        />
      ) : (
        <div className="w-9 h-12 rounded bg-muted shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate">{c.title}</span>
          {c.suggestedType && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
              {t.consumptionTypeOptions[c.suggestedType] ?? c.suggestedType}
            </span>
          )}
        </span>
        <span className="block text-[10px] text-muted-foreground truncate mt-0.5">
          {[
            c.year ? `${c.year} 年` : '',
            c.releaseDate ? `${t.consumptionReleaseDate} ${c.releaseDate}` : '',
            c.author,
            c.desc,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <form onSubmit={onSubmit} className="space-y-5 max-w-xl">
        <h3 className="font-semibold text-sm">
          {form.id ? `${t.consumptionEditTitle}: ${form.title}` : t.consumptionNewTitle}
        </h3>

        {/* ===== 搜索区：输入标题自动检索元数据 ===== */}
        <div className="space-y-1.5">
          <Label>{t.consumptionTitle}</Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={form.title}
              onChange={(e) => onField('title', e.currentTarget.value)}
              placeholder={t.consumptionSearchPlaceholder}
              required
            />
            {showMetaFetch && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={onFetchMetadata}
                disabled={fetchingMeta || !form.title.trim()}
              >
                {fetchingMeta ? t.consumptionFetching : t.consumptionAutoFetch}
              </Button>
            )}
          </div>
          {fetchingMeta && (
            <p className="text-[11px] text-muted-foreground animate-pulse">
              {t.consumptionSearching}
            </p>
          )}

          {showMetaFetch && movieCandidates.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="text-[11px] text-muted-foreground">
                {t.consumptionGroupMovie}
              </div>
              {movieCandidates.map((c, idx) => renderCandidate(c, idx))}
            </div>
          )}
          {showMetaFetch && bookCandidates.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="text-[11px] text-muted-foreground">
                {t.consumptionGroupBook}
              </div>
              {bookCandidates.map((c, idx) => renderCandidate(c, idx))}
            </div>
          )}
          {showMetaFetch && metadataHint && !fetchingMeta && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">{metadataHint}</p>
          )}
        </div>

        {/* ===== 作品信息（候选自动带出，可微调） ===== */}
        <fieldset className="rounded-md border border-border/60 p-4 space-y-4">
          <legend className="px-1 text-xs font-semibold text-muted-foreground">
            {t.consumptionWorkInfo}
          </legend>

          <div className="flex gap-4">
            <div className="space-y-1.5 flex-1">
              <Label>{t.consumptionType}</Label>
              <Select
                value={form.type}
                onValueChange={(v) => onField('type', v as ConsumptionFormShape['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent container={container}>
                  {Object.entries(t.consumptionTypeOptions).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1">
              <Label>{t.consumptionAuthor}</Label>
              <Input
                type="text"
                placeholder="刘慈欣 / 克里斯托弗·诺兰"
                value={form.author}
                onChange={(e) => onField('author', e.currentTarget.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="space-y-1.5 w-32">
              <Label>{t.consumptionYear}</Label>
              <Input
                type="number"
                min={1900}
                max={2100}
                placeholder="2014"
                value={form.year}
                onChange={(e) => onField('year', e.currentTarget.value)}
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label>{t.consumptionReleaseDate}</Label>
              <Input
                type="text"
                placeholder="2014-11-07"
                value={form.releaseDate}
                onChange={(e) => onField('releaseDate', e.currentTarget.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t.consumptionCover}</Label>
            <div className="flex items-center gap-3">
              <Input
                type="text"
                placeholder="https://... 或 /covers/xxx.jpg"
                value={form.cover}
                onChange={(e) => onField('cover', e.currentTarget.value)}
                className="flex-1"
              />
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt={t.consumptionCover}
                  className="w-10 h-14 object-cover rounded border border-border shrink-0"
                />
              )}
            </div>
          </div>
        </fieldset>

        {/* ===== 我的记录（手动填写） ===== */}
        <fieldset className="rounded-md border border-border/60 p-4 space-y-4">
          <legend className="px-1 text-xs font-semibold text-muted-foreground">
            {t.consumptionMyRecord}
          </legend>

          <div className="flex gap-4">
            <div className="space-y-1.5 flex-1">
              <Label>
                {t.consumptionDate}
                {form.status === 'doing' ? `（${t.consumptionStartDate}）` : ''}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="2024-06"
                  value={form.date}
                  onChange={(e) => onField('date', e.currentTarget.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() =>
                    onField('date', new Date().toISOString().slice(0, 10))
                  }
                >
                  {t.consumptionToday}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              <Label>{t.consumptionStatus}</Label>
              <Select
                value={form.status}
                onValueChange={(v) => onField('status', v as 'done' | 'doing')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent container={container}>
                  {Object.entries(t.consumptionStatusOptions).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 w-40">
            <Label>
              {t.consumptionRating}
              {form.status === 'doing' && `（${t.consumptionUnrated}）`}
            </Label>
            <Select
              value={String(form.rating)}
              onValueChange={(v) => onField('rating', Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent container={container}>
                <SelectItem value="0">{t.consumptionUnrated}</SelectItem>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {'⭐'.repeat(n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t.consumptionReview}</Label>
            <Textarea
              className="h-32"
              placeholder="Markdown 格式，支持标题、引用、图片等..."
              value={form.review}
              onChange={(e) => onField('review', e.currentTarget.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t.consumptionTags}</Label>
            <TagInput
              value={form.tags}
              onChange={(v) => onField('tags', v)}
              placeholder="回车或逗号添加标签"
            />
          </div>
        </fieldset>

        {/* ===== 来源信息（自动填充，可改） ===== */}
        <details className="rounded-md border border-border/60 px-4 py-3">
          <summary className="text-xs font-semibold text-muted-foreground cursor-pointer select-none">
            {t.consumptionSourceInfo}
          </summary>
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label>{t.consumptionSource}</Label>
              <Select
                value={form.source ?? 'manual'}
                onValueChange={(v) =>
                  onField('source', v === 'manual' ? undefined : (v as 'tmdb' | 'douban'))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent container={container}>
                  <SelectItem value="manual">{t.consumptionSourceManual}</SelectItem>
                  <SelectItem value="tmdb">TMDB</SelectItem>
                  <SelectItem value="douban">豆瓣</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>sourceId</Label>
              <Input
                type="text"
                value={form.sourceId}
                onChange={(e) => onField('sourceId', e.currentTarget.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>sourceUrl</Label>
              <Input
                type="text"
                placeholder="https://..."
                value={form.sourceUrl}
                onChange={(e) => onField('sourceUrl', e.currentTarget.value)}
              />
            </div>
          </div>
        </details>

        {/* 操作栏 */}
        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={fetchingMeta}>
            {t.submitBtn}
          </Button>
          {form.id && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              {t.deleteBtn}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
