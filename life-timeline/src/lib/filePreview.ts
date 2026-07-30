// ============================================================
// kkFileView 文件预览 URL 生成 + 文件类型工具
// ============================================================

import { siteConfig } from '../site.config';
import type { FileType } from './types';
import { ALLOWED_EXTENSIONS, classifyFileType, FILE_TYPE_ICONS, getIconForFile } from './types';

/** 将字符串转为 Base64（UTF-8 安全） */
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/** 根据 kkFileView 相对路径（如 "demo/xxx.pdf"）生成预览 URL */
export function getPreviewUrl(relativePath: string, base?: string): string {
  const kkBase = base || siteConfig.kkFileViewUrl;
  // 构造 kkFileView 上的完整文件 URL
  // kkFileView 通过 WebConfig.addResourceHandlers 将 fileDir 映射为静态资源
  const fullFileUrl = `${kkBase}/${relativePath}`;
  // kkFileView v5+ 要求 url 参数必须是 Base64 编码（服务端用 Base64.decodeBase64 解码）
  // 参考：OnlinePreviewController.onlinePreview → WebUtils.decodeUrl → decodeBase64String
  const base64Url = toBase64(fullFileUrl);
  return `${kkBase}/onlinePreview?url=${encodeURIComponent(base64Url)}`;
}

/** 根据 kkFileView 相对路径构造文件访问 URL（用于图片直接加载） */
export function getFileUrl(relativePath: string, base?: string): string {
  const kkBase = base || siteConfig.kkFileViewUrl;
  return `${kkBase}/${relativePath}`;
}

/** 根据扩展名获取文件大类 */
export { classifyFileType as getFileType };

/** 获取文件类型 emoji 图标 */
export function getFileIcon(fileType: FileType): string {
  return FILE_TYPE_ICONS[fileType];
}

/** 根据文件名获取最佳图标（优先扩展名精确匹配，回退到大类） */
export function getExtensionIcon(filename: string): string {
  return getIconForFile(filename);
}

/** 获取文件扩展名（小写） */
export function getExtension(filename: string): string {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/** 格式化文件大小 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 检查文件扩展名是否允许 */
export function isAllowedFile(filename: string): boolean {
  const ext = getExtension(filename);
  if (!ext) return false;
  const allExts = new Set(Object.values(ALLOWED_EXTENSIONS).flat());
  return allExts.has(ext);
}
