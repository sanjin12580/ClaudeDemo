// ============================================================
// 瓦片源注册表 — 天地图 / OSM / 高德 / 无底图
// 纯函数模块，可被浏览器端安全导入（不读取环境变量）
// 天地图 Key 由服务端页面（travel/index.astro）注入
// ============================================================

export type TileProviderId = 'tianditu' | 'osm' | 'gaode' | 'none';

/** 单个 Leaflet 瓦片图层规格 */
export interface TileLayerSpec {
  /** Leaflet tileLayer URL 模板（含 {z}/{x}/{y}，可选 {s}） */
  url: string;
  /** Leaflet 子域字符（无则省略） */
  subdomains?: string;
  /** 最大缩放级别 */
  maxZoom: number;
  /** 版权署名（HTML） */
  attribution: string;
}

/** 瓦片源信息（用于切换按钮） */
export interface TileProviderInfo {
  id: TileProviderId;
  /** 显示名称（由调用方负责 i18n 或直接使用） */
  label: string;
  /** 是否需要天地图 Key */
  needsKey: boolean;
}

/** 全部瓦片源（无 Key 时天地图项由调用方隐藏/置灰） */
export const TILE_PROVIDERS: TileProviderInfo[] = [
  { id: 'tianditu', label: '天地图', needsKey: true },
  { id: 'osm', label: 'OSM', needsKey: false },
  { id: 'gaode', label: '高德', needsKey: false },
  { id: 'none', label: '无底图', needsKey: false },
];

/**
 * 构建指定瓦片源的图层规格
 * @param id 瓦片源
 * @param tdtKey 天地图浏览器端 Key（仅 tianditu 需要）
 * @returns 底图 + 可选注记叠加层；none 或缺少 Key 时返回 null
 */
export function buildTileSpecs(
  id: TileProviderId,
  tdtKey?: string,
): { base: TileLayerSpec; labels?: TileLayerSpec } | null {
  switch (id) {
    case 'tianditu': {
      if (!tdtKey) return null;
      const base: TileLayerSpec = {
        url:
          'https://t{s}.tianditu.gov.cn/vec_w/wmts' +
          '?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
          '&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles' +
          `&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tdtKey}`,
        subdomains: '01234567',
        maxZoom: 18,
        attribution: '© <a href="https://www.tianditu.gov.cn/">天地图</a>',
      };
      const labels: TileLayerSpec = {
        url:
          'https://t{s}.tianditu.gov.cn/cva_w/wmts' +
          '?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
          '&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles' +
          `&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${tdtKey}`,
        subdomains: '01234567',
        maxZoom: 18,
        attribution: '© <a href="https://www.tianditu.gov.cn/">天地图</a>',
      };
      return { base, labels };
    }
    case 'osm':
      return {
        base: {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxZoom: 19,
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        },
      };
    case 'gaode':
      return {
        base: {
          url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          subdomains: '1234',
          maxZoom: 18,
          attribution: '© <a href="https://www.amap.com/">高德地图</a>',
        },
      };
    case 'none':
      return null;
    default:
      return null;
  }
}

// ============================================================
// WGS84 → GCJ-02 坐标纠偏（高德 / 腾讯瓦片专用）
// 公开的近似算法；中国境外坐标原样返回
// ============================================================

const PI = Math.PI;
const A = 6378245.0; // 长半轴
const EE = 0.00669342162296594323; // 偏心率平方

function outOfChina(lng: number, lat: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: number, y: number): number {
  let ret =
    -100.0 +
    2.0 * x +
    3.0 * y +
    0.2 * y * y +
    0.1 * x * y +
    0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320.0 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
  return ret;
}

/**
 * WGS84 经纬度 → GCJ-02（火星坐标）
 * @returns [经度, 纬度]
 */
export function wgs84ToGcj02(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) return [lng, lat];
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI);
  return [lng + dLng, lat + dLat];
}
