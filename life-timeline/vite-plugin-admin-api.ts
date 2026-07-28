import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Vite 插件：在开发模式下提供管理后台 API
 * - POST /api/write-event  创建事件
 * - DELETE /api/delete-event 删除事件
 */
export function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    configureServer(server) {
      // === 创建事件 ===
      server.middlewares.use('/api/write-event', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: '仅支持 POST 方法' }));
          return;
        }

        readBody(req).then((body) => {
          try {
            const data = JSON.parse(body);
            const { date, title, category, tags, importance, location, content } = data;

            if (!date || !title || !category) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '缺少必填字段：date、title、category' }));
              return;
            }

            const slug = `${date}-${sanitizeFilename(title)}.md`;
            const year = date.slice(0, 4);
            const eventsDir = path.resolve(process.cwd(), 'src', 'content', 'events', year);

            if (!fs.existsSync(eventsDir)) {
              fs.mkdirSync(eventsDir, { recursive: true });
            }

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

      // === 删除事件 ===
      server.middlewares.use('/api/delete-event', (req, res) => {
        if (req.method !== 'DELETE') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: '仅支持 DELETE 方法' }));
          return;
        }

        readBody(req).then((body) => {
          try {
            const { filePath } = JSON.parse(body);

            if (!filePath) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '缺少 filePath 参数' }));
              return;
            }

            const absolutePath = path.resolve(process.cwd(), filePath);
            // 安全检查：确保只删除 events 目录下的 .md 文件
            if (!absolutePath.includes(path.join('src', 'content', 'events')) || !absolutePath.endsWith('.md')) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '不允许删除该文件' }));
              return;
            }

            if (!fs.existsSync(absolutePath)) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '文件不存在' }));
              return;
            }

            fs.unlinkSync(absolutePath);

            // 如果目录为空，清理目录
            const dir = path.dirname(absolutePath);
            if (fs.readdirSync(dir).length === 0) {
              fs.rmdirSync(dir);
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: '删除失败',
              detail: err instanceof Error ? err.message : String(err),
            }));
          }
        });
      });
    },
  };
}

/** 读取请求 body */
function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
  });
}

function sanitizeFilename(title: string): string {
  const ascii = title.replace(/[^\w\d-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (ascii.length >= 2) return ascii.slice(0, 40);
  return 'event-' + simpleHash(title).slice(0, 8);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}
