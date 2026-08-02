// ============================================================
// DashboardCharts — 总览图表（分类分布环形图 + 年度事件趋势柱状图）
// 沿用 TravelMap 的 ECharts 按需引入模式
// ============================================================

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useI18n } from '../lib/i18n';

echarts.use([PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]);

export interface ChartDatum {
  name: string;
  value: number;
}

export interface TrendDatum {
  year: number;
  count: number;
}

interface Props {
  categoryData: ChartDatum[];
  trendData: TrendDatum[];
}

const PALETTE = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#94a3b8'];

export default function DashboardCharts({ categoryData, trendData }: Props) {
  const { dashboard: t } = useI18n();
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pieRef.current) return;
    const chart = echarts.init(pieRef.current);
    chart.setOption({
      color: PALETTE,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, textStyle: { color: '#9ca3af' } },
      series: [
        {
          name: t.chartCategories,
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%', color: '#6b7280', fontSize: 11 },
          data: categoryData.length > 0 ? categoryData : [{ name: t.noData, value: 0 }],
        },
      ],
    });
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [categoryData, t]);

  useEffect(() => {
    if (!barRef.current) return;
    const chart = echarts.init(barRef.current);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 16, top: 16, bottom: 30 },
      xAxis: {
        type: 'category',
        data: trendData.map((d) => String(d.year)),
        axisLabel: { color: '#9ca3af' },
        axisLine: { lineStyle: { color: 'rgba(148,163,184,.35)' } },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#9ca3af' },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,.18)' } },
      },
      series: [
        {
          type: 'bar',
          data: trendData.map((d) => d.count),
          barMaxWidth: 28,
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        },
      ],
    });
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [trendData]);

  const chartCard =
    'card bg-base-100 border border-base-300 p-5 shadow-sm';

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className={chartCard}>
        <h3 className="text-sm font-semibold mb-3">{t.chartCategories}</h3>
        {categoryData.length === 0 ? (
          <p className="text-sm text-gray-400 py-16 text-center">{t.noData}</p>
        ) : (
          <div ref={pieRef} className="w-full" style={{ height: 300 }} />
        )}
      </div>
      <div className={chartCard}>
        <h3 className="text-sm font-semibold mb-3">{t.chartTrend}</h3>
        {trendData.length === 0 ? (
          <p className="text-sm text-gray-400 py-16 text-center">{t.noData}</p>
        ) : (
          <div ref={barRef} className="w-full" style={{ height: 300 }} />
        )}
      </div>
    </section>
  );
}
