import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Vite 插件：在开发模式下提供 /api/write-event 端点
 * 用于管理后台写入 Markdown 事件文件
 */
export function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    configureServer(server) {
      // 仅开发模式下生效
      server.middlewares.use('/api/write-event', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: '仅支持 POST 方法' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const { date, title, category, tags, importance, location, content } = data;

            // 验证必填字段
            if (!date || !title || !category) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '缺少必填字段：date、title、category' }));
              return;
            }

            // 生成文件名: YYYY-MM-DD-简短标题.md
            const slug = `${date}-${sanitizeFilename(title)}.md`;
            const year = date.slice(0, 4);
            const eventsDir = path.resolve(process.cwd(), 'src', 'content', 'events', year);

            // 确保目录存在
            if (!fs.existsSync(eventsDir)) {
              fs.mkdirSync(eventsDir, { recursive: true });
            }

            // 生成 frontmatter
            const tagsLine = tags && tags.length > 0
              ? `tags: [${tags.map((t: string) => t.trim()).filter(Boolean).join(', ')}]`
              : 'tags: []';

            const fileContent = `---
date: "${date}"
title: "${title}"
category: "${category}"
${tagsLine}
importance: ${importance || 3}${location ? `\nlocation: "${location}"` : ''}
---

${content || '（待补充）'}
`;

            const filePath = path.join(eventsDir, slug);
            fs.writeFileSync(filePath, fileContent, 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              path: path.relative(process.cwd(), filePath),
              slug,
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: '写入失败',
              detail: err instanceof Error ? err.message : String(err),
            }));
          }
        });
      });
    },
  };
}

/** 将标题转为跨平台安全的文件名片段（仅保留 ASCII 字母数字和连字符） */
function sanitizeFilename(title: string): string {
  // 尝试提取英文和数字部分
  const ascii = title.replace(/[^\w\d-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (ascii.length >= 2) {
    return ascii.slice(0, 40);
  }
  // 如果纯中文标题，用日期的 MD5 短摘要作为文件名
  return 'event-' + simpleHash(title).slice(0, 8);
}

/** 简单的字符串哈希（非密码学安全，仅用于生成唯一标识） */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}
