// ============================================================
// MediaEditor — 媒体上传 / 元数据编辑（shadcn 表单）
// ============================================================

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import type { MediaFormShape } from './shapes';
import type { zh } from '../../lib/i18n';

interface Props {
  form: MediaFormShape;
  selectedId: string | null;
  uploading: boolean;
  uploadMsg: string;
  dragOver: boolean;
  albums: string[];
  t: typeof zh['admin'];
  onField: <K extends keyof MediaFormShape>(field: K, value: MediaFormShape[K]) => void;
  onDragOver: (over: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onPickFile: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
  onDirty: () => void;
}

export default function MediaEditor({
  form,
  selectedId,
  uploading,
  uploadMsg,
  dragOver,
  albums,
  t,
  onField,
  onDragOver,
  onDrop,
  onPickFile,
  onSubmit,
  onDelete,
  onDirty,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-6 max-w-xl">
        {/* 上传区 */}
        <button
          type="button"
          onDragOver={(e) => {
            e.preventDefault();
            onDragOver(true);
          }}
          onDragLeave={() => onDragOver(false)}
          onDrop={onDrop}
          onClick={onPickFile}
          className={cn(
            'w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-input hover:border-ring'
          )}
        >
          {uploading ? (
            <span className="text-sm text-muted-foreground">
              <span className="loading loading-spinner loading-sm mr-2" />
              {uploadMsg}
            </span>
          ) : (
            <>
              <span className="block text-3xl mb-2">📎</span>
              <span className="block text-sm text-foreground/80">{t.fileUpload}</span>
              <span className="block text-xs text-muted-foreground mt-1">{t.fileDrop}</span>
            </>
          )}
        </button>
        {uploadMsg && !uploading && (
          <p className="text-xs text-destructive -mt-4">{uploadMsg}</p>
        )}

        <hr className="border-border/60" />

        {/* 编辑表单 */}
        {selectedId ? (
          <form onChange={onDirty} onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t.mediaTitle}</Label>
              <Input
                type="text"
                value={form.title}
                onChange={(e) => onField('title', e.target.value)}
                placeholder={t.mediaTitlePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.mediaDesc}</Label>
              <Input
                type="text"
                value={form.description}
                onChange={(e) => onField('description', e.target.value)}
                placeholder={t.mediaDescPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t.mediaAlbum}</Label>
              <Input
                type="text"
                value={form.album}
                onChange={(e) => onField('album', e.target.value)}
                placeholder={t.mediaAlbumPlaceholder}
                list="album-suggestions"
              />
              <datalist id="album-suggestions">
                {albums.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit">{t.saveBtn}</Button>
              <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={onDelete}>
                {t.deleteBtn}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">{t.mediaSelectHint}</div>
        )}
      </div>
    </div>
  );
}
