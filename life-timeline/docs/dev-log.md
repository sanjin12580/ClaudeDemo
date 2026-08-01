# 人生时间线 — 开发日志

> 最后更新：2026-08-01 (v1.3.0)

---

## 已完成

### Phase 1: 项目脚手架
- [x] Astro v5 + React 18 + Tailwind CSS 4 项目初始化
- [x] TypeScript strict 模式配置
- [x] 基础布局组件 `Layout.astro`（导航 + 响应式）
- [x] 全局样式 `global.css`（贡献图颜色阶梯）
- [x] Favicon 和 `.gitignore`

### Phase 2: 数据层
- [x] Content Collection 配置（`src/content/config.ts`）
- [x] TypeScript 类型定义（`src/lib/types.ts`）
- [x] 事件解析与聚合工具（`src/lib/parseEvents.ts`）
- [x] 5 个示例事件（1998~2025，覆盖多个分类）
- [x] 草稿过滤（`draft: true` 的不显示）

### Phase 3: 前端页面
- [x] **贡献图总览** `/` — `LifeGrid.tsx`，年×周网格，颜色深浅表示事件密度
- [x] **时间线** `/timeline` — `Timeline.tsx`，按年分组纵向排列，支持分类/标签筛选
- [x] **年份详情** `/timeline/[year]` — 静态预渲染，按月展示事件
- [x] **事件卡片** `EventCard.tsx` — 分类标签、星级评定、正文预览

### Phase 4: 管理后台
- [x] 管理页面 `/admin` — 仅开发环境可用
- [x] ~~表单组件 `AdminForm.tsx`~~ → 升级为 `AdminPanel.tsx`
- [x] **左右分栏布局** — 左侧事件列表 + 右侧编辑面板
- [x] **事件列表** — 搜索、分类筛选、点击加载、草稿标记
- [x] **编辑/预览切换** — Tab 切换编辑表单和 Markdown 渲染预览
- [x] **删除事件** — 二次确认弹窗 + API 删除
- [x] Vite 插件 `vite-plugin-admin-api.ts` — 支持 POST（创建）和 DELETE（删除）

### Phase 5: 优化
- [x] 关闭 Astro Dev Toolbar（英文菜单，与中文网站不协调）
- [x] 轻量 i18n 多语言工具 `src/lib/i18n.ts`（默认中文，可扩展）
- [x] 所有 UI 文本统一由 i18n 词典管理

### v0.5.0: 人生目标看板 + 进度条增强 + 1/e 生命标记
- [x] **目标看板** `GoalBoard.tsx` — 短期/长期目标分组展示，motion 动画进度条，状态标签
- [x] **目标数据** `src/data/goals.json` — 5 个示例目标（3 短期 + 2 长期）
- [x] **管理后台「目标」Tab** — 第 4 个 Tab，表单支持目标增删改查，进度滑块
- [x] **Vite API 扩展** — `POST /api/write-goals` 端点
- [x] **生命计数器增强** `LifeCounter.tsx` — 人生进度条（渐变色 + 光泽），1/e 分割线标记（~29.4 岁），动画百分比标签
- [x] **首页集成** — `index.astro` 加入 GoalBoard 组件

### v1.0.0: 人生仪表盘（Phase 13）
- [x] **数据总览仪表盘** `/dashboard` — 统计卡墙（生命/事件/旅行/内容/目标五组）+ ECharts 图表（分类分布环形图 + 年度事件趋势柱状图）
- [x] **首页统计条** — 已活天数/事件数/旅行省份/博客/已读/目标完成率，服务端渲染无客户端 JS
- [x] **年度回顾** `/yearly` — 年份索引 + 每年详情页（事件/博客/读完清单/旅行城市/目标），纯静态生成
- [x] **纪念日倒计时** — 生日 + importance≥4 事件自动派生 + `anniversaries.json` 手工条目，按 MM-DD 去重
- [x] **统计层** `src/lib/stats.ts` — 构建时聚合事件/博客/清单/目标/媒体/档案数据；`CITY_PROVINCE` 提取到 `regions.ts` 供地图与统计共用
- [x] **dev** — 补装 `@types/node`，修复 astro check 既有 Node 类型错误与 travel/consumptions 页面 `className` 笔误

