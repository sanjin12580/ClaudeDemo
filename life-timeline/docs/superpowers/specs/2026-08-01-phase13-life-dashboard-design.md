# Phase 13 设计文档 — 人生仪表盘（数据总览 + 年度总结 + 纪念日倒计时）

> 日期：2026-08-01 ｜ 版本：v1.0.0

## 一、背景与目标

项目已有事件时间线、贡献图、博客、目标看板、旅行足迹、多媒体档案等多类数据，但没有一个统一入口查看"人生全貌"。本阶段在**构建时静态生成**的基础上新增三个能力：

1. **数据总览仪表盘** `/dashboard` + 首页轻量统计条
2. **年度回顾** `/yearly`（索引页 + 单年详情页）
3. **纪念日倒计时**（生日 + 重要事件自动 + 手工条目）

全部基于现有数据派生，不引入外部 API、不新增运行时依赖。

## 二、数据来源

| 数据 | 来源 | 用途 |
|------|------|------|
| 事件 | `src/content/events/`（loadEvents） | 事件统计、分类、旅行城市、重要事件、年度事件 |
| 博客 | `src/content/blog/`（loadPosts） | 内容统计、年度博客 |
| 清单 | `src/data/consumptions.json`（loadConsumptions） | 已读/在看/想看计数、年度读完清单 |
| 目标 | `src/data/goals.json`（loadGoals） | 完成率、平均进度、年度目标 |
| 媒体 | `src/data/media.json`（loadMedia） | 媒体文件计数 |
| 档案 | `src/content/profile/about.md`（loadProfile） | 出生日期（生日纪念日、年龄计算） |
| 站点配置 | `src/site.config.ts` | 出生日期兜底 |
| 纪念日 | `src/data/anniversaries.json`（新增，手工条目） | 手工纪念日 |

## 三、实现设计

### 1. 统计层 `src/lib/stats.ts`

构建时聚合所有数据，输出：

- **生命**：年龄（年/天/周）、1/e 标记（预期寿命 80 岁，`80/e ≈ 29.4` 岁）
- **事件**：总数、年份跨度、重要事件（importance≥4）、地点数、分类分布、高频标签
- **旅行**：城市数、省份数（`provinceFromLocation()`）
- **内容**：博客篇数、媒体文件数、清单三态计数
- **目标**：总数、已完成数、完成率、平均进度
- **年度摘要** `YearSummary[]`：每类数据按年聚合（事件/博客/读完清单/旅行城市/目标 + 年度标签）

### 2. 省份映射 `src/lib/regions.ts`

`CITY_PROVINCE` 从 `TravelMap.tsx` 提取为独立纯数据模块（浏览器/服务端均可导入），新增 `provinceFromLocation(name)`：

- 精确命中城市映射表
- 否则匹配地名中包含的省/直辖市/自治区名称（按名称长度倒序）
- 未命中返回 null（只计城市、不计省份）

### 3. 纪念日 `src/lib/anniversaries.ts` + `src/data/anniversaries.json`

合并三类条目后按 MM-DD 去重（优先级：手工 > 生日 > 事件）：

- **生日**：档案 `birthDate` 自动派生
- **事件**：importance≥4 且日期精确到日的事件，按年重复
- **手工**：`anniversaries.json` 中的 `{ id, name, date, emoji?, note?, once? }`，支持 `MM-DD`（每年）与 `YYYY-MM-DD`（`once: true` 一次性）

构建时计算下一次发生日与剩余天数，按剩余天数升序返回。

### 4. 页面与组件

| 路径/文件 | 说明 |
|-----------|------|
| `src/pages/dashboard.astro` | 总览页：纪念日（最近 5 条）→ 五组统计卡墙 → 图表 → 年度回顾入口（最近 3 年） |
| `src/components/DashboardCharts.tsx` | ECharts 按需引入：分类分布环形图 + 年度事件趋势柱状图，紧凑 props 序列化 |
| `src/components/StatsStrip.astro` | 首页统计条，服务端渲染，6 个统计链接 |
| `src/pages/yearly/index.astro` | 年份索引（仅列出有数据的年份，倒序卡片） |
| `src/pages/yearly/[year].astro` | 单年详情：年度统计卡 + 事件卡片 + 博客列表 + 读完清单 + 旅行城市 + 目标 |
| `src/layouts/Layout.astro` | 导航新增「📊 总览」 |
| `src/lib/i18n.ts` | 新增 `statsStrip` / `dashboard` / `yearly` 词典段 |

## 四、边界情况与决策

- **去重**：生日 06-15 与"来到这个世界"事件（importance=5）同为 06-15 时，仅保留生日
- **年份范围**：`/yearly` 只生成有数据的年份（事件/博客/清单/目标任意一项存在）；`/yearly/[year]` 用 `getStaticPaths` 保证
- **未映射地点**：如"萍乡"不计入省份数，仅计入城市数
- **无数据兜底**：无纪念日/清单/媒体/目标时显示空态文案，图表显示"暂无数据"
- **倒计时**：按构建日期计算（静态站随推送重建），不引入客户端定时
- **工程侧**：管理后台暂不加仪表盘/纪念日编辑入口，数据直接编辑 JSON；年度总结不拉取 GitHub 数据

## 五、测试计划

1. `npm run build`（`astro check` 严格模式 + `astro build`）通过，30 个页面生成
2. 首页统计条数值与数据一致（10075 天 / 5 事件 / 2 省 4 城 / 1 博客 / 已读 5 / 目标 0%）
3. `/dashboard`：5 个纪念日倒计时（生日去重生效）、五组统计卡、两个 ECharts 图表渲染
4. `/yearly`：仅列出 1998/2020/2022/2023/2024/2025/2026 共 7 个有数据年份
5. `/yearly/2025`：武功山徒步事件、萍乡城市、年度标签齐全
6. `/yearly/2026`：你好世界博客 + 3 个当年目标

## 六、后续可扩展（非本阶段）

- 纪念日管理后台 Tab
- 年度总结加入 GitHub 年度提交数据
- 周记/每周回顾为年度总结供料
- 数据导出（JSON/Markdown 备份）
