// ============================================================
// 省份/地区映射 — 纯数据模块（浏览器与服务端均可安全导入）
// ============================================================

/** 常用城市 → 省份映射 */
export const CITY_PROVINCE: Record<string, string> = {
  深圳: '广东省', 广州: '广东省', 珠海: '广东省', 东莞: '广东省', 佛山: '广东省',
  惠州: '广东省', 中山: '广东省', 江门: '广东省', 汕头: '广东省', 湛江: '广东省',
  北京: '北京市', 上海: '上海市', 天津: '天津市', 重庆: '重庆市',
  杭州: '浙江省', 宁波: '浙江省', 温州: '浙江省', 嘉兴: '浙江省', 绍兴: '浙江省',
  湖州: '浙江省', 金华: '浙江省', 台州: '浙江省', 丽水: '浙江省', 衢州: '浙江省',
  成都: '四川省', 绵阳: '四川省',
  武汉: '湖北省', 宜昌: '湖北省',
  南京: '江苏省', 苏州: '江苏省', 无锡: '江苏省', 常州: '江苏省',
  南通: '江苏省', 扬州: '江苏省', 徐州: '江苏省', 镇江: '江苏省', 盐城: '江苏省',
  西安: '陕西省',
  长沙: '湖南省',
  厦门: '福建省', 福州: '福建省', 泉州: '福建省',
  青岛: '山东省', 济南: '山东省', 烟台: '山东省', 潍坊: '山东省', 威海: '山东省',
  大连: '辽宁省', 沈阳: '辽宁省',
  昆明: '云南省', 大理: '云南省', 丽江: '云南省',
  贵阳: '贵州省',
  南宁: '广西壮族自治区', 桂林: '广西壮族自治区',
  海口: '海南省', 三亚: '海南省',
  拉萨: '西藏自治区',
  兰州: '甘肃省',
  西宁: '青海省',
  银川: '宁夏回族自治区',
  呼和浩特: '内蒙古自治区', 包头: '内蒙古自治区',
  哈尔滨: '黑龙江省',
  长春: '吉林省',
  郑州: '河南省', 洛阳: '河南省', 开封: '河南省',
  合肥: '安徽省', 芜湖: '安徽省', 蚌埠: '安徽省', 黄山: '安徽省',
  马鞍山: '安徽省', 安庆: '安徽省', 阜阳: '安徽省',
  南昌: '江西省', 赣州: '江西省', 九江: '江西省', 上饶: '江西省',
  萍乡: '江西省', 景德镇: '江西省', 宜春: '江西省', 吉安: '江西省',
  太原: '山西省',
  石家庄: '河北省',
  台北: '台湾省',
  香港: '香港特别行政区',
  澳门: '澳门特别行政区',
  乌鲁木齐: '新疆维吾尔自治区',
};

/** 省级行政区名称列表（用于地名包含省份名的兜底匹配） */
const PROVINCE_NAMES: string[] = [
  '北京市', '上海市', '天津市', '重庆市',
  '广东省', '浙江省', '四川省', '湖北省', '江苏省', '陕西省', '湖南省',
  '福建省', '山东省', '辽宁省', '云南省', '贵州省', '广西壮族自治区',
  '海南省', '西藏自治区', '甘肃省', '青海省', '宁夏回族自治区',
  '内蒙古自治区', '黑龙江省', '吉林省', '河南省', '安徽省', '江西省',
  '山西省', '河北省', '台湾省', '香港特别行政区', '澳门特别行政区',
];

/**
 * 从地点名称推断所属省份
 * 1. 常用城市映射表精确匹配
 * 2. 地点名称包含省/直辖市/自治区名称时直接返回
 * 未命中返回 null
 */
export function provinceFromLocation(name: string): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (CITY_PROVINCE[trimmed]) return CITY_PROVINCE[trimmed];

  // 按长度倒序匹配，优先命中"内蒙古自治区"这类长名称
  const hit = PROVINCE_NAMES
    .slice()
    .sort((a, b) => b.length - a.length)
    .find((p) => trimmed.includes(p));
  return hit ?? null;
}

// ============================================================
// 点面包含判断 — ray-casting（纯函数，不依赖 china.json）
// GeoJSON 坐标顺序为 [经度, 纬度]
// ============================================================

/** 闭合环：[[lng, lat], ...] */
type Ring = [number, number][];

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** GeoJSON Feature 的几何对象（Polygon / MultiPolygon） */
export interface GeoGeometryLike {
  type: string;
  coordinates: unknown;
}

/**
 * 判断经纬度点是否落在 GeoJSON Polygon / MultiPolygon 几何内
 */
export function pointInGeometry(lng: number, lat: number, geometry: GeoGeometryLike): boolean {
  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates as Ring[]) {
      if (pointInRing(lng, lat, ring)) return true;
    }
    return false;
  }
  if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates as Ring[][]) {
      for (const ring of poly) {
        if (pointInRing(lng, lat, ring)) return true;
      }
    }
    return false;
  }
  return false;
}

/** 省份 GeoJSON Feature（仅需 properties.name 与 geometry） */
export interface ProvinceFeatureLike {
  properties?: { name?: string };
  geometry?: GeoGeometryLike;
}

/**
 * 由地点名称 + 坐标推断省份
 * 1. 城市/省份名称映射精确命中
 * 2. ray-casting 点面包含兜底（替代"最近中心点"，避免边界误判）
 */
export function provinceFromLocationCoords(
  name: string,
  lng: number,
  lat: number,
  features: ProvinceFeatureLike[],
): string | null {
  const direct = provinceFromLocation(name);
  if (direct) return direct;

  for (const feature of features) {
    if (!feature.geometry) continue;
    if (pointInGeometry(lng, lat, feature.geometry)) {
      return feature.properties?.name ?? null;
    }
  }
  return null;
}
