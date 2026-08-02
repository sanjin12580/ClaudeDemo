// ============================================================
// MediaPicker — 从已上传媒体中选择并插入正文（shadcn Dialog）
// ============================================================

import { useMemo, useState } from 'react';
import type { MediaItem } from '../../lib/types';
import { getIconForFile } from '../../lib/types';
import { getFileUrl } from '../../lib/filePreview';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface Props {
  open: boolean;
  media: MediaItem[];
  searchPlaceholder: string;
  title: string;
  emptyText: string;
  emptyListText: string;
  footerText: string;
  onClose: () => void;
  onInsert: (item: MediaItem) => void;
  container?: HTMLElement | null;
}

export default function MediaPicker({
  open,
  media,
  searchPlaceholder,
  title,
  emptyText,
  emptyListText,
  footerText,
  onClose,
  onInsert,
  container,
}: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return media;
    const q = query.toLowerCase();
    return media.filter(
      (m) => m.title.toLowerCase().includes(q) || m.filename.toLowerCase().includes(q)
    );
  }, [media, query]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent container={container} className="flex max-h-[75vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
        />

        <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onInsert(item)}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
            >
              <span className="text-xl shrink-0">
                {item.fileType === 'image' ? (
                  <img src={getFileUrl(item.url)} alt="" className="w-8 h-8 object-cover rounded" />
                ) : (
                  <span>{getIconForFile(item.filename, item.fileType)}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate">{item.title || item.filename}</span>
                <span className="block text-[10px] text-muted-foreground truncate">{item.filename}</span>
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-auto">{item.fileType}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {media.length === 0 ? emptyText : emptyListText}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" className="text-xs font-normal text-muted-foreground" onClick={onClose}>
            {footerText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
