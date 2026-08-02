// ============================================================
// MarkdownToolbar — 富文本工具栏（Markdown 语法插入）
// 支持：标题/加粗/斜体/删除线/行内代码/引用/列表/任务/链接/表格
// 分割线/代码块（含 SQL 等语言）/图片（媒体库·上传·URL）/视频（B站/YouTube/本地）
// v1.5.0：按钮与输入改为 shadcn 风格
// ============================================================

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

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

const toolBtn =
  'h-7 px-2 text-xs rounded-md whitespace-nowrap';
const SEP = 'w-px h-5 bg-border mx-1 shrink-0';

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
    <div className="bg-muted/40 border-b border-border/60 px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-y-1">
        {/* 标题 */}
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="一级标题" onClick={() => onInsert('\n# {{sel}}\n')}>H1</Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="二级标题" onClick={() => onInsert('\n## {{sel}}\n')}>H2</Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="三级标题" onClick={() => onInsert('\n### {{sel}}\n')}>H3</Button>
        <div className={SEP} />

        {/* 行内格式 */}
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="加粗" onClick={() => onInsert('**{{sel}}**')}><strong>B</strong></Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="斜体" onClick={() => onInsert('*{{sel}}*')}><em>I</em></Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="删除线" onClick={() => onInsert('~~{{sel}}~~')}><del>S</del></Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="行内代码" onClick={() => onInsert('`{{sel}}`')}>&lt;/&gt;</Button>
        <div className={SEP} />

        {/* 块级 */}
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="引用" onClick={() => onInsert('> {{sel}}\n')}>❝ 引用</Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="无序列表" onClick={() => onInsert('- {{sel}}\n')}>• 列表</Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="有序列表" onClick={() => onInsert('1. {{sel}}\n')}>1. 列表</Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="任务列表" onClick={() => onInsert('- [ ] {{sel}}\n')}>☑ 任务</Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="分割线" onClick={() => onInsert('\n---\n')}>—</Button>
        <div className={SEP} />

        {/* 链接/表格 */}
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="插入链接" onClick={() => open('link')}>🔗 链接</Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="插入表格" onClick={() => onInsert('\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n|  |  |  |\n')}>▦ 表格</Button>
        <div className={SEP} />

        {/* 代码块 */}
        <div className="inline-flex items-center gap-1">
          <span className="text-xs text-muted-foreground">代码块</span>
          <select
            value={codeLang}
            onChange={(e) => setCodeLang(e.target.value)}
            title="代码语言"
            className="h-8 rounded-md border border-input bg-background px-1.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          >
            {CODE_LANGS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={toolBtn}
            title={`插入代码块（${codeLang}）`}
            onClick={() => onInsert(`\n\`\`\`${codeLang}\n{{sel}}\n\`\`\`\n`)}
          >
            ＋
          </Button>
        </div>
        <div className={SEP} />

        {/* 图片 / 视频 */}
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="从媒体库选择图片" onClick={onPickImage}>🖼️ 媒体库</Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="上传图片/文件并插入" onClick={onUploadImage}>⬆️ 上传</Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="通过 URL 插入图片" onClick={() => open('image-url')}>图片 URL</Button>
        <Button type="button" variant="ghost" size="sm" className={toolBtn} title="插入视频（B站/YouTube/本地）" onClick={() => open('video')}>🎬 视频</Button>
      </div>

      {/* 输入弹层（链接/图片URL/视频） */}
      {popover && (
        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-background border border-border">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground mb-1">{popoverMeta[popover].title}</p>
            <Input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') close();
              }}
              placeholder={popoverMeta[popover].placeholder}
              className="h-8 text-xs"
            />
          </div>
          <Button type="button" size="sm" onClick={submit}>
            {popoverMeta[popover].btn}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={close}>
            取消
          </Button>
        </div>
      )}
    </div>
  );
}