### v1.1.0: 读书观影清单重构（Phase 14）
- [x] **状态分栏管理** — `/consumptions` 改为「想看 / 在看 / 看过」三栏视图 + 计数，每条为紧凑列表行
- [x] **时间轴视图** — 只展示"看过"，按年份倒序分组，带日期与完整短评，像观影日记
- [x] **详情页** `/consumptions/[id]` — 封面 + 元数据 + 完整 Markdown 感受 + 豆瓣/TMDB 来源链接
- [x] **元数据自动获取** — 管理后台「清单」Tab 启用；影视/动漫走 TMDB（`TMDB_API_KEY` 存 `.env.local`），书籍/小说走豆瓣搜索页解析；候选选择后自动填充
- [x] **数据模型升级** — 新增 `year` / `author` / `source` / `sourceId` / `sourceUrl` 字段，向后兼容
- [x] **导航入口** — 导航新增「📚 清单」，页面文案全部走 i18n

### v1.2.0: 清单海报墙改版（Phase 14 优化）
- [x] **封面海报墙** — `/consumptions` 改为响应式封面网格（2~5 列），hover 图片放大 + 渐变浮现短评摘要
- [x] **筛选重构** — 状态分段筛选（全部/在看/看过）+ 类型 Tab（7 类型带计数）+ 搜索，三者组合过滤
- [x] **移除「想看」** — 状态收敛为 在看/看过，全站清理（数据/统计/仪表盘/管理后台/详情页/i18n），现数据零迁移
- [x] **示例数据补齐** — 新增 琅琊榜（电视剧）/ 乐队的夏天（综艺）/ 七里香（音乐），7 类型全覆盖，封面本地化

### v1.3.0: 人生清单 + 事件配图 + 生命格子增强
- [x] **人生清单** — `/bucket-list` 独立页面（完成进度条 + 已完成/待完成分组），JSON 数据维护，导航与仪表盘入口
- [x] **事件配图** — 事件 schema 新增 `images` 字段，卡片缩略图 / 详情页照片条 / 时间线展示；3 张本地示例插画
- [x] **生命格子增强** — 点击格子弹出该周事件（链接详情页），Esc/背景关闭，当前周高亮
- [x] **清理外链图片** — 事件正文中 Unsplash 外链替换为本地图片

---

## 技术栈

| 层 | 选用 | 版本 |
|----|------|------|
| 框架 | Astro | ^5.3 |
| UI 交互 | React | ^18.3 |
| 样式 | Tailwind CSS | ^4.0 |
| 内容 | Astro Content Collections | — |
| 数据格式 | Markdown + Frontmatter | — |
| 部署 | 待定（代码在 GitHub） | — |

---

## 项目结构

