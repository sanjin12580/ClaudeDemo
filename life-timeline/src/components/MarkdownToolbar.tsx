// ============================================================
// MarkdownToolbar — 富文本工具栏（Markdown 语法插入）
// 支持：标题/加粗/斜体/删除线/行内代码/引用/列表/任务/链接/表格
// 分割线/代码块（含 SQL 等语言）/图片（媒体库·上传·URL）/视频（B站/YouTube/本地）
// ============================================================

import { useState, useRef } from 'react';

export interface MarkdownToolbarProps {
  /** 插入模板，{{sel}} 会被替换为光标选中的文本 */
  onInsert: (template: string) => void;
  /** 打开媒体库选择器 */
  onPickImage: () => void;
  /** 触发文件上传（图片/视频等） */
  onUploadImage: () => void;
}

type PopoverKind = 'link' | 'image-url' | 'video' | null;

const CODE_LANGS = [
  'sql', 'javascript', 'typescript', 'python', 'bash',
  'html', 'css', 'json', 'java', 'go', 'rust', 'yaml', 'text',
];

const BTN =
  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ' +
  'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ' +
  'transition-colors whitespace-nowrap';
const SEP = 'w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0';

export default function MarkdownToolbar({ onInsert, onPickImage, onUploadImage }: MarkdownToolbarProps) {
  const [popover, setPopover] = useState<PopoverKind>(null);
  const [url, setUrl] = useState('');
  const [codeLang, setCodeLang] = useState('sql');
  const urlInputRef = useRef<HTMLInputElement>(null);

  function open(kind: PopoverKind) {
    setPopover(kind);
    setUrl('');
    setTimeout(() => urlInputRef.current?.focus(), 50);
  }
  function close() {
    setPopover(null);
    setUrl('');
  }

  function submit() {
    const v = url.trim();
    if (!v) return;
    if (popover === 'link') onInsert(`[{{sel}}](${v})`);
    else if (popover === 'image-url') onInsert(`\n![{{sel}}](${v})\n`);
    else if (popover === 'video') onInsert(videoEmbed(v));
    close();
  }

  function videoEmbed(v: string): string {
    const bv = v.match(/bilibili\.com\/video\/(BV[0-9A-Za-z]+)/i);
    if (bv) {
      return `\n<iframe src="//player.bilibili.com/player.html?bvid=${bv[1]}&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width:100%;aspect-ratio:16/9;border:none;"></iframe>\n`;
    }
    const yt = v.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i);
    if (yt) {
      return `\n<iframe src="https://www.youtube.com/embed/${yt[1]}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%;aspect-ratio:16/9;border:none;"></iframe>\n`;
    }
    if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(v)) {
      return `\n<video controls src="${v}" style="width:100%;border-radius:0.75rem;"></video>\n`;
    }
    return `\n<iframe src="${v}" scrolling="no" frameborder="no" allowfullscreen="true" style="width:100%;aspect-ratio:16/9;border:none;"></iframe>\n`;
  }

  const popoverMeta: Record<NonNullable<PopoverKind>, { title: string; placeholder: string; btn: string }> = {
    link: { title: '插入链接', placeholder: 'https://…', btn: '插入链接' },
    'image-url': { title: '插入图片（外链）', placeholder: 'https://…/图片.png', btn: '插入图片' },
    video: { title: '插入视频', placeholder: 'B站 / YouTube / 视频文件 URL', btn: '插入视频' },
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700 px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-y-1">
        {/* 标题 */}
        <button type="button" title="一级标题" className={BTN} onClick={() => onInsert('\n# {{sel}}\n')}>H1</button>
        <button type="button" title="二级标题" className={BTN} onClick={() => onInsert('\n## {{sel}}\n')}>H2</button>
        <button type="button" title="三级标题" className={BTN} onClick={() => onInsert('\n### {{sel}}\n')}>H3</button>
        <div className={SEP} />

        {/* 行内格式 */}
        <button type="button" title="加粗" className={BTN} onClick={() => onInsert('**{{sel}}**')}><strong>B</strong></button>
        <button type="button" title="斜体" className={BTN} onClick={() => onInsert('*{{sel}}*')}><em>I</em></button>
        <button type="button" title="删除线" className={BTN} onClick={() => onInsert('~~{{sel}}~~')}><del>S</del></button>
        <button type="button" title="行内代码" className={BTN} onClick={() => onInsert('`{{sel}}`')}>&lt;/&gt;</button>
        <div className={SEP} />

        {/* 块级 */}
        <button type="button" title="引用" className={BTN} onClick={() => onInsert('> {{sel}}\n')}>❝ 引用</button>
        <button type="button" title="无序列表" className={BTN} onClick={() => onInsert('- {{sel}}\n')}>• 列表</button>
        <button type="button" title="有序列表" className={BTN} onClick={() => onInsert('1. {{sel}}\n')}>1. 列表</button>
        <button type="button" title="任务列表" className={BTN} onClick={() => onInsert('- [ ] {{sel}}\n')}>☑ 任务</button>
        <button type="button" title="分割线" className={BTN} onClick={() => onInsert('\n---\n')}>—</button>
        <div className={SEP} />

        {/* 链接/表格 */}
        <button type="button" title="插入链接" className={BTN} onClick={() => open('link')}>🔗 链接</button>
        <button type="button" title="插入表格" className={BTN} onClick={() => onInsert('\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n|  |  |  |\n')}>▦ 表格</button>
        <div className={SEP} />

        {/* 代码块 */}
        <div className="inline-flex items-center gap-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">代码块</span>
          <select
            value={codeLang}
            onChange={(e) => setCodeLang(e.target.value)}
            title="代码语言"
            className="text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-1.5 py-1 outline-none focus:ring-2 focus:ring-green-500"
          >
            {CODE_LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <button
            type="button"
            title={`插入代码块（${codeLang}）`}
            className={BTN}
            onClick={() => onInsert(`\n\`\`\`${codeLang}\n{{sel}}\n\`\`\`\n`)}
          >
            ＋
          </button>
        </div>
        <div className={SEP} />

        {/* 图片 / 视频 */}
        <button type="button" title="从媒体库选择图片" className={BTN} onClick={onPickImage}>🖼️ 媒体库</button>
        <button type="button" title="上传图片/文件并插入" className={BTN} onClick={onUploadImage}>⬆️ 上传</button>
        <button type="button" title="通过 URL 插入图片" className={BTN} onClick={() => open('image-url')}>图片 URL</button>
        <button type="button" title="插入视频（B站/YouTube/本地）" className={BTN} onClick={() => open('video')}>🎬 视频</button>
      </div>

      {/* 输入弹层（链接/图片URL/视频） */}
      {popover && (
        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">{popoverMeta[popover].title}</p>
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') close();
              }}
              placeholder={popoverMeta[popover].placeholder}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
          >
            {popoverMeta[popover].btn}
          </button>
          <button
            type="button"
            onClick={close}
            className="shrink-0 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
