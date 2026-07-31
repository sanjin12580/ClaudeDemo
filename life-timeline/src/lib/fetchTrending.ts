// ============================================================
// GitHub Trending API 封装
// 使用 GitHub Search REST API（公开，60 req/h 无需 Token）
// ============================================================

/** GitHub 仓库搜索结果中的单个项目 */
export interface TrendingRepo {
  id: number;
  name: string; // "owner/repo"
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

/** 按维度分组的响应 */
export interface TrendingData {
  /** 7天内新建热门项目（全站） */
  global: TrendingRepo[];
  /** 7天内新建热门项目（中文） */
  chinese: TrendingRepo[];
  /** 全时段最热项目 Top 10（全站） */
  globalTop: TrendingRepo[];
  /** 全时段最热项目 Top 10（中文） */
  chineseTop: TrendingRepo[];
}

/** 缓存结构 */
interface CacheEntry {
  data: TrendingData;
  timestamp: number;
}

// ============================================================
// 工具函数
// ============================================================

/** 生成近7天的日期字符串 (YYYY-MM-DD) */
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** 延迟函数 */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================
// API 调用
// ============================================================

/** 调用 GitHub Search API 获取仓库列表 */
async function searchRepos(
  q: string,
  perPage: number,
): Promise<TrendingRepo[]> {
  // 注意：GitHub Search API 的 q 参数需要保持 :/>/</+ 等字符原样。
  // encodeURIComponent 会把这些编码成 %3A/%3E 导致 API 返回空结果。
  // 策略：先编码，再还原 GitHub 语法必需的特殊字符。
  const encodedQ = encodeURIComponent(q)
    .replace(/%3A/g, ':')
    .replace(/%3E/g, '>')
    .replace(/%3C/g, '<')
    .replace(/%2B/g, '+');
  const params = new URLSearchParams({
    sort: 'stars',
    order: 'desc',
    per_page: String(perPage),
  });
  const url = `https://api.github.com/search/repositories?q=${encodedQ}&${params.toString()}`;

  const resp = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      // 如果有 Token，自动带上
      ...(import.meta.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${import.meta.env.GITHUB_TOKEN}` }
        : {}),
    },
  });

  if (!resp.ok) {
    throw new Error(`GitHub API ${resp.status}: ${resp.statusText}`);
  }

  const json = await resp.json();
  return json.items ?? [];
}

// ============================================================
// 缓存（仅客户端 — sessionStorage）
// ============================================================

const CACHE_KEY = 'github-trending-cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟

function getFromCache(): CacheEntry | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function setCache(data: TrendingData): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage 满了，忽略
  }
}

// ============================================================
// 主入口
// ============================================================

const sevenDaysAgo = daysAgo(7);

export interface FetchOptions {
  /** 是否跳过缓存强制刷新 */
  forceFresh?: boolean;
}

/**
 * 获取 GitHub Trending 数据（全站 + 中文）
 *
 * 客户端会先查 sessionStorage 缓存（5min TTL），
 * 缓存未命中时再调用 GitHub API。
 * 构建时（SSG）直接调用 API，不做缓存。
 */
export async function fetchTrendingData(
  opts: FetchOptions = {},
): Promise<TrendingData> {
  // 客户端：读缓存
  if (!opts.forceFresh) {
    const cached = getFromCache();
    if (cached) return cached.data;
  }

  try {
    // 并行请求四个维度：7天新建 + 全时段 Top 10
    const [global, chinese, globalTop, chineseTop] = await Promise.all([
      searchRepos(`created:>${sevenDaysAgo}`, 18),
      searchRepos(`topic:china+created:>${sevenDaysAgo}`, 9),
      searchRepos('stars:>1', 10),
      searchRepos('topic:china+stars:>50', 10),
    ]);

    const data: TrendingData = {
      global: global ?? [],
      chinese: chinese ?? [],
      globalTop: globalTop ?? [],
      chineseTop: chineseTop ?? [],
    };

    // 客户端：写缓存
    setCache(data);
    return data;
  } catch {
    // API 错误时返回缓存（如果有），否则空数组
    const cached = getFromCache();
    if (cached) return cached.data;
    return { global: [], chinese: [], globalTop: [], chineseTop: [] };
  }
}

// ============================================================
// 预置 Fallback（构建时 API 不可用时的兜底数据）
// ============================================================

export const FALLBACK_TRENDING: TrendingData = {
  global: [
    {
      id: 1,
      name: 'tailwindlabs/tailwindcss',
      full_name: 'tailwindlabs/tailwindcss',
      html_url: 'https://github.com/tailwindlabs/tailwindcss',
      description: 'A utility-first CSS framework for rapid UI development.',
      stargazers_count: 84000,
      language: 'TypeScript',
      topics: ['css', 'tailwindcss', 'framework'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'tailwindlabs', avatar_url: '' },
    },
    {
      id: 2,
      name: 'facebook/react',
      full_name: 'facebook/react',
      html_url: 'https://github.com/facebook/react',
      description:
        'The library for web and native user interfaces.',
      stargazers_count: 233000,
      language: 'JavaScript',
      topics: ['react', 'javascript', 'ui'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'facebook', avatar_url: '' },
    },
    {
      id: 3,
      name: 'oven-sh/bun',
      full_name: 'oven-sh/bun',
      html_url: 'https://github.com/oven-sh/bun',
      description:
        'Incredibly fast JavaScript runtime, bundler, test runner, and package manager.',
      stargazers_count: 78000,
      language: 'Zig',
      topics: ['javascript', 'runtime', 'bundler'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'oven-sh', avatar_url: '' },
    },
  ],
  chinese: [
    {
      id: 10,
      name: 'lobehub/lobe-chat',
      full_name: 'lobehub/lobe-chat',
      html_url: 'https://github.com/lobehub/lobe-chat',
      description:
        '🤯 Lobe Chat - an open-source, modern-design AI chat framework.',
      stargazers_count: 58000,
      language: 'TypeScript',
      topics: ['chinese', 'ai', 'chatgpt', 'llm'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'lobehub', avatar_url: '' },
    },
    {
      id: 11,
      name: 'ant-design/ant-design',
      full_name: 'ant-design/ant-design',
      html_url: 'https://github.com/ant-design/ant-design',
      description:
        'An enterprise-class UI design language and React UI library.',
      stargazers_count: 93000,
      language: 'TypeScript',
      topics: ['chinese', 'react', 'ui', 'design-system'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'ant-design', avatar_url: '' },
    },
    {
      id: 12,
      name: 'vuejs/core',
      full_name: 'vuejs/core',
      html_url: 'https://github.com/vuejs/core',
      description:
        '🖖 Vue.js is a progressive, incrementally-adoptable JavaScript framework.',
      stargazers_count: 49000,
      language: 'TypeScript',
      topics: ['chinese', 'vue', 'javascript', 'framework'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'vuejs', avatar_url: '' },
    },
  ],
  globalTop: [
    {
      id: 100,
      name: 'freeCodeCamp/freeCodeCamp',
      full_name: 'freeCodeCamp/freeCodeCamp',
      html_url: 'https://github.com/freeCodeCamp/freeCodeCamp',
      description: 'freeCodeCamp.org open-source codebase and curriculum.',
      stargazers_count: 415000,
      language: 'TypeScript',
      topics: ['education', 'javascript'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'freeCodeCamp', avatar_url: '' },
    },
    {
      id: 101,
      name: 'facebook/react',
      full_name: 'facebook/react',
      html_url: 'https://github.com/facebook/react',
      description: 'The library for web and native user interfaces.',
      stargazers_count: 233000,
      language: 'JavaScript',
      topics: ['react', 'javascript', 'ui'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'facebook', avatar_url: '' },
    },
    {
      id: 102,
      name: 'torvalds/linux',
      full_name: 'torvalds/linux',
      html_url: 'https://github.com/torvalds/linux',
      description: 'Linux kernel source tree.',
      stargazers_count: 188000,
      language: 'C',
      topics: ['linux', 'kernel'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'torvalds', avatar_url: '' },
    },
  ],
  chineseTop: [
    {
      id: 200,
      name: 'ant-design/ant-design',
      full_name: 'ant-design/ant-design',
      html_url: 'https://github.com/ant-design/ant-design',
      description: 'An enterprise-class UI design language and React UI library.',
      stargazers_count: 93000,
      language: 'TypeScript',
      topics: ['china', 'react', 'ui'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'ant-design', avatar_url: '' },
    },
    {
      id: 201,
      name: 'vuejs/vue',
      full_name: 'vuejs/vue',
      html_url: 'https://github.com/vuejs/vue',
      description: 'The progressive JavaScript framework.',
      stargazers_count: 208000,
      language: 'TypeScript',
      topics: ['china', 'vue', 'javascript'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'vuejs', avatar_url: '' },
    },
    {
      id: 202,
      name: 'tensorflow/tensorflow',
      full_name: 'tensorflow/tensorflow',
      html_url: 'https://github.com/tensorflow/tensorflow',
      description: 'An Open Source Machine Learning Framework.',
      stargazers_count: 189000,
      language: 'C++',
      topics: ['china', 'machine-learning'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: { login: 'tensorflow', avatar_url: '' },
    },
  ],
};