```
life-timeline/
├── docs/
│   └── dev-log.md              ← 本文件
├── src/
│   ├── content/
│   │   ├── config.ts           # Content Collection schema
│   │   └── events/             # Markdown 事件文件
│   ├── components/             # React 岛屿组件
│   │   ├── LifeGrid.tsx        # 贡献图
│   │   ├── Timeline.tsx        # 时间线
│   │   ├── EventCard.tsx       # 事件卡片
│   │   ├── AdminPanel.tsx      # 管理面板
│   │   ├── DashboardCharts.tsx # 总览图表
│   │   ├── StatsStrip.astro    # 首页统计条
│   │   └── ConsumptionList.tsx # 清单（分栏 + 时间轴）
│   ├── layouts/
│   │   └── Layout.astro        # 基础布局
│   ├── lib/
│   │   ├── types.ts            # 类型定义
│   │   ├── parseEvents.ts      # 事件解析
│   │   ├── parseConsumptions.ts# 清单数据与类型
│   │   ├── i18n.ts             # 多语言工具
│   │   ├── stats.ts            # 人生统计聚合
│   │   ├── anniversaries.ts    # 纪念日计算
│   │   └── regions.ts          # 城市→省份映射
│   ├── pages/
│   │   ├── index.astro         # 首页：贡献图总览
│   │   ├── dashboard.astro     # 人生总览仪表盘
│   │   ├── yearly/
│   │   │   ├── index.astro     # 年度回顾索引
│   │   │   └── [year].astro    # 单年度详情
│   │   ├── consumptions/
│   │   │   ├── index.astro     # 读书观影清单
│   │   │   └── [id].astro      # 单条详情
│   │   ├── timeline/
│   │   │   ├── index.astro     # 完整时间线
│   │   │   └── [year].astro    # 年份详情
│   │   └── admin/
│   │       └── index.astro     # 管理后台
│   └── styles/
│       └── global.css
├── public/
│   └── favicon.svg
├── vite-plugin-admin-api.ts    # 开发模式文件写入
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## 待办事项

### 功能
- [x] **事件编辑** — 管理后台点击列表中的事件加载到表单
- [x] **Markdown 预览** — 管理后台编辑/预览 Tab 切换
- [x] **事件删除** — 管理后台删除 + 二次确认
- [x] **暗色模式切换** — 手动切换按钮 + localStorage + 系统偏好跟随
- [x] **事件详情页** — 点击事件卡片跳转独立页面，服务端渲染完整 Markdown
- [x] **搜索功能** — 首页和 Timeline 全局搜索，支持标题/分类/标签/正文匹配
- [x] **图片上传** — 管理后台拖拽上传，自动插入 Markdown 图片语法到正文
- [x] **文件上传** — 扩展至 30+ 文件格式，支持文档/PDF/视频/音频/文本等
- [x] **人生仪表盘** — 数据总览 / 年度总结 / 纪念日倒计时

### 部署
- [x] **GitHub Pages** — GitHub Actions 自动部署，推送 main 分支即构建
- [ ] **自定义域名**

### 数据
- [x] 站点配置文件 `src/site.config.ts` — 出生年份等可配置项
- [ ] 填充真实个人事件 — 保留示例作为模板，通过管理后台自行添加

### 后续子系统（远期）
- [x] **读书观影清单** — 封面海报墙 + 状态/类型筛选 + 详情页 + TMDB/豆瓣元数据自动拉取
- [x] 思想花园（博客/随笔/笔记）
- [x] 个人档案页（基本资料 + 关系图谱）
- [x] 多媒体档案 — 画廊页面 + kkFileView 文件预览集成
- [x] 人生周数可视化增强

---

## 变更记录

### 2026-08-01 — v1.3.0 (人生清单 + 事件配图 + 生命格子增强)

- **feat**: 人生清单 `/bucket-list` — 8 条示例（2 完成），分类徽标 + 进度条 + 已完成/待完成分组；导航「🎯 愿望清单」与仪表盘「目标」组联动（2/8）
- **feat**: 事件配图 — `content/config.ts` 新增 `images` 字段；EventCard 缩略图、详情页照片条（首图大图 + 余图网格）、时间线复用卡片；旧事件无图不受影响
- **feat**: LifeGrid 点击弹窗 — 显示该周事件列表并可跳详情，Esc/背景关闭，当前周蓝色高亮，键盘可达
- **feat**: 3 张本地示例插画 `public/images/events/`（武功山/毕业/入职），替换事件正文中的 Unsplash 外链
- **data**: 新增 `src/data/bucketlist.json` + `src/lib/parseBucketList.ts`；stats 聚合 `bucketListCounts`
- **refactor**: 首页目标看板改为「🎯 当前目标」只展示进行中的目标（与人生清单错位：进度 vs 里程碑）；首页新增人生清单入口卡片（2/8）

### 2026-08-01 — v1.2.0 (Phase 14 优化：清单海报墙)

- **feat**: `/consumptions` 改为封面海报墙 — 响应式网格（2~5 列），封面 2:3 大图，hover 放大 + 渐变浮现短评摘要，整卡进入详情页
- **feat**: 筛选重构 — 状态分段（全部/在看/看过）+ 类型 Tab（7 类带计数）+ 搜索组合过滤；移除状态分栏与时间轴视图
- **refactor**: 移除「想看」状态 — `ConsumptionItem.status` 收窄为 `done | doing`，同步清理 i18n / stats / 仪表盘 / 管理后台 / 详情页，无 want 数据零迁移
- **data**: 新增 3 条示例（琅琊榜 tv / 乐队的夏天 variety / 七里香 music）+ 本地封面，7 类型全覆盖

### 2026-08-01 — v1.1.1 (维护：封面本地化 + 元数据兜底)

- **fix**: 豆瓣图片 CDN 防盗链导致封面加载失败（418/403）— 新增 `/api/save-cover` 服务端下载封面到 `public/covers/`，页面使用本地文件
- **fix**: 后台候选缩略图被豆瓣防盗链拦截 — 新增 `/api/img-proxy` 代理
- **fix**: TMDB API 网络不稳定时无结果 — 影视/动漫改为 TMDB 与豆瓣并行竞速，谁先返回用谁，失败自动兜底
- **fix**: Vite 插件读不到 `.env.local` — 改用 `loadEnv()` 并基于插件文件目录定位，不再依赖 `process.env` 与启动 cwd
- **feat**: `coverUrl()` 工具 — 本地 `/covers/` 路径渲染时自动补站点 base，保证本地与线上一致
- **data**: 6 条示例封面全部下载到 `public/covers/`，替换失效的 `127.0.0.1` 与外链 URL

### 2026-08-01 — v1.1.0 (Phase 14: 读书观影清单重构)

- **feat**: `/consumptions` 重构 — 「状态管理」三栏（想看/在看/看过）+ 「时间轴」（按看完日期分组）+ 标题/作者/标签搜索
- **feat**: 详情页 `/consumptions/[id]` — 服务端渲染完整 Markdown 感受，含年份/作者/来源链接
- **feat**: 管理后台「📚 清单」Tab 启用 — 新增 年份/作者 字段与「🪄 自动获取元数据」（候选选择后自动填充封面与元数据）
- **feat**: `/api/fetch-metadata` — 影视/动漫走 TMDB（key 存 `.env.local`），书籍/小说走豆瓣搜索页内嵌 JSON 解析；综艺/音乐提示手动填写
- **feat**: 数据模型新增 `year`/`author`/`source`/`sourceId`/`sourceUrl`，旧数据兼容
- **fix**: 删除不再使用的 ConsumptionCard；travel 页面 `className` → `class`
- **deps**: 补装 `@types/node`（本分支基于 main，尚未包含此前修复）

### 2026-08-01 — v1.0.0 (Phase 13: 人生仪表盘)

- **feat**: 数据总览仪表盘 `/dashboard` — 五组统计卡（生命/事件/旅行/内容/目标）+ ECharts 分类环形图 + 年度事件趋势柱状图 + 纪念日倒计时 + 年度回顾入口
- **feat**: 首页统计条 `StatsStrip.astro` — 已活天数/事件数/旅行省份/博客/已读/目标完成率，每项链接对应页面，服务端渲染
- **feat**: 年度回顾 `/yearly` — 年份索引卡片 + 每年详情页（事件/博客/读完清单/旅行城市/目标），`getStaticPaths` 仅生成有数据的年份
- **feat**: 纪念日 `src/lib/anniversaries.ts` — 合并生日（档案 birthDate）+ importance≥4 事件（MM-DD 去重，手工优先）+ `src/data/anniversaries.json` 手工条目，构建时计算倒计时
- **feat**: `src/lib/stats.ts` — 构建时聚合全站数据；`CITY_PROVINCE` 提取到 `src/lib/regions.ts`（TravelMap 与统计共用），新增 `provinceFromLocation()`
- **deps**: 补装 `@types/node`（修复 astro check 既有 Node 类型报错）
- **fix**: travel/consumptions 页面 `className` → `class`（Astro 模板笔误）

### 2026-07-31 — v0.9.0 (Phase 12: 旅行足迹地图 + 地图方案探索)

- **feat**: 旅行足迹地图页面 `/travel` — 从时间线事件自动提取地点
- **feat**: TravelMap 组件 — ECharts + 中国 GeoJSON 矢量地图 + 省份高亮 + 星标标记
  - 去过的省份蓝色高亮（城市名→省份映射表 + 中心点距离兜底）
  - 去过城市黄色半透明五角星标记，大小按事件数缩放
  - 支持缩放/拖拽，tooltip 显示关联事件
- **feat**: `src/lib/geocode.ts` — Nominatim 免费地理编码 + 43 个中国城市预置坐标 + locations.json 缓存
- **feat**: 导航栏新增「🗺️ 旅行」链接
- **deps**: echarts（替代 leaflet/react-leaflet/@types/leaflet，已移除）
- **note**: 读书观影清单模块代码框架已建立（`ConsumptionCard`/`ConsumptionList`/`consumptions.json`），暂不启用，列为远期待办
- **technical**: 地图方案探索 — Leaflet(SSR 冲突+OSM 被墙) → D3 GeoJSON(路径渲染失败) → ECharts ✅
  - URLSearchParams 编码问题导致 GitHub API 返回空（:/>+字符被编码为 %3A/%3E/%2B）
  - client:load prop 序列化大数据丢失 → 改为组件内直接 import

### 2026-07-30 — v0.8.0 (Phase 11: GitHub 热门项目)

- **feat**: GitHub Trending 页面 `/trending` — 左右两栏布局，左侧卡片网格 + 右侧悬浮总榜
- **feat**: TrendingGrid 组件 — Tab 切换（全站/中文）+ 数据刷新 + 规则说明
- **feat**: TrendingCard 组件 — 项目卡片（头像/描述/Star 数/语言圆点/主题标签）
- **feat**: TrendingSidebar 组件 — 悬浮 Top 10 总榜（全时段最热项目，全站 + 中文分别展示）
- **feat**: `src/lib/fetchTrending.ts` — GitHub Search API 封装（4 路并行查询：7天新建 + 全时段 Top 10 × 全站/中文）
- **feat**: `src/lib/languageColors.ts` — 30+ GitHub 官方语言颜色映射
- **feat**: 混合数据模式 — 构建时静态快照 + 客户端 sessionStorage 缓存（5 分钟 TTL）+ API 限流降级
- **feat**: Layout 新增 `wide` 属性 — trending 页面使用 1440px 宽屏容器
- **feat**: 导航栏新增「GitHub热门」链接
- **feat**: i18n 新增 trending 词典段
- **fix**: GitHub Search API URL 编码问题 — `URLSearchParams` 会将 `:/>+` 编码导致 API 返回空结果

### 2026-07-30 — v0.7.0 (Phase 10: kkFileView 存储重构 + 三项改进)

**kkFileView 存储重构：**
- **架构变更**: kkFileView 作为主文件存储服务 — 上传通过 `/fileUpload` 代理到 kkFileView，预览直接通过 kkFileView 的 `/onlinePreview` 端点
- **feat**: `uploadToKkFileView()` — Node.js 原生 `http.request` 构造 multipart/form-data 上传
- **feat**: `POST /api/upload-file` 重构 — 文件不再存本地 `public/files/`，改为代理上传到 kkFileView
- **feat**: `DELETE /api/delete-media` 重构 — 调用 kkFileView `/deleteFile` 删除文件
- **feat**: `src/lib/filePreview.ts` — `getPreviewUrl()` 使用 Base64 编码 URL（kkFileView API 协议要求）；新增 `getFileUrl()` 直接文件访问
- **fix**: kkFileView 预览 "主机名为空或无效" 错误 — `url` 参数从 URL 编码修正为 Base64 编码
- **fix**: Vite HMR 自动刷新 — `astro.config.mjs` 添加 `server.watch.ignored: ['**/src/data/**']`

**文件管理三项改进：**
- **feat**: 文件类型白名单从 47 种扩展到 130+ 种（覆盖 kkFileView v5 全部支持格式，含 xmind/Visio/CAD/3D/医学等）
- **feat**: `EXTENSION_ICONS` 精确图标映射 — 120+ 种扩展名按类型显示不同 emoji（.xmind 🧠、.xlsx 📊、.dwg 🏗️、.psd 🎨 等）
- **feat**: 画廊文件卡片显示扩展名徽标（`.XLSX`、`.PDF` 等）
- **feat**: 管理后台「📎 插入媒体」— 事件/文章编辑时从媒体库选择插入 Markdown，上传与编辑分离
- **fix**: 管理后台媒体列表图标从 3 个硬编码 emoji 改为完整图标映射
- **fix**: 上传文件名 title 保留完整扩展名

### 2026-07-30 — v0.6.0 (Phase 9)

- **feat**: 多媒体档案系统 — 画廊页面 `/gallery` + 管理后台「媒体」Tab
- **feat**: 文件上传全面扩展 — 从 6 种图片格式扩展到 30+ 格式（文档/PDF/视频/音频/文本/压缩包）
- **feat**: kkFileView 文件预览集成 — 非图片文件可在线预览（Office/PDF/视频等）
- **feat**: 画廊页面 — 类型筛选 tabs + 相册分组 + 搜索 + 灯箱查看图片
- **feat**: 管理后台第 5 个 Tab「📁 媒体」— 上传/编辑元数据/删除
- **feat**: 事件/博客编辑区上传支持所有文件类型（图片插入 `![alt](url)`，其他插入 `[filename](url)`）
- **feat**: `src/data/media.json` 媒体元数据存储 + parseMedia 加载工具
- **refactor**: `POST /api/upload-image` → `POST /api/upload-file`（扩展名白名单 6→30+，大小限制 10→50MB）
- **feat**: 新增 `POST /api/write-media` 和 `DELETE /api/delete-media` API 端点
- **feat**: 导航栏新增「画廊」链接

### 2026-07-30 — 维护

**代码审查 + 修复：**

- **安全修复**（vite-plugin-admin-api.ts）：
  - 路径穿越防护：`String.includes()` → `isPathWithin()` 规范化路径前缀校验
  - 存储型 XSS 防护：图片上传扩展名白名单（仅允许 png/jpg/jpeg/gif/webp/svg）
  - YAML 注入防护：所有用户输入字段转义双引号、反斜杠和换行符
  - 路径注入防护：`date` 字段正则校验 `^\d{4}(-\d{2}(-\d{2})?)?$`
  - 请求体大小限制：最大 10 MB
  - 文件名清洗保留中文字符
- **Bug 修复**：
  - LifeGrid 暗色模式 CSS 冲突（3 个冲突的 `dark:bg-*` → `dark:bg-gray-950`）
  - ProfileCard 无效 Tailwind 类名（`text-yellow-500-content/80` → `text-amber-600`）
  - 年份详情页硬编码 `/admin` 链接 → 使用 `to('/admin')`
  - LifeCounter 无效出生日期时渲染 NaN → 显示占位提示
  - Layout favicon 路径硬编码 → 使用 `to('/favicon.svg')`
  - FileReader 缺少 onerror 导致上传失败时 UI 永久卡住
  - parseGoals 缺少运行时类型校验
- **代码清理**：
  - 删除零引用死代码 AdminForm.tsx
  - formatDate 从 6 处重复提取到 base.ts 统一维护
  - 卡片 CSS 样式（CARD_CLASSES）提取为共享常量
  - parsePosts 重复函数改为从 postUtils 重导出
  - React.FormEvent 添加泛型参数

**页面抖动修复：**

- **问题**：页面导航时出现可见抖动，博客页尤为明显
- **原因 1**：`global.css` 中 `html { transition: background-color 0.3s ease, color 0.3s ease }` 导致每次页面加载都执行过渡动画
  - **修复**：移除 `html` 全局过渡，仅保留 `.transitioning` 类（手动切换主题时使用）
- **原因 2**：`<html>` 硬编码 `data-theme="emerald"`，暗色模式用户看到亮色闪现
  - **修复**：移除硬编码，改为在防闪烁脚本中同时设置亮/暗两种主题
- **原因 3**：页面高度不同时，浏览器滚动条出现/消失导致横向 ~6px 布局偏移
  - **修复**：`html { overflow-y: scroll }` 强制始终显示滚动条

### 2026-07-29 — v0.5.0
- **feat**: 目标看板 GoalBoard — 短期/长期目标分组，motion 动画进度条，状态标签（进行中/已完成/已暂停）
- **feat**: 目标数据管理 — `src/data/goals.json`，5 个示例目标
- **feat**: 管理后台第 4 个 Tab「目标」— 表单支持增删改查，进度滑块
- **feat**: Vite API 新增 `/api/write-goals` 端点
- **feat**: 生命计数器增强 — 人生进度条（渐变色 + 光泽效果），1/e 分割线标记（约 29.4 岁）
- **feat**: 进度条百分比标签跟随动画，<15% 时标签显示在外侧
- **feat**: 首页集成 GoalBoard，位于 LifeCounter 和 LifeGrid 之间

### 2026-07-29 — v0.4.0 (Phase 8)
- **feat**: daisyUI v5 + motion 框架集成，全局主题系统
- **feat**: 导航栏毛玻璃效果 + 路由高亮 + 页脚
- **feat**: 所有组件/页面颜色统一为 daisyUI token
- **feat**: LifeCounter motion 入场动画 + 进度条
- **feat**: 卡片 hover 抬起 + 阴影增强
- **style**: 按钮/标签/表单全面使用 daisyUI 组件类
- **style**: 全局滚动条美化 + 选中颜色
- **deps**: daisyui@5.7.4, motion@12.43.0

### 2026-07-29 — v0.3.0 (Phase 7)
- **feat**: 个人档案页 `/about` — ProfileCard 组件，展示姓名/头像/技能/短期长期目标
- **feat**: 关系图谱 RelationGraph — Canvas + D3-force 力导向图，9 种关系类型
- **feat**: 粒子背景 + 节点脉冲动画（重要性≥4 呼吸光环）
- **feat**: 悬停高亮、拖拽节点、点击弹出故事面板（共同经历）
- **feat**: 图例筛选，按关系类型高亮/隐藏
- **feat**: 管理后台新增「档案」Tab，单文件编辑模式
- **feat**: Vite API 新增 write-profile 端点
- **feat**: 导航栏新增「关于」链接，i18n 扩展

### 2026-07-29 — v0.2.0 (Phase 6)
- **feat**: 博客系统 — Content Collection `blog`，列表页 `/blog`，详情页 `/blog/[slug]`，标签页 `/blog/tag/[tag]`
- **feat**: BlogCard + BlogList 组件，按年分组 + 标签筛选
- **feat**: 管理后台 Tab 化 — 事件/文章双模式切换，共享编辑面板和图片上传
- **feat**: Vite API 扩展 — `POST /api/write-post`、`DELETE /api/delete-post`
- **feat**: 生命计数器 LifeCounter — 首页展示天/周/年，每秒实时更新，生肖 + 人生进度
- **feat**: `site.config.ts` 新增 `birthDate` 字段，精确计算人生天数
- **feat**: 导航栏新增「博客」链接，i18n 新增博客/计数器相关键
- **feat**: 示例博客文章「你好，世界」

### 2026-07-29 — v0.1.3
- **feat**: GitHub Pages 部署 — GitHub Actions 自动构建 + `astro.config.mjs` 配置 `site`/`base`
- **refactor**: 出生年份配置化 — `src/site.config.ts`，不再硬编码
- **feat**: 全局搜索 — SearchBar 组件，支持标题/分类/标签/正文/地点搜索，键盘导航
- **feat**: 暗色模式手动切换（ThemeToggle 组件 + FOUC 防闪烁 + 过渡动画）
- **feat**: 事件详情页 `/events/[...slug]` — 点击卡片跳转，服务端渲染完整 Markdown
- **feat**: EventCard 改为 `<a>` 标签，支持键盘访问和新标签页打开
- **feat**: 导航栏管理后台入口（仅开发环境显示）
- **deps**: 新增 `@tailwindcss/typography` 插件

### 2026-07-28 — v0.1.2
- **feat**: 管理后台全面升级 — 左右分栏布局（事件列表 + 编辑面板）
- **feat**: 事件列表支持搜索、分类筛选、点击加载
- **feat**: 编辑/预览 Tab 切换，实时 Markdown 渲染
- **feat**: 删除事件（二次确认 + API 删除）
- **feat**: 草稿模式支持（管理后台可查看/筛选草稿）
- **refactor**: `AdminForm.tsx` → `AdminPanel.tsx`（全新组件）

### 2026-07-28 — v0.1.1
- **fix**: 关闭 Astro Dev Toolbar
- **feat**: 添加 i18n 多语言基础（`src/lib/i18n.ts`）
- **refactor**: 所有组件和页面改用 i18n 词典

### 2026-07-28 — v0.1.0
- **feat**: 项目初始化，Astro + React + Tailwind
- **feat**: Content Collection 数据层
- **feat**: 贡献图总览页（LifeGrid）
- **feat**: 纵向时间线（Timeline + 筛选）
- **feat**: 年份详情页（静态预渲染）
- **feat**: 管理后台（AdminForm + Vite API）
- **feat**: 5 个示例事件

---

## 踩坑记录（开发备忘）

> 记录开发中遇到的问题与解决方案，防止再次踩坑。

### 2026-08-01 — 读书观影清单（Phase 14）

**1. 豆瓣图片 CDN 防盗链（418 / 403）**

- 现象：从站内直接 `<img src="https://img*.doubanio.com/...">`，只有个别封面能显示，其余加载失败（浏览器 Referer 非豆瓣域名时返回 403/418）
- 定位：`curl` 无 Referer → 418；带 `Referer: https://movie.douban.com/` 或 `https://book.douban.com/` → 200
- 解决：服务端下载封面到本地 `public/covers/`（请求时按 URL 类型带豆瓣 Referer，`/view/subject/` → book.douban.com，`/view/photo/` → movie.douban.com），页面用本地文件；后台候选缩略图走 `/api/img-proxy` 代理
- 教训：第三方图床/资源默认不可假设可热链，展示型外部资源优先本地化（下载到 `public/` 或自己的媒体服务）

