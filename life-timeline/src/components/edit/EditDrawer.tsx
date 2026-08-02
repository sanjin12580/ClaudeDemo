// ============================================================
// EditDrawer — 右侧滑出编辑抽屉（shadcn 令牌作用域 + 单 Toaster）
// children 为渲染函数，回传抽屉内容节点供 Select 弹层挂载
// ============================================================

import { useRef, type ReactNode } from 'react';
import { XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '../ui/dialog';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: (container: HTMLElement | null) => ReactNode;
}

export default function EditDrawer({ open, title, onClose, children }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        ref={contentRef}
        side="right"
        className="admin-root p-0"
        showCloseButton={false}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3.5">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogClose
            className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="关闭"
          >
            <XIcon className="size-4" />
          </DialogClose>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children(contentRef.current)}</div>
      </DialogContent>
    </Dialog>
  );
}
