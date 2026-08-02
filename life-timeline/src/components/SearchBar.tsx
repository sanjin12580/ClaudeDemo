import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { EventMeta } from '../lib/types';
import { CATEGORY_COLORS } from '../lib/types';
import { useI18n } from '../lib/i18n';
import { to, formatDate } from '../lib/base';

interface Props {
  events: EventMeta[];
  onQueryChange?: (query: string) => void;
}

export default function SearchBar({ events, onQueryChange }: Props) {
  const { search: t } = useI18n();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 搜索过滤
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const scored = events
      .map((event) => {
        let score = 0;
        if (event.title.toLowerCase().includes(q)) score += 10;
        if (event.title.toLowerCase() === q) score += 20;
        if (event.category.includes(q)) score += 5;
        const matchedTags = event.tags.filter((tag) => tag.toLowerCase().includes(q));
        if (matchedTags.length > 0) score += matchedTags.length * 3;
        if (event.location?.toLowerCase().includes(q)) score += 3;
        const bodyLower = event.body.toLowerCase();
        if (bodyLower.includes(q)) score += 1;
        const bodyMatches = (bodyLower.match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        score += bodyMatches * 0.5;
        return { event, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    return scored.map((r) => r.event);
  }, [query, events]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [close]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && query.trim() && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (e.key === 'Escape') {
      close();
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      window.location.href = to(`/events/${results[activeIndex].slug}`);
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLLIElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  function highlight(text: string): React.ReactNode {
    if (!query.trim()) return text;
    const q = query.trim();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-warning/30 text-inherit rounded-sm px-0.5">{part}</mark> : part,
    );
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* 搜索输入 */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-gray-600"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            setOpen(true);
            setActiveIndex(-1);
            onQueryChange?.(v);
          }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          className="input input-bordered w-full pl-10 pr-10 text-sm bg-white dark:bg-gray-900"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); close(); onQueryChange?.(''); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:text-gray-400 transition-colors"
            aria-label={t.clear}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 搜索结果下拉 */}
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-base-100 border border-base-300
                        rounded-box shadow-lg overflow-hidden z-50">
          <div className="px-3 py-2 text-xs text-base-content/60 border-b border-base-300">
            {t.results(results.length)}
          </div>
          <ul ref={listRef} className="max-h-80 overflow-y-auto py-1">
            {results.map((event, i) => {
              const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['其他'];
              return (
                <li key={event.slug}>
                  <a
                    href={to(`/events/${event.slug}`)}
                    className={`flex items-start gap-3 px-3 py-2.5 transition-colors cursor-pointer
                      ${i === activeIndex
                        ? 'bg-green-50 dark:bg-green-950'
                        : 'hover:bg-gray-50 dark:bg-gray-950'
                      }`}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span className={`badge badge-sm shrink-0 mt-0.5 ${catColor}`}>
                      {event.category}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{highlight(event.title)}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatDate(event.date)}
                        {event.location && ` · ${event.location}`}
                      </div>
                    </div>
                    <span className="text-xs text-gray-200 dark:text-gray-700 shrink-0 mt-1">↗</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 无结果 */}
      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-base-100 border border-base-300
                        rounded-box shadow-lg overflow-hidden z-50">
          <div className="px-4 py-6 text-center text-sm text-base-content/60">
            {t.noResults}
          </div>
        </div>
      )}
    </div>
  );
}
