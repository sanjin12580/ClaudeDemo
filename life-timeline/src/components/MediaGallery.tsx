import { useState, useMemo } from 'react';
import type { MediaItem } from '../lib/types';
import { getIconForFile } from '../lib/types';
import { useI18n } from '../lib/i18n';
import { getPreviewUrl, formatFileSize, getFileUrl } from '../lib/filePreview';

const FILE_TYPES: Array<{ key: string; label: string; icon: string }> = [
  { key: '全部', label: '全部', icon: '📋' },
  { key: 'image', label: '图片', icon: '🖼️' },
  { key: 'document', label: '文档', icon: '📄' },
  { key: 'pdf', label: 'PDF', icon: '📑' },
  { key: 'video', label: '视频', icon: '🎬' },
  { key: 'audio', label: '音频', icon: '🎵' },
  { key: 'archive', label: '压缩包', icon: '📦' },
  { key: 'text', label: '文本', icon: '📝' },
  { key: 'mindmap', label: '思维导图', icon: '🧠' },
  { key: 'cad', label: 'CAD/3D', icon: '📐' },
  { key: 'other', label: '其他', icon: '📎' },
];

export default function MediaGallery({ media }: { media: MediaItem[] }) {
  const { gallery: t } = useI18n();

  const [selectedType, setSelectedType] = useState('全部');
  const [selectedAlbum, setSelectedAlbum] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  // 提取相册列表
  const albums = useMemo(() => {
    const set = new Set<string>();
    media.forEach((m) => set.add(m.album || '未分类'));
    return ['全部', ...Array.from(set).sort()];
  }, [media]);

  // 筛选
  const filtered = useMemo(() => {
    let result = media;
    if (selectedType !== '全部') {
      result = result.filter((m) => m.fileType === selectedType);
    }
    if (selectedAlbum !== '全部') {
      result = result.filter((m) => (m.album || '未分类') === selectedAlbum);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.filename.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          m.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return result;
  }, [media, selectedType, selectedAlbum, searchQuery]);

  if (media.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 dark:text-gray-500">
        <div className="text-6xl mb-4">📁</div>
        <p className="text-lg">{t.empty}</p>
      </div>
    );
  }

  return (
    <div>
      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* 类型筛选 */}
        <div className="flex flex-wrap gap-1">
          {FILE_TYPES.map((ft) => (
            <button
              key={ft.key}
              onClick={() => setSelectedType(ft.key)}
              className={`btn btn-sm rounded-full
                ${selectedType === ft.key
                  ? 'btn-primary'
                  : 'btn-ghost'
                }`}
            >
              <span className="mr-1">{ft.icon}</span>
              {ft.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* 搜索 */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="input input-bordered input-sm w-48 bg-base-100"
        />
      </div>

      {/* 相册筛选 */}
      {albums.length > 2 && (
        <div className="flex flex-wrap gap-1 mb-6">
          {albums.map((album) => (
            <button
              key={album}
              onClick={() => setSelectedAlbum(album)}
              className={`btn btn-xs rounded-full
                ${selectedAlbum === album
                  ? 'btn-primary'
                  : 'btn-ghost'
                }`}
            >
              {album}
            </button>
          ))}
        </div>
      )}

      {/* 计数 */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        {filtered.length === media.length
          ? `共 ${media.length} 个文件`
          : `${filtered.length} / ${media.length} 个文件`}
      </p>

      {/* 空结果 */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p>{t.noResults}</p>
        </div>
      )}

      {/* 媒体网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <div key={item.id}>
            {item.fileType === 'image' ? (
              /* 图片：点击打开灯箱 */
              <button
                onClick={() => setLightboxItem(item)}
                className="group card bg-base-100 border border-base-300 overflow-hidden
                  shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-left"
              >
                <div className="aspect-[4/3] bg-base-200 overflow-hidden">
                  <img
                    src={getFileUrl(item.url)}
                    alt={item.title || item.filename}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">
                    {item.title || item.filename}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                    {item.album !== '未分类' ? item.album : ''}
                  </p>
                </div>
              </button>
            ) : (
              /* 非图片：点击跳转 kkFileView 预览 */
              <a
                href={getPreviewUrl(item.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="group card bg-base-100 border border-base-300 overflow-hidden
                  shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-green-500 block"
              >
                <div className="aspect-[4/3] bg-base-200 flex items-center justify-center">
                  <span className="text-5xl opacity-40">{getIconForFile(item.filename, item.fileType)}</span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200">
                    {item.title || item.filename}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                    {item.filename.match(/\.([^.]+)$/) ? (
                      <span className="inline-block px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-mono">
                        .{item.filename.split('.').pop()?.toUpperCase()}
                      </span>
                    ) : null}
                    {formatFileSize(item.fileSize)}
                    {item.album !== '未分类' ? ` · ${item.album}` : ''}
                  </p>
                </div>
              </a>
            )}
          </div>
        ))}
      </div>

      {/* 灯箱 */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setLightboxItem(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl z-10"
            onClick={() => setLightboxItem(null)}
          >
            ✕
          </button>
          <img
            src={getFileUrl(lightboxItem.url)}
            alt={lightboxItem.title || lightboxItem.filename}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
          {/* 图片信息 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
            <span className="font-medium">{lightboxItem.title || lightboxItem.filename}</span>
            {lightboxItem.description && (
              <span className="text-white/60 ml-2">— {lightboxItem.description}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
