// ============================================================
// ModuleNav — 管理端左侧图标导航（lucide 图标 + 数量角标）
// ============================================================

import {
  CalendarDays,
  FileText,
  BookOpen,
  Target,
  FolderOpen,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminMode = 'events' | 'posts' | 'profile' | 'goals' | 'media' | 'consumptions';

const ICONS: Record<AdminMode, LucideIcon> = {
  events: CalendarDays,
  posts: FileText,
  consumptions: BookOpen,
  goals: Target,
  media: FolderOpen,
  profile: UserRound,
};

export interface NavTab {
  key: AdminMode;
  label: string;
  count: number;
}

interface Props {
  tabs: NavTab[];
  mode: AdminMode;
  ariaLabel: string;
  onSwitch: (mode: AdminMode) => void;
}

export default function ModuleNav({ tabs, mode, ariaLabel, onSwitch }: Props) {
  return (
    <nav
      className="w-16 shrink-0 border-r border-border/60 bg-background py-2 flex flex-col items-center gap-1"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const Icon = ICONS[tab.key];
        const active = mode === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSwitch(tab.key)}
            title={`${tab.label} · ${tab.count}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative w-12 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] transition-colors',
              active
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <span className="relative leading-none">
              <Icon className="size-5" />
              <span
                className={cn(
                  'absolute -top-1.5 -right-2.5 text-[9px] leading-none px-1 py-0.5 rounded-full',
                  active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
