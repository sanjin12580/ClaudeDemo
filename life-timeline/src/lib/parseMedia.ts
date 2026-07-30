import type { MediaItem, MediaData } from './types';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 从 src/data/media.json 加载媒体数据
 */
export async function loadMedia(): Promise<MediaItem[]> {
  const filePath = path.resolve(process.cwd(), 'src', 'data', 'media.json');

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: MediaData = JSON.parse(raw);
    return data.media || [];
  } catch {
    return [];
  }
}

/**
 * 从媒体列表中提取所有相册名（去重）
 */
export function getAlbums(media: MediaItem[]): string[] {
  const albums = new Set<string>();
  for (const item of media) {
    albums.add(item.album || '未分类');
  }
  return Array.from(albums).sort();
}
