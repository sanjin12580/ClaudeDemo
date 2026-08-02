// ============================================================
// 通用工具 — shadcn/ui 类名合并
// ============================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 合并 Tailwind 类名（冲突时后者生效） */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
