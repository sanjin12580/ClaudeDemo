import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================
// 安全工具函数
// ============================================================

/** 允许的图片扩展名白名单 */
const ALLOWED_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

/** 日期格式校验（YYYY / YYYY-MM / YYYY-MM-DD） */
const DATE_REGEX = /^\d{4}(-\d{2}(-\d{2})?)?$/;

/** 转义 YAML 字符串中的双引号和换行符，防止 YAML 注入 */
function escapeYaml(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
}

/**
 * 安全检查：确保解析后的绝对路径在允许的目录内
 * 使用 startsWith + path.normalize 而非 String.includes，防止子串绕过
 */
function isPathWithin(baseDir: string, targetPath: string): boolean {
  const normalizedBase = path.normalize(path.resolve(baseDir)) + path.sep;
  const normalizedTarget = path.normalize(path.resolve(targetPath));
  return normalizedTarget.startsWith(normalizedBase);
}

/**
 * Vite 插件：在开发模式下提供管理后台 API
 * - POST /api/write-event  创建事件
 * - DELETE /api/delete-event 删除事件
 * - POST /api/write-post  创建博客文章
 * - DELETE /api/delete-post 删除博客文章
 * - POST /api/write-goals 保存目标
 * - POST /api/upload-image 上传图片
 */
