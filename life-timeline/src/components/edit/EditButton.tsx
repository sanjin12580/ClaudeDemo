// ============================================================
// EditButton — 公共页卡片上的编辑按钮（仅 dev 渲染）
// ============================================================

interface Props {
  onClick: () => void;
  title: string;
  className?: string;
  /** light: 浅色卡片；dark: 封面/图片上的深色半透明胶囊 */
  tone?: 'light' | 'dark';
}

export default function EditButton({ onClick, title, className = '', tone = 'light' }: Props) {
  const base =
    'inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-xs shadow-sm backdrop-blur-sm transition-colors';
  const toneCls =
    tone === 'dark'
      ? 'border border-white/20 bg-black/45 text-white hover:bg-black/60'
      : 'border border-base-300 bg-base-100/85 text-base-content hover:bg-base-200';
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      title={title}
      aria-label={title}
      className={`${base} ${toneCls} ${className}`}
    >
      ✏️
    </button>
  );
}
