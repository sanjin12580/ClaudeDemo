// ============================================================
// TravelMap — ECharts 中国地图 + 旅行足迹
// 城市 → 省份映射 + 中心点距离兜底
// 去过的省份绿色高亮，城市金色标记
// ============================================================

import { useEffect, useRef, useState, useMemo } from 'react';
import * as echarts from 'echarts/core';
import { MapChart, ScatterChart, EffectScatterChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import chinaGeoJson from '../data/china.json';
import type { GeoLocation } from '../lib/geocode';
import { CITY_PROVINCE } from '../lib/regions';

echarts.use([MapChart, ScatterChart, EffectScatterChart, TooltipComponent, CanvasRenderer]);

export interface TravelSpot {
  location: GeoLocation;
  events: { title: string; date: string; slug: string }[];
}

interface Props {
  spots: TravelSpot[];
}

/**
 * 根据坐标找到对应省份
 * 优先用内置映射，否则用 GeoJSON 中心点最近距离
 */
function findProvince(lng: number, lat: number, cityName: string): string | null {
  // 1. 城市名直接映射
  if (CITY_PROVINCE[cityName]) return CITY_PROVINCE[cityName];

  // 2. 距离最近省份中心点
  const features = (chinaGeoJson as any).features;
  let best: string | null = null;
  let bestDist = Infinity;
  for (const f of features) {
    const c = f.properties?.center;
    if (!c) continue;
    const dist = (lng - c[0]) ** 2 + (lat - c[1]) ** 2;
    if (dist < bestDist) { bestDist = dist; best = f.properties.name; }
  }
  return best;
}

export default function TravelMap({ spots }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSpot, setSelectedSpot] = useState<TravelSpot | null>(null);

  // 计算去过哪些省份
  const visitedProvinces = useMemo(() => {
    const provinceCount: Record<string, number> = {};
    spots.forEach((spot) => {
      const name = findProvince(spot.location.lon, spot.location.lat, spot.location.name);
      if (name) provinceCount[name] = (provinceCount[name] || 0) + 1;
    });
    return provinceCount;
  }, [spots]);

  useEffect(() => {
    if (!containerRef.current) return;

    echarts.registerMap('china', chinaGeoJson as any);

    const chart = echarts.init(containerRef.current);

    // 省份高亮数据
    const highlitProvinces = Object.keys(visitedProvinces);

    // 散点数据 — value 只有 [lng, lat]，额外数据放自定义字段
    const scatterData = spots.map((spot) => ({
      name: spot.location.name,
      value: [spot.location.lon, spot.location.lat],
      events: spot.events,
      eventCount: spot.events.length,
    }));

    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesType === 'effectScatter') {
            const evs = params.data.events as TravelSpot['events'];
            const list = evs.map((e) => `${e.title} (${e.date})`).join('<br/>');
            return `<strong>📍 ${params.name}</strong><br/>${list}`;
          }
          return params.name;
        },
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        center: [105, 36],
        itemStyle: {
          areaColor: '#f5f5f4',
          borderColor: '#d6d3d1',
          borderWidth: 0.5,
        },
        emphasis: {
          itemStyle: { areaColor: '#e7e5e4' },
          label: { show: false },
        },
        // 去过的省份 — 绿色
        regions: highlitProvinces.map((name) => ({
          name,
          itemStyle: {
            areaColor: '#bfdbfe',
            borderColor: '#3b82f6',
            borderWidth: 1,
          },
          label: {
            show: true,
            color: '#2563eb',
            fontSize: 10,
          },
        })),
      },
      series: [
        {
          type: 'scatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbol: 'path://M0,-9 L2.1,-2.9 L8.6,-2.9 L3.4,1.3 L5.4,8.1 L0,4 L-5.4,8.1 L-3.4,1.3 L-8.6,-2.9 L-2.1,-2.9 Z',
          symbolSize: (_val: number[], params: any) => Math.max(20, (params?.data?.eventCount || 1) * 12),
          itemStyle: {
            color: 'rgba(250, 204, 21, 0.75)',
            borderColor: 'rgba(234, 179, 8, 0.9)',
            borderWidth: 1,
            shadowBlur: 10,
            shadowColor: 'rgba(250, 204, 21, 0.4)',
          },
          label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            fontSize: 12,
            color: '#1c1917',
            fontWeight: 'bold',
            distance: 4,
          },
          zlevel: 2,
        },
        {
          // 涟漪动效
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: scatterData,
          symbolSize: (_val: number[], params: any) => Math.max(16, (params?.data?.eventCount || 1) * 10),
          showEffectOn: 'emphasis',
          rippleEffect: { brushType: 'stroke', scale: 3, period: 3 },
          itemStyle: { color: 'rgba(250, 204, 21, 0.4)' },
          zlevel: 1,
        },
      ],
    });

    chart.on('click', (params: any) => {
      if (params.seriesType === 'effectScatter') {
        const spot = spots.find((s) => s.location.name === params.name);
        if (spot) setSelectedSpot(spot);
      }
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [spots, visitedProvinces]);

  return (
    <div>
      {/* 统计栏 */}
      <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mb-3">
        <span>🗺️ <strong className="text-green-600">{Object.keys(visitedProvinces).length}</strong> 个省份</span>
        <span>🏙️ <strong className="text-amber-500">{spots.length}</strong> 个城市</span>
        <span>📅 {spots.reduce((s, sp) => s + sp.events.length, 0)} 个事件</span>
        <span className="ml-auto flex items-center gap-2">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-200 border border-blue-500" /> 去过</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-stone-100 border border-stone-300" /> 未去</span>
        </span>
      </div>

      {/* 地图 */}
      <div
        ref={containerRef}
        className="w-full rounded-box border border-base-300 overflow-hidden"
        style={{ height: '520px' }}
      />

      {/* 地点列表 */}
      <div className="mt-6 space-y-2">
        {spots
          .sort(
            (a, b) =>
              new Date(b.events[0]?.date ?? 0).getTime() -
              new Date(a.events[0]?.date ?? 0).getTime(),
          )
          .map((spot) => (
            <button
              key={spot.location.name}
              onClick={() => setSelectedSpot(spot)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${
                selectedSpot?.location.name === spot.location.name
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'hover:bg-gray-50 dark:bg-gray-950 border border-transparent'
              }`}
            >
              <span className="text-lg">📍</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{spot.location.name}</span>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {spot.events.map((e, i) => (
                    <span key={e.slug}>
                      {i > 0 && ' · '}
                      {e.title} ({e.date})
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
