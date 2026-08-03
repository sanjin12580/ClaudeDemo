// ============================================================
// TravelMap — Leaflet 真实底图旅行足迹地图
// 访问类型分色图钉 + Popup 照片/事件 + 访问顺序连线
// 瓦片源：天地图 / OSM / 高德 / 无底图（页面内切换）
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Category } from '../lib/types';
import type { GeoLocation } from '../lib/geocode';
import { to } from '../lib/base';
import { useI18n } from '../lib/i18n';
import {
  TILE_PROVIDERS,
  buildTileSpecs,
  wgs84ToGcj02,
  type TileProviderId,
} from '../lib/tileProviders';

/** 访问类型（由事件分类归并） */
export type VisitType = 'travel' | 'work' | 'edu' | 'health' | 'other';

/** 访问类型 → 图钉颜色 */
export const VISIT_TYPE_COLORS: Record<VisitType, string> = {
  travel: '#f59e0b',
  work: '#3b82f6',
  edu: '#8b5cf6',
  health: '#22c55e',
  other: '#94a3b8',
};

/** 访问类型 → daisyUI badge 类名 */
const VISIT_TYPE_BADGE: Record<VisitType, string> = {
  travel: 'badge-warning',
  work: 'badge-primary',
  edu: 'badge-secondary',
  health: 'badge-success',
  other: 'badge-ghost',
};

export interface TravelSpotEvent {
  title: string;
  date: string;
  slug: string;
  category: Category;
}

export interface TravelSpot {
  location: GeoLocation;
  province: string | null;
  primaryType: VisitType;
  events: TravelSpotEvent[];
  photos: string[];
}

interface Props {
  spots: TravelSpot[];
  /** 天地图浏览器端 Key（服务端注入，避免打进所有客户端 chunk） */
  tdtKey?: string;
}

/** 城市图钉 SVG 图标（颜色按类型、尺寸按事件数） */
function makePinIcon(type: VisitType, eventCount: number): L.DivIcon {
  const color = VISIT_TYPE_COLORS[type];
  const size = Math.min(42, 24 + Math.min(Math.max(eventCount, 1), 5) * 4);
  const html = `
    <div style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 24 24" width="${size}" height="${size}" style="display:block">
        <path d="M12 1C7.03 1 3 5.03 3 10c0 6.63 9 13 9 13s9-6.37 9-13c0-4.97-4.03-9-9-9z"
          fill="${color}" stroke="#ffffff" stroke-width="1.2"/>
        <circle cx="12" cy="10" r="3.1" fill="#ffffff"/>
      </svg>
    </div>`;
  return L.divIcon({
    className: 'travel-pin-wrap',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 5],
  });
}

