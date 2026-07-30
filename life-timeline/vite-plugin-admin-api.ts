import type { Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

/** kkFileView 服务地址 */
const KKFILEVIEW_HOST = 'localhost';
const KKFILEVIEW_PORT = 8012;

// ============================================================
// 安全工具函数
// ============================================================

/** 允许的文件扩展名白名单（与 types.ts 的 ALLOWED_EXTENSIONS 保持同步） */
const ALLOWED_FILE_EXTENSIONS = new Set([
  // 图片
  'png','jpg','jpeg','gif','webp','svg','bmp','ico','tif','tiff','tga','heic','heif','jfif','psd','eps','wmf','emf',
  // 文档
  'doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp','csv','tsv','wps','dps','et','ett','wpt','vsd','vsdx','rtf','ofd','xlsm','pptm','dotm','dotx','xlam','xla','xlt','xltm','ots','otp','ott','fodt','fods','six','pages',
  // PDF/电子书
  'pdf','epub','mobi','azw3',
  // 视频
  'mp4','webm','mov','avi','mkv','flv','wmv','rm','rmvb','3gp','m4v','ts','mpeg','mpd','m3u8','m4a',
  // 音频
  'mp3','wav','ogg','wma','aac',
  // 压缩包
  'zip','rar','7z','tar','gz','bz2','xz','jar',
  // 文本/代码
  'txt','md','json','xml','csv','yaml','yml','js','ts','java','py','c','cpp','h','css','html','htm','sql','sh','bat','properties','ini','toml','log','php','asp','jsp','gitignore','bas','prg','cmd','rb','go','cs','aspx','lua',
  // 思维导图/流程图
  'xmind','mmap','bpmn','drawio',
  // CAD/3D
  'dwg','dxf','dwf','dwt','stl','step','iges','igs','dng','ifc','dwfx','cf2','plt','obj','3ds','ply','gltf','glb','off','3dm','fbx','dae','wrl','3mf','brep','fcstd','bim','stp','o3dv',
  // 其他（邮件/医学）
  'eml','msg','dcm',
]);

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
 * 将文件 Buffer 上传到 kkFileView（multipart/form-data）
 * 返回 kkFileView 的相对路径 "demo/{filename}"
 */
function uploadToKkFileView(filename: string, buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const CRLF = '\r\n';

    const header =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}` +
      `Content-Type: application/octet-stream${CRLF}${CRLF}`;
    const footer = `${CRLF}--${boundary}--${CRLF}`;

    const body = Buffer.concat([
      Buffer.from(header, 'utf8'),
      buffer,
      Buffer.from(footer, 'utf8'),
    ] as unknown as readonly Uint8Array[]);

    const req = http.request({
      hostname: KKFILEVIEW_HOST,
      port: KKFILEVIEW_PORT,
      path: '/fileUpload',
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length.toString(),
      },
    }, (response) => {
      let data = '';
      response.on('data', (chunk: Buffer) => data += chunk.toString());
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 0) {
            resolve(`demo/${filename}`);
          } else {
            reject(new Error(result.msg || '上传到 kkFileView 失败'));
          }
        } catch {
          reject(new Error(`kkFileView 返回异常: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', (err: NodeJS.ErrnoException) => {
      reject(new Error(`无法连接 kkFileView 服务 (${KKFILEVIEW_HOST}:${KKFILEVIEW_PORT}): ${err.message}`));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Vite 插件：在开发模式下提供管理后台 API
 * - POST /api/write-event  创建事件
 * - DELETE /api/delete-event 删除事件
 * - POST /api/write-post  创建博客文章
 * - DELETE /api/delete-post 删除博客文章
 * - POST /api/write-goals 保存目标
 * - POST /api/upload-file 上传文件
 * - POST /api/write-media 保存媒体元数据
 * - DELETE /api/delete-media 删除媒体文件
 */
export function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    configureServer(server) {
      // === 上传文件（代理到 kkFileView） ===
      server.middlewares.use('/api/upload-file', (req, res) => {
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

            // 支持所有文件类型的 base64 data URI
            const matches = data.match(/^data:([\w/+-.]+);base64,(.+)$/);
            if (!matches) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '无效的 data URI 格式' }));
              return;
            }

            const mimeType = matches[1];

            // 从文件名提取扩展名
            const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
            const rawExt = extMatch ? extMatch[1].toLowerCase() : '';
            // 对于图片 data URI，MIME 子类型也可能是扩展名来源
            const mimeParts = mimeType.split('/');
            const mimeExt = mimeParts[1] === 'jpeg' ? 'jpg' : mimeParts[1];
            const ext = rawExt || mimeExt;

            if (!ext || !ALLOWED_FILE_EXTENSIONS.has(ext)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '不支持的文件格式: .' + ext + '，允许: ' + [...ALLOWED_FILE_EXTENSIONS].join(', ') }));
              return;
            }

            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');

            // 限制文件大小 50MB
            if (buffer.length > 50 * 1024 * 1024) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '文件不能超过 50MB' }));
              return;
            }

            // 生成唯一文件名，保留原始扩展名
            const baseName = sanitizeFilename(filename.replace(/\.[^.]+$/, '')).slice(0, 60);
            const uniqueName = `${Date.now()}-${baseName}.${ext}`;

            // 上传到 kkFileView（作为文件存储和预览服务）
            uploadToKkFileView(uniqueName, buffer).then((kkPath) => {
              // kkPath 格式: "demo/{filename}"
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, url: kkPath, filename: uniqueName, size: buffer.length }));
            }).catch((uploadErr) => {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: 'kkFileView 上传失败',
                detail: uploadErr instanceof Error ? uploadErr.message : String(uploadErr),
              }));
            });
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

      // 兼容旧的 upload-image 端点（转发到 upload-file 逻辑）
      server.middlewares.use('/api/upload-image', (req, res) => {
        // 重写 url 后重新进入中间件栈
        const originalUrl = req.url;
        req.url = '/api/upload-file';
        // @ts-ignore — connect 中间件处理
        server.middlewares.handle(req, res, () => {
          req.url = originalUrl;
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

      // === 保存媒体元数据 ===
      server.middlewares.use('/api/write-media', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: '仅支持 POST 方法' }));
          return;
        }

        readBody(req).then((body) => {
          try {
            const { media } = JSON.parse(body);

            if (!Array.isArray(media)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '缺少 media 数组' }));
              return;
            }

            const dataDir = path.resolve(process.cwd(), 'src', 'data');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            const filePath = path.join(dataDir, 'media.json');
            fs.writeFileSync(filePath, JSON.stringify({ media }, null, 2), 'utf-8');

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

      // === 删除媒体文件（调用 kkFileView 删除） ===
      server.middlewares.use('/api/delete-media', (req, res) => {
        if (req.method !== 'DELETE') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: '仅支持 DELETE 方法' }));
          return;
        }

        readBody(req).then((body) => {
          try {
            const { filename } = JSON.parse(body);

            if (!filename) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '缺少 filename 参数' }));
              return;
            }

            // 安全：从文件名提取扩展名并校验
            const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
            const ext = extMatch ? extMatch[1].toLowerCase() : '';
            if (!ext || !ALLOWED_FILE_EXTENSIONS.has(ext)) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: '不允许删除该类型的文件' }));
              return;
            }

            // 调用 kkFileView 删除文件
            // kkFileView /deleteFile 要求: fileName={base64("http://demo/"+filename)}&password=123456
            const encodedName = encodeURIComponent(
              Buffer.from(`http://demo/${filename}`).toString('base64')
            );
            const deleteUrl = `/deleteFile?fileName=${encodedName}&password=123456`;

            const delReq = http.request({
              hostname: KKFILEVIEW_HOST,
              port: KKFILEVIEW_PORT,
              path: deleteUrl,
              method: 'GET',
            }, (delRes) => {
              let data = '';
              delRes.on('data', (chunk: Buffer) => data += chunk.toString());
              delRes.on('end', () => {
                try {
                  const result = JSON.parse(data);
                  if (result.code === 0) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true }));
                  } else {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: result.msg || 'kkFileView 删除失败' }));
                  }
                } catch {
                  // kkFileView 可能不返回 JSON，视为部分成功
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                }
              });
            });

            delReq.on('error', (err: NodeJS.ErrnoException) => {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: '无法连接 kkFileView 服务',
                detail: err.message,
              }));
            });

            delReq.end();
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

/** 最大请求体大小限制（50 MB，需支持大文件上传） */
const MAX_BODY_SIZE = 50 * 1024 * 1024;

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
    .replace(/[<>:"/\\|?*\x00-\x1f\s()（）\[\]]/g, '-')  // 替换文件系统不安全字符 + 空格 + 括号（避免URL解析问题）
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