**2. TMDB API 认证与网络**

- v3 API Key 用 `?api_key=` 查询参数（见官方 getting-started）；用 `Authorization: Bearer <v3 key>` 会返回 401（Bearer 只适用于 v4 Read Access Token，可放 `.env.local` 的 `TMDB_READ_TOKEN`）
- 国内网络访问 `api.themoviedb.org` 不稳定（时通时断），`image.tmdb.org` 相对稳定
- 解决：影视/动漫元数据用 **TMDB 与豆瓣并行竞速**（`Promise.race`，谁先返回有效结果用谁），TMDB 失败自动兜底豆瓣；所有外部请求带超时 + 重试（2 次指数退避）；错误信息包含 HTTP 状态与 TMDB 的 `status_message`，便于排查

**3. Vite 插件读不到 `.env.local`**

- 现象：`process.env.TMDB_API_KEY` 在 dev server 中一直为空
- 原因：Vite 不会把 `.env` 注入 `process.env`，需要 `loadEnv(mode, dir, '')`；且目录要基于**插件文件所在目录**（`path.dirname(fileURLToPath(import.meta.url))`），不能依赖 `process.cwd()`（启动目录可能不同）
- 解决：封装 `readEnv()` 统一读取进程环境变量与插件目录的 `.env`

**4. Astro base 与 Vite 插件**

