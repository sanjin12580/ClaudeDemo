// ============================================================
// /sitemap.xml — 全站 sitemap（构建时静态生成）
// ============================================================

import { loadEvents } from '../lib/parseEvents';
import { loadPosts } from '../lib/parsePosts';
import { loadConsumptions } from '../lib/parseConsumptions';
import { loadLifeStats } from '../lib/stats';
import { to } from '../lib/base';

const SITE = (import.meta.env.SITE as string) || 'https://sanjin12580.github.io';

export async function GET() {
  const paths = [
    '/', '/timeline', '/dashboard', '/bucket-list', '/blog',
    '/trending', '/travel', '/gallery', '/consumptions', '/about',
  ];

  const [events, posts, consumptions, stats] = await Promise.all([
    loadEvents(),
    loadPosts(),
    loadConsumptions(),
    loadLifeStats(),
  ]);

  for (const e of events) paths.push(`/events/${e.slug}`);
  for (const p of posts) paths.push(`/blog/${p.slug}`);
  for (const c of consumptions.items) paths.push(`/consumptions/${c.id}`);
  for (const y of stats.yearly) {
    paths.push(`/yearly/${y.year}`, `/timeline/${y.year}`);
  }

  const urls = [...new Set(paths)]
    .map((p) => `  <url><loc>${SITE}${to(p)}</loc></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
