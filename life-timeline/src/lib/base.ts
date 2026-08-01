// 路径工具 — 自动添加 Astro base 前缀
// 用法：to('/timeline') → '/ClaudeDemo/timeline'
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export function to(p: string): string {
  return `${BASE}/${p.replace(/^\//, '')}`;
}

/**
 * 封面 URL 工具：本地 /covers/ 路径补全站点 base，远程 URL 原样返回
 * 封面保存到 public/covers/ 后以无 base 路径存储，渲染时统一补全
 */
export function coverUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('/covers/') || url.startsWith('covers/')) {
    return to(url.replace(/^\/+/, ''));
  }
  return url;
}

// ============================================================
// 共享工具函数
// ============================================================

/**
 * 格式化日期为中文显示
 * 支持 YYYY / YYYY-MM / YYYY-MM-DD 三种格式
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${y}年${parseInt(m)}月${parseInt(d)}日`;
  }
  if (parts.length === 2) {
    return `${parts[0]}年${parseInt(parts[1])}月`;
  }
  return `${dateStr}年`;
}

/**
 * 事件/博客卡片共享样式类名
 */
export const CARD_CLASSES =
  'group card bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 ' +
  'shadow-sm hover:shadow-md hover:-translate-y-0.5 ' +
  'transition-all duration-300 cursor-pointer ' +
  'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2';
