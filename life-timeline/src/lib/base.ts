// 路径工具 — 自动添加 Astro base 前缀
// 用法：to('/timeline') → '/ClaudeDemo/timeline'
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
export function to(p: string): string {
  return `${BASE}/${p.replace(/^\//, '')}`;
}
