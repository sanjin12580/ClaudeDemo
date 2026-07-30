// ============================================================
// TrendingGrid — GitHub 热门项目页面
// 左侧：7天新建项目卡片网格
// 右侧：悬浮全时段 Top 10 总榜
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import TrendingCard from './TrendingCard';
import TrendingSidebar from './TrendingSidebar';
import { fetchTrendingData } from '../lib/fetchTrending';
import type { TrendingData } from '../lib/fetchTrending';

interface Props {
  initialData: TrendingData;
}

const TAB_GLOBAL = 'global';
const TAB_CHINESE = 'chinese';

export default function TrendingGrid({ initialData }: Props) {
  const [activeTab, setActiveTab] = useState<'global' | 'chinese'>(TAB_GLOBAL);
  const [data, setData] = useState<TrendingData>(initialData);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isCached, setIsCached] = useState(false);

  const repos = activeTab === TAB_GLOBAL ? data.global : data.chinese;
  const sidebarRepos =
    activeTab === TAB_GLOBAL ? data.globalTop : data.chineseTop;
  const sidebarTitle =
    activeTab === TAB_GLOBAL ? '全站热门总榜' : '中文热门总榜';
  const sidebarDesc =
    activeTab === TAB_GLOBAL
      ? '按 Star 总数排名 · 前十'
      : '中国开发者最热项目 · 前十';
  const gridRule =
    activeTab === TAB_GLOBAL
      ? '📋 规则：最近 7 天创建的仓库 · 按 Star 降序 · 前 18 名'
      : '📋 规则：标有 china 主题 + 最近 7 天创建 · 按 Star 降序 · 前 9 名';

  /** 刷新数据 */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await fetchTrendingData({ forceFresh: true });

      const cachedStr = sessionStorage.getItem('github-trending-cache');
      const cached = cachedStr ? JSON.parse(cachedStr) : null;

      if (
        fresh.global.length > 0 ||
        fresh.chinese.length > 0 ||
        fresh.globalTop.length > 0 ||
        fresh.chineseTop.length > 0
      ) {
        setData(fresh);
        setIsCached(false);
      } else if (cached) {
        setData(cached.data);
        setIsCached(true);
      }

      setLastUpdated(Date.now());
    } catch {
      // 刷新失败，保留旧数据
    } finally {
      setLoading(false);
    }
  }, []);

  // 首次挂载时静默拉取最新数据
  useEffect(() => {
    refresh();
  }, []);

  // 每分钟更新一次"X 分钟前"文案
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  function agoLabel(ts: number): string {
    const mins = Math.floor((Date.now() - ts) / 60_000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    return `${Math.floor(hours / 24)} 天前`;
  }

  return (
    <div>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🔥 GitHub 热门项目
        </h1>
        <div className="flex items-center gap-3">
          {isCached && (
            <span className="badge badge-warning badge-sm text-xs">
              ⚡ 数据来自缓存
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            更新于 {agoLabel(lastUpdated)}
          </span>
          <button
            onClick={refresh}
            disabled={loading}
            className="btn btn-sm btn-ghost"
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              '🔄 刷新'
            )}
          </button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="tabs tabs-lifted mb-4">
        <button
          className={`tab text-sm gap-1 ${activeTab === TAB_GLOBAL ? 'tab-active' : ''}`}
          onClick={() => setActiveTab(TAB_GLOBAL)}
        >
          🌍 全站热门
        </button>
        <button
          className={`tab text-sm gap-1 ${activeTab === TAB_CHINESE ? 'tab-active' : ''}`}
          onClick={() => setActiveTab(TAB_CHINESE)}
        >
          🇨🇳 中文项目
        </button>
      </div>

      {/* 主内容区：左侧卡片网格 + 右侧悬浮总榜 */}
      <div className="flex gap-6">
        {/* 左侧：卡片网格 */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-4 leading-relaxed">
            <p>
              数据来源：
              <a
                href="https://api.github.com/search/repositories"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Search API
              </a>
              &nbsp;· {gridRule}
            </p>
          </div>

          {repos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repos.map((repo) => (
                <TrendingCard key={repo.id} repo={repo} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500">
              <p className="text-4xl mb-4">📭</p>
              <p>暂无数据，请稍后刷新</p>
            </div>
          )}
        </div>

        {/* 右侧：全时段 Top 10 总榜（粘性定位） */}
        <div className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-24">
            <TrendingSidebar
              title={sidebarTitle}
              description={sidebarDesc}
              repos={sidebarRepos}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
