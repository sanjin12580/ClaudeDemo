// ============================================================
// 地理编码 — Nominatim (OpenStreetMap) 免费 API
// 全球覆盖，无需 API Key，限速 1 req/s
// ============================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface GeoLocation {
  name: string; // 地点名称（如"深圳"）
  lat: number;
  lon: number;
  displayName: string; // Nominatim 返回的完整地名
}

/** 地点坐标缓存文件 */
const CACHE_PATH = join(process.cwd(), 'src/data/locations.json');

/** 预置的中国主要城市坐标（无需 API 请求，供统计层离线兜底） */
export const BUILTIN_LOCATIONS: Record<string, { lat: number; lon: number }> = {
  深圳: { lat: 22.5431, lon: 114.0579 },
  广州: { lat: 23.1292, lon: 113.2644 },
  北京: { lat: 39.9042, lon: 116.4074 },
  上海: { lat: 31.2304, lon: 121.4737 },
  杭州: { lat: 30.2741, lon: 120.1551 },
  成都: { lat: 30.5728, lon: 104.0668 },
  重庆: { lat: 29.4316, lon: 106.9123 },
  武汉: { lat: 30.5928, lon: 114.3055 },
  南京: { lat: 32.0603, lon: 118.7969 },
  西安: { lat: 34.3416, lon: 108.9398 },
  长沙: { lat: 28.2282, lon: 112.9388 },
  厦门: { lat: 24.4798, lon: 118.0894 },
  苏州: { lat: 31.299, lon: 120.5853 },
  天津: { lat: 39.3434, lon: 117.3616 },
  青岛: { lat: 36.0671, lon: 120.3826 },
  大连: { lat: 38.914, lon: 121.6147 },
  昆明: { lat: 25.0389, lon: 102.7183 },
  大理: { lat: 25.5916, lon: 100.2299 },
  丽江: { lat: 26.8721, lon: 100.2299 },
  拉萨: { lat: 29.65, lon: 91.1 },
  哈尔滨: { lat: 45.8038, lon: 126.535 },
  三亚: { lat: 18.2528, lon: 109.512 },
  桂林: { lat: 25.2736, lon: 110.29 },
  贵阳: { lat: 26.647, lon: 106.6302 },
  南昌: { lat: 28.682, lon: 115.858 },
  合肥: { lat: 31.8206, lon: 117.2272 },
  郑州: { lat: 34.7466, lon: 113.6253 },
  济南: { lat: 36.6512, lon: 116.9971 },
  沈阳: { lat: 41.8057, lon: 123.4315 },
  石家庄: { lat: 38.0428, lon: 114.5149 },
  太原: { lat: 37.8706, lon: 112.5489 },
  乌鲁木齐: { lat: 43.8256, lon: 87.6168 },
  呼和浩特: { lat: 40.8424, lon: 111.749 },
  兰州: { lat: 36.0611, lon: 103.8343 },
  西宁: { lat: 36.6171, lon: 101.7785 },
  银川: { lat: 38.4872, lon: 106.2309 },
  南宁: { lat: 22.817, lon: 108.3665 },
  福州: { lat: 26.0745, lon: 119.2965 },
  海口: { lat: 20.044, lon: 110.3503 },
  珠海: { lat: 22.2707, lon: 113.5767 },
  东莞: { lat: 23.0208, lon: 113.7518 },
  佛山: { lat: 23.0219, lon: 113.1214 },
};

/**
 * 加载地点坐标缓存
 */
export function loadLocationCache(): Record<string, GeoLocation> {
  try {
    if (existsSync(CACHE_PATH)) {
      return JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * 保存地点坐标缓存
 */
function saveLocationCache(cache: Record<string, GeoLocation>): void {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

/**
 * 通过 Nominatim API 查询地点坐标
 * 限速 1 req/s
 */
async function queryNominatim(
  placeName: string,
): Promise<GeoLocation | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1&accept-language=zh`;

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'life-timeline/1.0 (personal-website)' },
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    if (!data || data.length === 0) return null;

    return {
      name: placeName,
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch {
    return null;
  }
}

/** 延迟函数 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let lastApiCall = 0;

/**
 * 获取地点坐标（优先级：内置 > 缓存 > Nominatim API）
 * 查询到新地点后自动写入缓存
 */
export async function geocodeLocation(
  placeName: string,
  cache: Record<string, GeoLocation>,
): Promise<GeoLocation | null> {
  // 1. 内置城市坐标（无需延迟）
  const builtin = BUILTIN_LOCATIONS[placeName];
  if (builtin) {
    return {
      name: placeName,
      lat: builtin.lat,
      lon: builtin.lon,
      displayName: placeName,
    };
  }

  // 2. 文件缓存
  if (cache[placeName]) return cache[placeName];

  // 3. Nominatim API — 确保两次调用间隔 ≥ 1 秒
  const now = Date.now();
  const elapsed = now - lastApiCall;
  if (elapsed < 1100) await sleep(1100 - elapsed);

  lastApiCall = Date.now();
  const result = await queryNominatim(placeName);
  if (result) {
    cache[placeName] = result;
    saveLocationCache(cache);
  }

  return result;
}