/** 连线方向箭头图标 */
function makeArrowIcon(angleDeg: number): L.DivIcon {
  return L.divIcon({
    className: 'travel-arrow-wrap',
    html: `<div style="transform:rotate(${angleDeg}deg)"><svg width="14" height="14" viewBox="0 0 10 10"><path d="M1 1 L9 5 L1 9 Z" fill="#64748b" stroke="#ffffff" stroke-width="0.8"/></svg></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

/** 两点方向角（度），参数为 [纬度, 经度] */
function bearing(a: [number, number], b: [number, number]): number {
  return (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
}

export default function TravelMap({ spots, tdtKey }: Props) {
  const t = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<{ base?: L.TileLayer; labels?: L.TileLayer }>({});
  const markersRef = useRef<L.LayerGroup | null>(null);
  const linesRef = useRef<L.LayerGroup | null>(null);
  const markerByCityRef = useRef<Map<string, L.Marker>>(new Map());
  const fittedKeyRef = useRef('');

  const [provider, setProvider] = useState<TileProviderId>(tdtKey ? 'tianditu' : 'osm');
  const [showLines, setShowLines] = useState(true);
  const [activeSpot, setActiveSpot] = useState<string | null>(null);

  /** Popup HTML（动态字符串，样式由 global.css 的 .travel-popup 系列定义） */
  const popupHtml = (spot: TravelSpot): string => {
    const typeName = t.travel.visitTypes[spot.primaryType];
    const photo = spot.photos[0];
    const list = spot.events
      .map(
        (e) =>
          `<li><a class="travel-popup-link" href="${to(`/events/${e.slug}`)}">${e.title}</a><span class="travel-popup-date">${e.date}</span></li>`,
      )
      .join('');
    return `
      <div class="travel-popup">
        <div class="travel-popup-head">
          <span class="travel-popup-city">${spot.location.name}</span>
          <span class="travel-popup-badge" style="background:${VISIT_TYPE_COLORS[spot.primaryType]}22;color:${VISIT_TYPE_COLORS[spot.primaryType]}">${typeName}</span>
        </div>
        ${photo ? `<img class="travel-popup-img" src="${photo}" alt="${spot.location.name}"/>` : ''}
        <ul class="travel-popup-list">${list}</ul>
      </div>`;
  };

  // 初始化地图（仅一次）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const map = L.map(el, { zoomControl: true, attributionControl: true });
    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);
    linesRef.current = L.layerGroup().addTo(map);

    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      linesRef.current = null;
    };
  }, []);

  // 瓦片源切换
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tilesRef.current.base) map.removeLayer(tilesRef.current.base);
    if (tilesRef.current.labels) map.removeLayer(tilesRef.current.labels);
    tilesRef.current = {};

    if (provider === 'none') return;
    const specs = buildTileSpecs(provider, tdtKey);
    if (!specs) return;

    const baseOptions: L.TileLayerOptions = {
      maxZoom: specs.base.maxZoom,
      attribution: specs.base.attribution,
    };
    // Leaflet 对显式 undefined 的 subdomains 会报错（读取 .length），仅在存在时传入
    if (specs.base.subdomains) baseOptions.subdomains = specs.base.subdomains;
    const base = L.tileLayer(specs.base.url, baseOptions);
    base.addTo(map);
    tilesRef.current.base = base;

    // 天地图注记层（叠加在底图之上、标记之下）
    if (specs.labels) {
      const labelOptions: L.TileLayerOptions = {
        maxZoom: specs.labels.maxZoom,
        attribution: specs.labels.attribution,
        zIndex: 500,
      };
      if (specs.labels.subdomains) labelOptions.subdomains = specs.labels.subdomains;
      const labels = L.tileLayer(specs.labels.url, labelOptions);
      labels.addTo(map);
      tilesRef.current.labels = labels;
    }
  }, [provider, tdtKey]);

  // 标记 / 连线 / 初始视野
  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    const lines = linesRef.current;
    if (!map || !markers || !lines) return;

    markers.clearLayers();
    lines.clearLayers();
    markerByCityRef.current.clear();

    // 高德瓦片为 GCJ02 坐标系，标记坐标需纠偏
    const project = (lon: number, lat: number): [number, number] =>
      provider === 'gaode' ? wgs84ToGcj02(lon, lat) : [lon, lat];

    const latlngs: [number, number][] = [];
    for (const spot of spots) {
      const [lon, lat] = project(spot.location.lon, spot.location.lat);
      latlngs.push([lat, lon]);
      const marker = L.marker([lat, lon], {
        icon: makePinIcon(spot.primaryType, spot.events.length),
        title: spot.location.name,
      });
      marker.bindPopup(popupHtml(spot));
      marker.on('click', () => setActiveSpot(spot.location.name));
      marker.addTo(markers);
      markerByCityRef.current.set(spot.location.name, marker);
    }

    // 访问顺序连线：按最早事件日期排序，虚线 + 方向箭头（仅示意先后）
    if (showLines && spots.length >= 2) {
      const ordered = [...spots].sort(
        (a, b) =>
          new Date(a.events[a.events.length - 1]?.date ?? 0).getTime() -
          new Date(b.events[b.events.length - 1]?.date ?? 0).getTime(),
      );
      const pts = ordered.map((s) => {
        const [lon, lat] = project(s.location.lon, s.location.lat);
        return [lat, lon] as [number, number];
      });
      L.polyline(pts, {
        color: '#64748b',
        weight: 2,
        dashArray: '6 6',
        opacity: 0.75,
      }).addTo(lines);
      for (let i = 1; i < pts.length; i++) {
        L.marker(pts[i], {
          icon: makeArrowIcon(bearing(pts[i - 1], pts[i])),
          interactive: false,
        }).addTo(lines);
      }
    }

    // 初始视野：仅当足迹集合变化时重新适配，切换瓦片不打扰当前视野
    const fitKey = spots
      .map((s) => `${s.location.name}:${s.location.lon},${s.location.lat}`)
      .join('|');
    if (fitKey !== fittedKeyRef.current && latlngs.length > 0) {
      fittedKeyRef.current = fitKey;
      if (latlngs.length === 1) {
        map.setView(latlngs[0], 10);
      } else {
        map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40], maxZoom: 10 });
      }
    }
  }, [spots, provider, showLines, t]);

  /** 时间轴点击：飞往城市并打开 Popup */
  const focusSpot = (spot: TravelSpot) => {
    const map = mapRef.current;
    const marker = markerByCityRef.current.get(spot.location.name);
    if (!map || !marker) return;
    setActiveSpot(spot.location.name);
    map.once('moveend', () => marker.openPopup());
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 10), { duration: 0.6 });
  };

  const provinceCount = useMemo(
    () => new Set(spots.map((s) => s.province).filter(Boolean)).size,
    [spots],
  );
  const eventCount = useMemo(() => spots.reduce((n, s) => n + s.events.length, 0), [spots]);
  const timelineSpots = useMemo(
    () =>
      [...spots].sort(
        (a, b) =>
          new Date(b.events[0]?.date ?? 0).getTime() -
          new Date(a.events[0]?.date ?? 0).getTime(),
      ),
    [spots],
  );

  const availableProviders = TILE_PROVIDERS.filter((p) => p.id !== 'tianditu' || tdtKey);
  const visitTypes = Object.keys(VISIT_TYPE_COLORS) as VisitType[];

  return (
    <div>
      {/* 统计栏 + 图例 + 控制 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 dark:text-gray-500 mb-3">
        <span>🗺️ <strong className="text-green-600">{provinceCount}</strong> {t.travel.provinces}</span>
        <span>🏙️ <strong className="text-amber-500">{spots.length}</strong> {t.travel.cities}</span>
        <span>📅 {eventCount} {t.travel.events}</span>
        <div className="flex flex-wrap items-center gap-2">
          {visitTypes.map((vt) => (
            <span key={vt} className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: VISIT_TYPE_COLORS[vt] }}
              />
              {t.travel.visitTypes[vt]}
            </span>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLines((v) => !v)}
            className={`btn btn-xs ${showLines ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t.travel.connections}
          </button>
          <div className="flex items-center gap-1">
            {availableProviders.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`btn btn-xs ${provider === p.id ? 'btn-primary' : 'btn-ghost'}`}
              >
                {t.travel.tiles[p.id]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 地图 */}
      <div
        ref={containerRef}
        className="w-full rounded-box border border-base-300 overflow-hidden"
        style={{ height: '520px' }}
      />

      {/* 足迹时间轴 */}
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-3">{t.travel.timeline}</h2>
        <div className="space-y-2">
          {timelineSpots.map((spot) => (
            <button
              key={spot.location.name}
              type="button"
              onClick={() => focusSpot(spot)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeSpot === spot.location.name
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'hover:bg-gray-50 dark:bg-gray-950 border border-transparent'
              }`}
            >
              {spot.photos[0] ? (
                <img
                  src={spot.photos[0]}
                  alt={spot.location.name}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
              ) : (
                <span className="text-2xl w-14 h-14 flex items-center justify-center shrink-0">
                  📍
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{spot.location.name}</span>
                  <span className={`badge badge-sm ${VISIT_TYPE_BADGE[spot.primaryType]}`}>
                    {t.travel.visitTypes[spot.primaryType]}
                  </span>
                  {spot.province && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">{spot.province}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {spot.events.map((e, i) => (
                    <span key={e.slug}>
                      {i > 0 && ' · '}
                      {e.title}（{e.date}）
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
