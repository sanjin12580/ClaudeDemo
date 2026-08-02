// ============================================================
// TagInput — 标签 chips 输入（Enter/逗号添加，×/退格删除）
// shadcn 风格：Badge + Input
// ============================================================

import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function TagInput({ value, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('');
  const tags = value.split(/[,，]/).map((s) => s.trim()).filter(Boolean);

  const commit = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (!tags.includes(tag)) onChange([...tags, tag].join(', '));
    setDraft('');
  };

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag, i) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              #{tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((_, j) => j !== i).join(', '))}
                className="rounded-sm px-1 text-muted-foreground hover:text-destructive leading-none"
                aria-label={`移除 ${tag}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Backspace' && !draft && tags.length) {
            onChange(tags.slice(0, -1).join(', '));
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={placeholder || '回车或逗号添加标签'}
      />
    </div>
  );
}
