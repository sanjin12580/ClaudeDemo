import { useState } from 'react';
import type { GridData, CellData } from '../lib/types';
import { useI18n } from '../lib/i18n';

// 贡献图颜色阶梯
const INTENSITY_COLORS = [
  'bg-gray-100 dark:bg-gray-800',
  'bg-green-200 dark:bg-green-900',
  'bg-green-400 dark:bg-green-700',
  'bg-green-500 dark:bg-green-600',
  'bg-green-700 dark:bg-green-400',
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

export default function LifeGrid({ data }: Props) {
  const { lifeGrid: t } = useI18n();
  const [tooltip, setTooltip] = useState<{ cell: CellData; x: number; y: number } | null>(null);

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
              className="text-xs text-gray-400 dark:text-gray-600 text-right font-mono leading-[14px] h-[14px]"
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
                className="text-[10px] text-gray-400 dark:text-gray-600"
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

                  return (
                    <div
                      key={week}
                      className={`w-3 h-3 rounded-sm ${INTENSITY_COLORS[intensity]}
                        ${hasEvents ? 'cursor-pointer hover:ring-2 hover:ring-green-500 hover:scale-125 transition-transform' : ''}`}
                      title={t.tooltip(year, week + 1) + (hasEvents ? ` — ${cell.events.map((e) => e.title).join(', ')}` : '')}
                      onMouseEnter={(e) => {
                        if (hasEvents) {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setTooltip({ cell: cell!, x: rect.left, y: rect.bottom + 4 });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
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

      <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
        <span>{t.less}</span>
        {INTENSITY_COLORS.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span>{t.more}</span>
      </div>
    </div>
  );
}
