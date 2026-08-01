// ============================================================
// /rss.xml — 博客 RSS 订阅（构建时静态生成）
// ============================================================

import { loadPosts } from '../lib/parsePosts';
import { to } from '../lib/base';

const SITE = (import.meta.env.SITE as string) || 'https://sanjin12580.github.io';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  const posts = await loadPosts();
  const items = posts
    .map((p) => {
      const link = `${SITE}${to(`/blog/${p.slug}`)}`;
      const excerpt = p.body
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[#>*`_~]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 200);
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${new Date(`${p.date}T00:00:00+08:00`).toUTCString()}</pubDate>
      <description>${esc(excerpt)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>人生时间线 · 博客</title>
    <link>${SITE}${to('/blog')}</link>
    <description>记录我的一生 — 博客订阅</description>
    <atom:link href="${SITE}${to('/rss.xml')}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