export function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    configureServer(server) {
      // === 上传图片 ===
      server.middlewares.use('/api/upload-image', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: '仅支持 POST 方法' }));
          return;
        }

        readBody(req).then((body) => {
          try {
            const { filename, data } = JSON.parse(body);

            if (!filename || !data) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '缺少 filename 或 data' }));
              return;
            }

            // 提取 base64 数据
            const matches = data.match(/^data:image\/([\w+]+);base64,(.+)$/);
            if (!matches) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '无效的图片数据格式，需要 data URI' }));
              return;
            }

            // 安全：白名单校验扩展名，防止存储型 XSS
            const rawExt = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            if (!ALLOWED_IMAGE_EXTENSIONS.has(rawExt)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '不支持的图片格式，仅允许: ' + [...ALLOWED_IMAGE_EXTENSIONS].join(', ') }));
              return;
            }
            const ext = rawExt;
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');

            // 限制文件大小 10MB
            if (buffer.length > 10 * 1024 * 1024) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '图片不能超过 10MB' }));
              return;
            }

            // 生成唯一文件名
            const baseName = filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_.-]/g, '-').replace(/-+/g, '-').slice(0, 60);
            const uniqueName = `${Date.now()}-${baseName}.${ext}`;
            const imagesDir = path.resolve(process.cwd(), 'public', 'images');

            if (!fs.existsSync(imagesDir)) {
              fs.mkdirSync(imagesDir, { recursive: true });
            }

            const filePath = path.join(imagesDir, uniqueName);
            fs.writeFileSync(filePath, new Uint8Array(buffer));

            const url = `/images/${uniqueName}`;

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, url, filename: uniqueName }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: '上传失败',
              detail: err instanceof Error ? err.message : String(err),
            }));
          }
        });
      });

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

            // 安全：校验日期格式，防止路径注入
            if (!DATE_REGEX.test(date)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '日期格式无效，必须为 YYYY、YYYY-MM 或 YYYY-MM-DD' }));
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
date: "${escapeYaml(date)}"
title: "${escapeYaml(title)}"
category: "${escapeYaml(category)}"
${tagsLine}
importance: ${importance || 3}${location ? `\nlocation: "${escapeYaml(location)}"` : ''}
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
            // 安全：使用规范化路径前缀检查，防止子串绕过
            const eventsDir = path.resolve(process.cwd(), 'src', 'content', 'events');
            if (!isPathWithin(eventsDir, absolutePath) || !absolutePath.endsWith('.md')) {
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

      // === 创建博客文章 ===
      server.middlewares.use('/api/write-post', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: '仅支持 POST 方法' }));
          return;
        }

        readBody(req).then((body) => {
          try {
            const data = JSON.parse(body);
            const { date, title, tags, content, draft } = data;

            if (!date || !title) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '缺少必填字段：date、title' }));
              return;
            }

            const slug = `${date}-${sanitizeFilename(title)}.md`;
            const blogDir = path.resolve(process.cwd(), 'src', 'content', 'blog');

            if (!fs.existsSync(blogDir)) {
              fs.mkdirSync(blogDir, { recursive: true });
            }

            const tagsLine = tags && tags.length > 0
              ? `tags: [${tags.map((t: string) => t.trim()).filter(Boolean).join(', ')}]`
              : 'tags: []';

            const draftLine = draft ? '\ndraft: true' : '';

            const fileContent = `---
date: "${escapeYaml(date)}"
title: "${escapeYaml(title)}"
${tagsLine}${draftLine}
---

${content || '（待补充）'}
`;

            const filePath = path.join(blogDir, slug);
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

      // === 删除博客文章 ===
      server.middlewares.use('/api/delete-post', (req, res) => {
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
            // 安全：使用规范化路径前缀检查，防止子串绕过
            const blogDir = path.resolve(process.cwd(), 'src', 'content', 'blog');
            if (!isPathWithin(blogDir, absolutePath) || !absolutePath.endsWith('.md')) {
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

      // === 保存个人档案 ===
      server.middlewares.use('/api/write-profile', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: '仅支持 POST 方法' }));
          return;
        }

        readBody(req).then((body) => {
          try {
            const data = JSON.parse(body);
            const { name, tagline, avatar, birthDate, skills, shortGoal, longGoal } = data;

            if (!name || !birthDate) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '缺少必填字段：name、birthDate' }));
              return;
            }

            const profileDir = path.resolve(process.cwd(), 'src', 'content', 'profile');
            if (!fs.existsSync(profileDir)) {
              fs.mkdirSync(profileDir, { recursive: true });
            }

            const skillsLine = skills && skills.length > 0
              ? `skills: [${skills.map((s: string) => s.trim()).filter(Boolean).map((s: string) => `"${s}"`).join(', ')}]`
              : 'skills: []';

            const fileContent = `---
name: "${escapeYaml(name)}"
tagline: "${escapeYaml(tagline || '')}"
avatar: "${escapeYaml(avatar || '')}"
birthDate: "${escapeYaml(birthDate)}"
${skillsLine}
shortGoal: "${escapeYaml(shortGoal || '')}"
longGoal: "${escapeYaml(longGoal || '')}"
---

关于我的一些事...
`;

            const filePath = path.join(profileDir, 'about.md');
            fs.writeFileSync(filePath, fileContent, 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              path: path.relative(process.cwd(), filePath),
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: '保存失败',
              detail: err instanceof Error ? err.message : String(err),
            }));
          }
        });
      });

      // === 保存目标 ===
      server.middlewares.use('/api/write-goals', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: '仅支持 POST 方法' }));
          return;
        }

        readBody(req).then((body) => {
          try {
            const { goals } = JSON.parse(body);

            if (!Array.isArray(goals)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '缺少 goals 数组' }));
              return;
            }

            const dataDir = path.resolve(process.cwd(), 'src', 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const filePath = path.join(dataDir, 'goals.json');
            fs.writeFileSync(filePath, JSON.stringify({ goals }, null, 2), 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              path: path.relative(process.cwd(), filePath),
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: '保存失败',
              detail: err instanceof Error ? err.message : String(err),
            }));
          }
        });
      });
    },
  };
}

/** 最大请求体大小限制（10 MB） */
const MAX_BODY_SIZE = 10 * 1024 * 1024;

/** 读取请求 body，带大小限制 */
function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        req.destroy();
        reject(new Error('请求体过大，最大允许 10 MB'));
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sanitizeFilename(title: string): string {
  // 保留中文字符、字母、数字、连字符，替换其他不安全字符
  const safe = title
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')  // 替换文件系统不安全字符
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (safe.length >= 2) return safe.slice(0, 40);
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