- 现象：vite 插件 `configResolved` 里 `config.base` 是 `"/"`，拿不到 `/ClaudeDemo`
- 原因：Astro 的 `base` 由 Astro 自己处理，不透传给内层 Vite 配置
- 解决：封面等资源存**无 base 路径**（如 `/covers/xxx.jpg`），渲染时用 `coverUrl()`（内部调 `to()`）补全 `/ClaudeDemo` 前缀，本地与线上 GitHub Pages 表现一致

### 2026-08-01 — 清单海报墙改版（v1.2.0）

**1. UI 改版先出方案再动手**

- 现象：清单模块界面连续两轮改版都被否（状态分栏、时间轴），返工成本高
- 解决：此后 UI 大改先给 2~3 套方案（参考 GitHub 优秀项目：Slate / CineLog / Plotwist / NeoDB / 片刻），用户选定方向（封面海报墙）后再实施
- 教训：视觉偏好无法从代码推断，方案先行 + 让用户选择，比直接改更高效

**2. 移除状态枚举要全站清理**

- 现象：`status` 类型去掉 `want` 后，只改 `parseConsumptions.ts` 会引发多处类型/文案残留
- 解决：同步清理 i18n 键（`consumptionsPage.want` / `consumptionStatusOptions.want` / dashboard `readingWant`）、`stats.ts` 的 `consumptionCounts`、`dashboard.astro` 内容行、`AdminPanel.tsx` 表单 state、详情页状态标签
- 验证：`rg -n "想看|\bwant\b" src/` 确认无残留后 `npm run build`（astro check 严格模式兜底）

