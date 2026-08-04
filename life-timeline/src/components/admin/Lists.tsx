// ============================================================
// Lists — 管理端各模块的列表列（事件/文章/目标/清单/媒体）
// ============================================================

import { useState } from 'react';
import type { EventMeta, PostMeta, Goal, MediaItem, Category } from '../../lib/types';
import { CATEGORY_COLORS, getIconForFile } from '../../lib/types';
import type { ConsumptionItem } from '../../lib/parseConsumptions';
import { getFileUrl } from '../../lib/filePreview';
import { coverUrl } from '../../lib/base';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const CATEGORIES: Category[] = ['教育', '工作', '旅行', '健康', '关系', '项目', '其他'];

function ListHeader({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="p-4 border-b border-border/60 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">{title}</h2>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      {children}
    </div>
  );
}

function Row({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 cursor-pointer transition-colors hover:bg-accent',
        active ? 'bg-primary/10 border-l-2 border-primary' : 'border-l-2 border-transparent'
      )}
    >
      {children}
    </button>
  );
}

// ========== 事件 / 文章列表 ==========
interface EventPostListProps {
  mode: 'events' | 'posts';
  items: Array<EventMeta | PostMeta>;
  count: number;
  search: string;
  categoryFilter: string;
  selectedSlug: string | null;
  labels: {
    listTitle: string;
    search: string;
    newBtn: string;
    empty: string;
    draftBadge: string;
    allCategories: string;
  };
  onSearch: (q: string) => void;
  onCategory: (c: string) => void;
  onSelect: (item: EventMeta | PostMeta) => void;
  onNew: () => void;
}

