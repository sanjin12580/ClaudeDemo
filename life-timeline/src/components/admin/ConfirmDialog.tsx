// ============================================================
// ConfirmDialog — 统一确认弹窗（shadcn Dialog）
// ============================================================

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  cancelText: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** 挂载容器（管理端根节点，用于继承主题令牌） */
  container?: HTMLElement | null;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  danger = false,
  cancelText,
  onCancel,
  onConfirm,
  container,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent container={container} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={danger ? 'destructive' : 'default'} onClick={onConfirm}>
            {confirmText || '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