**3. 视觉 QA 用 Chrome 无头截图（playwright-cli 兜底方案）**

- 现象：`playwright-cli` 依赖 npx 临时拉包，网络不稳定时（registry DNS 解析失败）无法使用
- 解决：本机 Chrome 直接无头截图：`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=out.png "http://localhost:4322/ClaudeDemo/consumptions"`；先 `npm run preview` 起预览服务
- 补充：`--dump-dom` 可导出渲染后 DOM，用于核对网格结构、图片 `src`、无残留文案

### 2026-08-01 — 事件配图与示例图（v1.3.0）

**1. 事件正文里的外链图片同样会挂**

- 现象：事件 Markdown 正文中直接引用 `images.unsplash.com` 外链（武功山/入职），线上与国内访问不稳定
- 解决：沿用封面本地化教训，事件正文外链图替换为本地 `/images/events/*.png`，并新增 frontmatter `images` 字段统一管理配图
- 验证：`npm run build` + 预览服务器图片全部 HTTP 200

**2. 图像生成能力缺失时的占位方案**

- 现象：本会话无内置 image_gen 工具、未配置 `OPENAI_API_KEY`，AI 出图不可用
- 解决：先用纯 Python（zlib+struct 直接写 PNG）生成本地插画式占位图（渐变天空 + 剪影场景），后续可随时替换为真实照片或 AI 图
- 教训：示例图优先本地化；占位图与真实图通过同一 `images` 字段切换，零迁移