export function EventPostList({
  mode,
  items,
  count,
  search,
  categoryFilter,
  selectedSlug,
  labels,
  onSearch,
  onCategory,
  onSelect,
  onNew,
}: EventPostListProps) {
  return (
    <>
      <ListHeader title={labels.listTitle} count={count}>
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={labels.search}
          className="h-8 text-xs"
        />
        {mode === 'events' && (
          <div className="flex gap-1 flex-wrap">
            {['全部', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategory(cat)}
                className={cn(
                  'text-[11px] px-2 py-0.5 rounded-full transition-colors',
                  categoryFilter === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        <Button size="sm" className="w-full" onClick={onNew}>
          {labels.newBtn}
        </Button>
      </ListHeader>

      <div className="flex-1 overflow-y-auto">
        {count === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">{labels.empty}</div>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((item) => {
              const isEvent = mode === 'events';
              const ev = item as EventMeta;
              const catColor = isEvent
                ? CATEGORY_COLORS[ev.category] || CATEGORY_COLORS['其他']
                : '';
              return (
                <Row key={item.slug} active={selectedSlug === item.slug} onClick={() => onSelect(item)}>
                  <div className="flex items-center gap-2 mb-1">
                    {isEvent ? (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${catColor}`}>
                        {ev.category}
                      </span>
                    ) : (
                      item.tags.slice(0, 2).map((tg) => (
                        <span key={tg} className="text-[10px] text-muted-foreground">
                          #{tg}
                        </span>
                      ))
                    )}
                    {item.draft && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        {labels.draftBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground font-mono">{item.date}</span>
                    {isEvent && <span className="text-[11px] text-yellow-500">{'★'.repeat(ev.importance)}</span>}
                  </div>
                </Row>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ========== 目标列表 ==========
interface GoalListProps {
  goals: Goal[];
  selectedId: string | null;
  labels: {
    title: string;
    newBtn: string;
    empty: string;
    statusActive: string;
    statusCompleted: string;
    statusPaused: string;
    short: string;
    long: string;
  };
  onSelect: (goal: Goal) => void;
  onNew: () => void;
}

export function GoalList({ goals, selectedId, labels, onSelect, onNew }: GoalListProps) {
  return (
    <>
      <ListHeader title={labels.title} count={goals.length}>
        <Button size="sm" className="w-full" onClick={onNew}>
          {labels.newBtn}
        </Button>
      </ListHeader>
      <div className="flex-1 overflow-y-auto">
        {goals.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">{labels.empty}</div>
        ) : (
          <div className="divide-y divide-border/50">
            {goals.map((goal) => {
              const statusCls =
                goal.status === 'completed'
                  ? 'badge-success'
                  : goal.status === 'paused'
                    ? 'badge-ghost'
                    : 'badge-info';
              const statusLabel =
                goal.status === 'completed'
                  ? labels.statusCompleted
                  : goal.status === 'paused'
                    ? labels.statusPaused
                    : labels.statusActive;
              return (
                <Row key={goal.id} active={selectedId === goal.id} onClick={() => onSelect(goal)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge badge-xs ${statusCls}`}>{statusLabel}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {goal.category === 'short' ? labels.short : labels.long}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{goal.title}</p>
                  <div className="mt-1.5 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        goal.status === 'paused' ? 'bg-muted-foreground/40' : 'bg-primary'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block text-right">
                    {goal.progress}%
                  </span>
                </Row>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ========== 清单列表 ==========
interface ConsumptionListProps {
  items: ConsumptionItem[];
  selectedId: string | null;
  labels: {
    title: string;
    newBtn: string;
    empty: string;
    search: string;
    all: string;
    typeOptions: Record<string, string>;
    statusOptions: Record<string, string>;
  };
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ConsumptionListPanel({
  items,
  selectedId,
  labels,
  onSelect,
  onNew,
}: ConsumptionListProps) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');

  const typeCounts = new Map<string, number>();
  for (const c of items) {
    typeCounts.set(c.type, (typeCounts.get(c.type) ?? 0) + 1);
  }

  const filtered = items.filter((c) => {
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      (c.author ?? '').toLowerCase().includes(q) ||
      c.tags.some((tag) => tag.toLowerCase().includes(q));
    const matchType = typeFilter === '全部' || c.type === typeFilter;
    const matchStatus = statusFilter === '全部' || c.status === statusFilter;
    return matchQuery && matchType && matchStatus;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <h2 className="font-semibold text-sm">{labels.title}</h2>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div className="px-3 pt-2 space-y-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.search}
            className="h-8 text-xs"
          />
          <Button variant="ghost" size="sm" className="shrink-0 text-primary" onClick={onNew}>
            {labels.newBtn}
          </Button>
        </div>
        {/* 状态筛选 */}
        <div className="flex items-center gap-1 pb-1">
          {['全部', 'doing', 'done'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-[11px] px-2 py-1 rounded-full border transition-colors',
                statusFilter === s
                  ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {s === '全部' ? labels.all : labels.statusOptions[s]}
            </button>
          ))}
        </div>
        {/* 类型 Tab（带计数，横向滚动） */}
        <div className="flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setTypeFilter('全部')}
            className={cn(
              'shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-colors',
              typeFilter === '全部'
                ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {labels.all} {items.length}
          </button>
          {Object.keys(labels.typeOptions).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={cn(
                'shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-colors',
                typeFilter === type
                  ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {labels.typeOptions[type]} {typeCounts.get(type) ?? 0}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">{labels.empty}</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">{labels.search}</p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn(
                'w-full text-left px-3 py-2 rounded-md mb-1 text-xs transition-colors',
                selectedId === c.id
                  ? 'bg-primary/10 border border-primary/40'
                  : 'hover:bg-accent'
              )}
              onClick={() => onSelect(c.id)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {c.cover ? (
                  <img
                    src={coverUrl(c.cover)}
                    alt=""
                    className="w-8 h-11 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-8 h-11 rounded bg-muted shrink-0 grid place-items-center text-base">
                    📦
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {labels.typeOptions[c.type]} · {'⭐'.repeat(c.rating)} ·{' '}
                    {labels.statusOptions[c.status]}
                    {c.year ? ` · ${c.year}` : ''}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ========== 媒体列表 ==========
interface MediaListProps {
  items: MediaItem[];
  selectedId: string | null;
  labels: { title: string; newBtn: string; empty: string };
  onSelect: (item: MediaItem) => void;
  onNew: () => void;
}

export function MediaListPanel({ items, selectedId, labels, onSelect, onNew }: MediaListProps) {
  return (
    <>
      <ListHeader title={labels.title} count={items.length}>
        <Button size="sm" className="w-full" onClick={onNew}>
          {labels.newBtn}
        </Button>
      </ListHeader>
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">{labels.empty}</div>
        ) : (
          <div className="divide-y divide-border/50">
            {items.map((item) => (
              <Row key={item.id} active={selectedId === item.id} onClick={() => onSelect(item)}>
                <div className="flex items-center gap-2">
                  <span className="text-lg shrink-0">
                    {item.fileType === 'image' ? (
                      <img src={getFileUrl(item.url)} alt="" className="w-6 h-6 object-cover rounded" />
                    ) : (
                      <span className="text-base">{getIconForFile(item.filename, item.fileType)}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">{item.title || item.filename}</span>
                    <span className="block text-[10px] text-muted-foreground truncate">{item.filename}</span>
                  </span>
                </div>
              </Row>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
