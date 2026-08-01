import { useState, useMemo, useEffect } from 'react';
import type { GridData, CellData } from '../lib/types';
import { useI18n } from '../lib/i18n';
import { to, formatDate } from '../lib/base';

// 贡献图颜色阶梯 — 使用 daisyUI token
const INTENSITY_COLORS = [
  'bg-gray-50 dark:bg-gray-950',
  'bg-success/30',
  'bg-success/50',
  'bg-success/70',
  'bg-success',
];

// 月份标签
const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

interface Props {
  data: GridData;
}

function getCell(cells: CellData[], year: number, week: number): CellData | undefined {
  return cells.find((c) => c.year === year && c.week === week);
}

/** ISO 周数（与 parseEvents.ts 保持一致） */
function getISOWeek(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export default function LifeGrid({ data }: Props) {
  const { lifeGrid: t } = useI18n();
  const [tooltip, setTooltip] = useState<{ cell: CellData; x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<CellData | null>(null);

  // 当前周（用于高亮）
  const current = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), week: getISOWeek(now) };
  }, []);

  // Esc 关闭弹窗
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const years: number[] = [];
  for (let y = data.startYear; y <= data.endYear; y++) {
    years.push(y);
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-1" style={{ minWidth: 'fit-content' }}>
        <div className="flex flex-col gap-1 pt-5 pr-2 shrink-0">
          {years.map((year) => (
            <div
              key={year}
              className="text-xs text-gray-300 dark:text-gray-600 text-right font-mono leading-[14px] h-[14px]"
            >
              {year}
            </div>
          ))}
        </div>

        <div className="shrink-0">
          <div className="flex gap-1 mb-1 pl-0" style={{ width: 52 * 15 }}>
            {MONTH_LABELS.map((month, i) => (
              <div
                key={month}
                className="text-[10px] text-gray-300 dark:text-gray-600"
                style={{ position: 'relative', left: `${i * (52 / 12) * 15}px` }}
              >
                {month}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            {years.map((year) => (
              <div key={year} className="flex gap-[2px]">
                {Array.from({ length: 52 }, (_, week) => {
                  const cell = getCell(data.cells, year, week + 1);
                  const intensity = cell?.intensity ?? 0;
                  const hasEvents = cell && cell.events.length > 0;
                  const isCurrentWeek = current.year === year && current.week === week + 1;

                  return (
                    <div
                      key={week}
                      role={hasEvents ? 'button' : undefined}
                      tabIndex={hasEvents ? 0 : -1}
                      aria-label={
                        hasEvents
                          ? `${t.tooltip(year, week + 1)} — ${cell!.events.map((e) => e.title).join(', ')}`
                          : t.tooltip(year, week + 1)
                      }
                      className={`w-3 h-3 rounded-sm ${INTENSITY_COLORS[intensity]}
                        ${isCurrentWeek ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}
                        ${hasEvents ? 'cursor-pointer hover:ring-2 hover:ring-green-500 hover:scale-125 transition-transform' : ''}`}
                      title={t.tooltip(year, week + 1) + (hasEvents ? ` — ${cell!.events.map((e) => e.title).join(', ')}` : '')}
                      onMouseEnter={(e) => {
                        if (hasEvents) {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setTooltip({ cell: cell!, x: rect.left, y: rect.bottom + 4 });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => {
                        if (hasEvents) setSelected(cell!);
                      }}
                      onKeyDown={(e) => {
                        if (hasEvents && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          setSelected(cell!);
                        }
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900
                     text-xs rounded-lg px-3 py-2 shadow-lg max-w-[240px] pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-semibold mb-1">
            {t.tooltip(tooltip.cell.year, tooltip.cell.week)}
          </div>
          {tooltip.cell.events.map((e) => (
            <div key={e.slug} className="opacity-80 leading-relaxed">
              • {e.title}
            </div>
          ))}
        </div>
      )}

      {/* 本周事件弹窗 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-5 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold">
                {t.tooltip(selected.year, selected.week)}
              </h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label={t.close}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-1">
              {selected.events.map((e) => (
                <li key={e.slug}>
                  <a
                    href={to(`/events/${e.slug}`)}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-sm font-medium truncate">{e.title}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
                      {formatDate(e.date)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 dark:text-gray-500">
        <span>{t.less}</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span>{t.more}</span>
      </div>
    </div>
  );
}
