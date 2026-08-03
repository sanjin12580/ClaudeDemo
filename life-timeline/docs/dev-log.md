# 人生时间线 — 开发日志

> 最后更新：2026-08-03 (v1.10.0)

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

### v1.4.0: 管理后台重构 + 全站体检修复
- [x] **管理后台三栏重构（方案 A）** — 左侧图标导航（带数量角标）+ 内容列表 + 编辑工作区；修复「新建」无法打开空白表单的 bug
- [x] **媒体本地化** — 上传改存 `public/uploads/`（随站发布），不再依赖本地 kkFileView；旧 demo 数据回退兼容
- [x] **移动端导航** — 链接区横向滚动（隐藏滚动条），不再溢出裁切
- [x] **RSS / sitemap / OG 分享标签** — `/rss.xml`、`/sitemap.xml`、canonical + Open Graph + Twitter Card
- [x] **工程修复** — CI 改 `npm ci` + `npm run build`（含 astro check）；admin 生产构建输出重定向页；清除死代码与未用函数；React 18 类型固定到 @types/react 18

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

### 2026-08-03 — v1.9.0 (关于页重构：叙事 Hero 风 + 以我为中心的生命图谱)

- **feat**: ProfileCard 重写为叙事 Hero 风 — 大圆头像（无头像时姓名首字 + 渐变圈）、衬线大标题、生日/年龄信息条、绿色主题渐变光晕背景、技能渐变胶囊、目标卡渐变顶边
- **feat**: RelationGraph 重写为以"我"为中心的生命图谱 — 前端用 profile 生成虚拟 self 节点（固定圆心，头像/首字母），人物按力导向环绕，人物间原连线保留
- **feat**: 节点升级 — 圆形头像（异步加载缓存）、关系类型渐变填充、importance 控制大小、呼吸光晕（self 与高重要性节点）、hover 高亮关联 + tooltip
- **feat**: 边升级 — 关系类型着色、粗细随 importance；关系类型图例筛选保留
- **feat**: 图谱交互 — 手动实现的缩放平移（滚轮以鼠标为锚点）、节点拖拽、双击重置缩放、工具栏（显示标签 / 重置缩放 / 全屏 / 退出全屏）
- **feat**: 详情面板升级 — 头像、关系徽标、故事时间轴（左侧竖线 + 圆点）、关联人物芯片
- **refactor**: 移除杂乱粒子背景；暗色模式继续适配
- **i18n**: relations 词典新增 showLabels / resetZoom / fullscreen / exitFullscreen / empty / self
- **fix**: ProfileCard 头像路径经 `to()` 补站点 base（修复 GitHub Pages 下头像 404 隐患）
- **feat**: 管理后台「档案」Tab 新增「关系图谱」分段编辑器 — 人物增删改（姓名/关系类型/重要度/头像/描述）、关联人物多选 chips、共同经历动态行（日期 + 事件）、删除二次确认；新增 `POST /api/write-relations` 全量写回 `src/data/relations.json`，保存后关于页图谱即时生效
- **feat**: 清单录入「输入即搜，一键填充」— 标题输入防抖 600ms 自动检索元数据；候选卡片升级（封面 + 类型徽标 + 年份/导演/发行日期）；点候选一键带出 title/type/author/year/releaseDate/cover/source 字段且不覆盖手动内容；新增发行日期字段与封面预览
- **feat**: 元数据接口升级 — TMDB 候选并行拉取导演（credits）、带出 release_date、建议类型；豆瓣书籍从 abstract 提取精确发行日期（"2008-5" → 2008-05）；fetch-metadata 支持 author/year 参与候选排序
- **feat**: 清单表单分组重构 — 作品信息（自动带出）/ 我的记录（观看日期 + 「今天」快捷按钮、状态、评分、短评、标签）/ 来源信息折叠区；doing 状态评分可选「未评分」；公共页详情展示发行日期
- **fix**: 清单校验 — date 格式正则校验（YYYY/YYYY-MM/YYYY-MM-DD）、year 1900-2100 整数校验，非法值拒绝保存
- **fix**: 新建记录后首次输入标题不触发自动搜索（skip 标记在空标题时未消费）— 重置表单不再设置跳过标记
- **feat**: 元数据搜索升级为跨类型（type=all）— 输入标题同时检索影视（TMDB+豆瓣）与书籍（豆瓣），候选带类型徽标，点击候选自动切换类型（修复默认"书籍"类型导致电影搜到书的问题）
- **fix**: 点击候选立即填充全部字段（封面先用远程 URL），封面本地下载改为后台执行，不再阻塞字段带出
- **feat**: 同名书影区分 — type=all 时影视同时搜电影（movie）与剧集（tv）两个 TMDB 接口（三体可同时出电影/电视剧/图书）；前端候选按「影视 / 书籍」分组展示，同名书影不再互相淹没
- **fix**: 外部请求超时友好化 — AbortError 不再透出 "This operation was aborted" 原始报错；书籍/影视搜索失败各自兜底返回空候选 + 友好提示（豆瓣 12s 限时），单个数据源超时不再导致整个搜索 502
- **chore**: 版本号 1.9.0

> **已知问题（未解决，2026-08-03 记录）**：书籍/小说元数据搜索依赖豆瓣搜索页（search.douban.com/book），当前网络环境下该域名连接失败（fetch 层面被阻断，非限流），导致书籍候选基本查不出来；电影/电视剧走 TMDB 正常。已测试 Google Books、Open Library、微信读书（weread.qq.com）作为备用书籍源，当前网络下同样不可达；系统未配置代理。临时方案：豆瓣不可达时前端显示友好提示、影视结果不受影响；待网络环境恢复或找到国内可达的书籍数据源后再接入。备选方向：配置系统代理后让 Node 请求走代理、接入当当/京东图书搜索（需反爬处理）、或维护本地书籍库。

### 2026-08-03 — v1.8.0 (旅行足迹地图 Leaflet 重构)

- **feat**: `/travel` 从 ECharts 中国地图重构为 Leaflet 真实底图 — 访问类型分色图钉（旅行=橙 / 工作=蓝 / 教育=紫 / 健康=绿 / 其他=灰）、尺寸按事件数缩放、点击弹出 Popup（城市 / 类型徽标 / 事件链接 / 照片缩略图）
- **feat**: 多瓦片源切换 — 天地图（`vec_w` 矢量底图 + `cva_w` 中文注记，Key 从 `.env` 的 `TDT_KEY` 注入）/ OSM（零配置默认）/ 高德（GCJ02 自动纠偏）/ 无底图（离线降级，标记与连线仍可用）
- **feat**: 访问顺序连线 — 按最早事件日期排序的虚线 + 方向箭头（仅示意先后，可开关）；地图下方新增足迹时间轴，点击条目飞往该城市并打开 Popup
- **fix**: 省份归属误判 — 萍乡原被归为湖南省、黄山被归为浙江省；扩充 `CITY_PROVINCE` 映射 + 新增 ray-casting 点面包含兜底（`provinceFromLocationCoords`，替代"最近中心点"）
- **data**: 每个城市聚合主导访问类型（事件分类计数最多者）与照片列表（`images` 字段经 `to()` 补站点 base）
- **i18n**: 新增 `travel` 词典段（标题 / 描述 / 统计 / 图例 / 按钮 / 空状态），页面文案全部走词典
- **deps**: 新增 `leaflet@1.9.4` + `@types/leaflet`
- **chore**: 版本号 1.8.0

### 2026-08-02 — v1.7.0 (开发环境原地编辑模式)

- **feat**: dev 环境下公共页面可直接新增 / 编辑 / 删除 — 时间线（`/timeline` 新建+编辑、`/timeline/[year]` 编辑）、博客（`/blog` 与 `/blog/tag/[tag]` 新建+编辑）、读书观影（`/consumptions` 新建+编辑）、愿望清单（`/bucket-list` 新建+编辑+删除）
- **feat**: 新增 `src/components/edit/` — `EditDrawer`（右侧滑出抽屉，admin-root 令牌作用域 + 单 Toaster）、`EditButton`、`EventPostEditDialog` / `ConsumptionEditDialog`（直接复用 admin 编辑器组件）、`BucketItemEditor` / `BucketEditorHost`、`DevToaster`、`EventCardWithEdit`
- **feat**: `ui/dialog` 支持 `side="right"` 与 ref 转发；`ConsumptionEditor` 新增 `container`（Select 弹层挂载）与 `showMetaFetch`（公共页关闭元数据拉取）props，admin 默认行为不变
- **feat**: 新增 `src/lib/editActions.ts` 共享 API 调用；`vite-plugin-admin-api` 新增 `POST /api/write-bucket-list`
- **fix**: 恢复 `/api/write-goals` 端点（v0.7.0 重构时被误删，管理端目标保存一直是 404）
- **perf**: 编辑抽屉与 Toaster 全部懒加载，生产构建不加载任何编辑相关 JS
- **style**: 编辑 UI 按各页面视觉语言适配 — 新建按钮改为圆角胶囊并固定于类型 Tab 行尾（清单页不再与搜索/状态筛选挤压），卡片 ✏️ 改为浅色/深色半透明小胶囊（海报封面用深色）
- **chore**: 版本号 1.7.0

### 2026-08-02 — v1.6.0 (首页叙事化改版 · 方案 B)

- **feat**: 首页重构为叙事风 — hero（头像 / 标题「我的人生」/ 档案签名 + 一行统计）+ 生命计数器卡片 + 最近 52 周密度细条 + 倒序最近 5 条事件（分类/星级/地点，整行进详情）+ 三个内容入口（最新博客 / 读书观影 / 愿望清单）
- **feat**: 生命计数器恢复**卡片式**（天/周/年三栏 + 进度条 + 1/e 分割线 + 百分比标签）放在 hero 下方（用户指定保留此形态）；`LifeCounter` 同时保留 `variant="inline"` 紧凑形态供后续复用
- **feat**: 新增 `DensityBand.astro` 服务端渲染组件 — 52 格代表最近 52 周，事件密度 0-4 级绿色阶梯，当前周描边，纯静态无 JS
- **data**: 新增 3 条占位示例事件（2026-07 环西湖晨跑 / 2026-05 黄山看日出 / 2026-03 第一份全栈 Offer，均在近 52 周内，点亮密度条并进入最近事件列表），后续由真实数据替换
- **refactor**: 删除完整人生格子链路 — `LifeGrid` / `buildGridData` / `GridData` / `CellData` / i18n `lifeGrid` 段；首页统计条 `StatsStrip` 与目标看板 `GoalBoard` 一并移除（统计与目标数据仍完整保留在 `/dashboard`，愿望清单入口在首页三卡与 `/bucket-list`）
- **style**: 首页 hero 与时间线预览使用衬线字体营造叙事感（作用域限定首页，全站其他页面不受影响）
- **chore**: 版本号 1.6.0

### 2026-08-02 — v1.5.0 (UI 基座统一：管理端 shadcn 重写 + 公共页 daisyUI 规范化)

- **feat**: 引入 shadcn/ui 体系 — `radix-ui` / `lucide-react` / `class-variance-authority` / `clsx` / `tailwind-merge` / `sonner`，配置 `@/*` 路径别名
- **feat**: shadcn 主题令牌与 daisyUI 双主题共存 — 令牌定义在 `.admin-root` 子树，暗色跟随 `.dark`；Radix Dialog/Select 通过 `container` 挂载到管理端根节点以继承令牌
- **refactor**: `AdminPanel`（2218 行单体）拆分为 `src/components/admin/` — 壳组件 + 事件/文章编辑器 + 目标/清单/媒体/档案管理器 + 共用列表/确认弹窗/媒体选择器/TagInput；表单原语全部换 shadcn（Button/Input/Textarea/Label/Badge/Card/Dialog/Select/Tabs/Slider/Switch），toast 统一 sonner，确认统一 shadcn Dialog
- **refactor**: `MarkdownToolbar` 按钮/输入改 shadcn 风格，功能与插入模板不变
- **refactor**: 公共页 daisyUI 规范化 — `CARD_CLASSES` 统一收敛；dashboard / yearly / bucket-list / ProfileCard / MediaGallery / ConsumptionList / SearchBar / Trending / 事件与博客详情 / 图表与地图容器统一为 daisyUI `card` / `btn` / `input` / `badge` 原语
- **i18n**: 新增 `admin.moduleNav` / `admin.saveBtn` / `admin.noTitle` / `admin.emptyContent`
- **chore**: 版本号 1.5.0；交互契约与 API 不变（保存原地更新 / `isNew` 空白新建 / 未保存拦截 / 删除二次确认 / 媒体上传插入 / 元数据拉取）

### 2026-08-02 — v1.4.0 (管理后台重构 + 全站体检修复)

- **feat**: 管理后台改为三栏内容工作室（左图标导航 + 列表 + 编辑区），模块带数量角标；移动端隐藏列表列
- **fix**: 「＋ 新建」无法打开空白模板 — 新增 `isNew` 状态区分「未选中」与「新建中」，点新建立即出现空白表单
- **fix**: 媒体上传依赖本地 kkFileView 导致线上画廊失效 — 上传改存 `public/uploads/`，`getFileUrl`/`getPreviewUrl` 本地资源补站点 base；旧 `demo/` 数据回退兼容；删除接口本地优先
- **feat**: `/rss.xml` 博客订阅 + `/sitemap.xml` 全站地图 + Layout 全局 canonical/OG/Twitter 分享标签
- **fix**: 移动端导航 9 个链接溢出 — 链接区横向滚动（`.no-scrollbar`）
- **chore**: CI 改 `npm ci` + `npm run build`（含 astro check）；admin 页生产构建输出重定向首页；删除 `uploadToKkFileView` 未用函数与 `delete_modal` 死代码；`@types/react` 固定 18.x 消除类型弃用提示；版本号 1.4.0

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

### 2026-08-02 — 全站体检与媒体本地化（v1.4.0）

**1. 媒体文件指向 localhost 导致线上画廊失效**

- 现象：上传接口把文件写入本地 kkFileView，`getFileUrl` 拼出 `http://localhost:8012/demo/...`——GitHub Pages 上线后，访客浏览器打开的是访客自己机器的 8012 端口，画廊图片/文件全部失败
- 定位：`site.config.kkFileViewUrl` 是本地服务地址，被当作线上资源地址使用；上传链路没有落盘到仓库
- 解决：上传改存 `public/uploads/`（随构建发布），`getFileUrl`/`getPreviewUrl` 对非 `demo/` 路径自动补站点 base；删除接口本地优先，旧 `demo/` 数据回退 kkFileView
- 教训：本地预览服务地址（localhost）永远不能出现在线上资源的 URL 里；展示型文件优先入 `public/` 随站发布

**2. React 18 配 @types/react 19 的类型错配**

- 现象：`astro check` 报 `FormEvent is deprecated`（ts6385）等提示，实际是依赖解析把类型升到了 @types/react 19，而项目用 React 18
- 解决：显式固定 `devDependencies`：`@types/react@^18.3` + `@types/react-dom@^18.3`，提示清零
- 教训：`@types/*` 不显式声明时会跟随传递依赖升级，大版本类型错配会产生误导性告警；框架主版本对应的类型应显式锁定

### 2026-08-02 — UI 基座统一（v1.5.0）

**1. shadcn 令牌与 daisyUI 变量冲突**

- 现象：daisyUI 5 在 `html[data-theme]` 上定义 `--color-*` 系列和 `--border: 1px`，shadcn 的 `--border`（颜色）会被覆盖成 `1px`，`border-border` 失效
- 解决：shadcn 令牌全部定义在 `.admin-root` 子树（亮/暗两套），并在子树内重映射 `--color-*`；`@theme inline` 只负责生成 `bg-background` 等工具类
- 教训：两套设计系统共存时，先查对方在 `html` 上定义了什么变量（`node_modules/daisyui/theme/*.css`），避免同名覆盖

**2. Radix Portal 会脱离主题作用域**

- 现象：Dialog/Select 默认 portal 到 `document.body`，离开 `.admin-root` 后拿不到 shadcn 令牌，弹窗/下拉变透明或全黑
- 解决：`ui/dialog.tsx`、`ui/select.tsx` 支持 `container` prop，管理端把根节点 ref 传进去；sonner Toaster 用 `theme` prop + MutationObserver 跟随 `.dark` 类
- 教训：作用域化 CSS 变量的组件库必须同时约束 Portal 挂载点

**3. astro check 会把 `import.meta.env.DEV` 死代码分支剔除**

- 现象：admin 页生产模式下 `Astro.redirect(to('/'))` 分支被视为不可达，`to` 导入报「未使用」警告
- 解决：把 `const homeUrl = to('/')` 提到分支外再引用
- 教训：Astro 生产检查会窄化 DEV 分支，避免把「仅分支内使用」的导入直接写在分支里

**4. shadcn 动画类依赖 `tailwindcss-animate`**

- 现象：未安装该插件时 `animate-in` / `animate-out` 类静默不生成，无报错
- 解决：本轮不引入动画插件，直接去掉这些类；后续如需动画再补依赖
- 教训：从 shadcn 复制组件时，先核对它依赖的 Tailwind 插件是否已安装

### 2026-08-02 — 首页叙事化改版（v1.6.0）

**1. 删除贡献图要清理连带链路**

- 现象：移除 LifeGrid 后，`buildGridData` / `GridData` / `CellData` / i18n `lifeGrid` 段会残留未使用代码
- 解决：全量 `rg` 检查后一并删除；`GoalBoardData` 虽名为 GoalBoard，但 `parseGoals.ts` 仍在使用必须保留；`goalBoard` i18n 段被 `/yearly/[year]` 引用同样保留
- 教训：删除组件前先 `rg` 全仓确认类型/词典是否被其他模块引用，避免误删仍在使用的基础类型

**2. 稀疏数据下密度条会显示为空**

- 现象：当前示例事件最晚为 2025-05，超出「最近 52 周」窗口，细条大部分为空
- 解决：这是数据问题而非 bug——窗口内无事件就是空格；后续新增事件会自动点亮，必要时可调整 `DensityBand` 的窗口周数
- 教训：时间窗口类可视化要明确「窗口外数据不显示」，避免被误认为渲染故障

### 2026-08-02 — 开发环境原地编辑模式（v1.7.0）

**1. 生产构建必须零残留，编辑代码要懒加载**

- 现象：直接把编辑弹窗组件静态 import 进 Timeline/BlogList/ConsumptionList 后，生产构建会把编辑代码打进已加载的客户端 chunk
- 解决：编辑抽屉与 Toaster 统一用 `React.lazy` 动态导入（`editable=false` 时永不执行 import()），页面级 Astro 组件用 `import.meta.env.DEV` 构建期条件渲染，生产 HTML 与 JS 均无编辑 UI
- 验证：构建后 `rg` dist HTML 无「✏️」「＋ 新建」「data-bucket-*」；确认无编辑 chunk 被页面引用

**2. 公共页复用 shadcn 编辑器需要令牌作用域与 Portal 容器**

- 现象：admin 编辑器组件依赖 `.admin-root` 的 CSS 变量，直接放进公共页抽屉会失去样式；Select 弹层默认 portal 到 body 同样丢令牌
- 解决：抽屉内容根节点加 `admin-root` class；`ui/dialog` 支持 ref 转发，抽屉把内容节点回传给 `ConsumptionEditor` / `BucketItemEditor` 的 `container` prop
- 教训：作用域化 CSS 变量的组件，复用到新宿主时要把「变量作用域」和「Portal 挂载点」一起带过去

**3. 每卡一个弹窗会重复挂载 Toaster**

- 现象：愿望清单若每张卡片单独渲染编辑器岛，会同时挂载多个 sonner Toaster，toast 重复显示
- 解决：卡片只派发 `bucket-edit` / `bucket-new` CustomEvent（`is:inline` 脚本，`import.meta.env.DEV` 守卫），页面级单例 `BucketEditorHost` 监听事件并维护唯一抽屉与 Toaster

**4. `/api/write-goals` 端点被 v0.7.0 误删**

- 现象：管理端目标保存一直 404（toast 报错），`git log -S "write-goals"` 显示端点随 v0.7.0 kkFileView 重构消失
- 解决：按 `write-consumptions` 模式恢复端点（全量写回 `src/data/goals.json`），并顺带新增 `/api/write-bucket-list`
- 教训：重构时用 `rg` 全仓核对前端仍在调用的 API 路径，避免静默断链

### 2026-08-03 — 旅行足迹地图重构（v1.8.0）

**1. Leaflet 不能在 SSR 中导入**

- 现象：`astro build` 生成 `/travel` 时崩溃 `window is not defined`（leaflet 模块顶层即访问 window）
- 解决：TravelMap 改用 `client:only="react"` 指令纯客户端渲染；props（spots/tdtKey）由服务端页面序列化传入，数据聚合仍在构建期完成
- 教训：依赖浏览器全局的库（leaflet 等）即使组件是客户端渲染，模块顶层 import 也会被 Astro SSR 执行，需 `client:only` 或动态 import

**2. Leaflet `subdomains: undefined` 导致瓦片加载崩溃**

- 现象：地图容器正常，但瓦片加载时报 `TypeError: Cannot read properties of undefined (reading 'length')`，React 错误被归因到运行时 chunk，难定位
- 定位：Leaflet `TileLayer._getSubdomain` 直接读 `options.subdomains.length`；显式传 `subdomains: undefined`（OSM 无子域时）会覆盖默认值导致崩溃
- 解决：构造 tileLayer options 时仅在存在子域时传入 `subdomains` 字段
- 教训：Leaflet 的 options 不做 undefined 合并，可选字段要按需传递；生产构建下用 Chrome 无头 + `--enable-logging=stderr` 抓 console 错误比读压缩 chunk 高效

**3. 省份归属"最近中心点"兜底不可靠**

- 现象：萍乡（江西）被点亮为湖南、黄山（安徽）被点亮为浙江，深圳靠近香港中心点也有误判风险
- 解决：城市→省份映射优先，未命中时用 ray-casting 判断点是否落在省份 GeoJSON 多边形内（`pointInGeometry`，纯函数、无新依赖），构建期计算后直接传省份名给前端
- 教训：地理边界判断不要用中心点距离近似，点面包含是最小可靠方案；注意 china.json 与 Nominatim 坐标系可能存在轻微偏移，边界城市需人工核对

**4. 天地图 Key 的注入与合规**

- 天地图浏览器端 Key 免费申请（lbs.tianditu.gov.cn），个人版日配额约 1 万次/图层；Key 放 `.env`（gitignored），由 `travel/index.astro` 服务端读取后作为 prop 传入，避免打进所有客户端 chunk
- 高德瓦片为 GCJ02 坐标系，需 `wgs84ToGcj02()` 纠偏（约 40 行公开算法）；直连瓦片属非官方用法，仅作为可切换选项并保留 OSM / 天地图 / 无底图三条合规路径
- 验证：无 Key 时天地图按钮自动隐藏；配置 Key 后默认切换到天地图底图

### 2026-08-03 — 关于页重构（v1.9.0）

**1. Canvas 全屏/缩放时的尺寸适配**

- 现象：全屏切换与窗口 resize 需要重测画布尺寸，若依赖 React state 驱动 measure 会导致仿真重建、节点位置重置
- 解决：渲染循环每帧读取容器尺寸（getBoundingClientRect），变化时同步 canvas 位图尺寸与 self 圆心位置；isFullscreen 用 ref 同步给渲染循环，无需重建仿真
- 教训：Canvas 动画循环内的尺寸适配放在渲染帧内做，比事件驱动 + state 更稳

**2. 头像异步加载**

- 现象：`new Image()` 后立即 drawImage 画不出内容（图片未加载完成）
- 解决：按 URL 缓存 Image 对象，渲染循环每帧检查 `complete && naturalWidth > 0`，加载完成后自动出现在后续帧；未加载完先用首字母占位
- 教训：Canvas 绘制外部图片必须处理加载时序，用缓存 + 轮询比 onload 单次回调更简单可靠

**3. TypeScript 窄化在嵌套函数中失效**

- 现象：effect 顶层 `if (!ctx) return` 后，嵌套 render 函数内 `ctx` 仍报 possibly null；WheelEvent 与 PointerEvent 参数类型冲突
- 解决：effect 内改用非空断言（`containerRef.current!`、`getContext('2d')!`）配合防御性守卫；事件工具函数参数放宽为 `{ clientX; clientY }` 结构
- 教训：Canvas/动画代码中嵌套函数引用的 DOM 对象，用非空断言比依赖窄化保留更稳

### 2026-08-03 — 清单录入流程重构（v1.9.0）

**1. 旧 dev server 进程残留导致"改代码不生效"**

- 现象：修改 vite 插件与 React 组件后，接口响应仍是旧字段（无 releaseDate/suggestedType），候选数测试也不变；重启 dev server 无效
- 定位：`netstat` 发现 4321 端口被 14:40 启动的旧 dev server（PID 17804）持续占用，后续 Start-Process 启动的实例端口冲突实际未监听；curl 一直命中旧进程
- 解决：按 PID 清理全部残留 node 进程，确认端口空闲后重新启动；改用独立端口（4325）避免冲突
- 教训：Windows 下 `Stop-Process` 需确认生效（`netstat -ano | findstr 端口` 验证），多个 dev/preview 并存时先清端口再调试，避免在旧代码上浪费排查时间

**2. 新建后首次输入不触发自动搜索（skip 标记泄漏）**

- 现象：新建记录后输入标题，网络面板无 fetch-metadata 请求；console 日志显示 effect 执行但 `skip=true`
- 定位：`resetConsumptionForm` 设置 `skipAutoSearchRef=true`（防程序化设置触发搜索），但新建时表单已为空、effect 不运行，标记未被消费；用户首次输入标题时被误跳过
- 解决：重置表单不再设置跳过标记（空标题本身不会触发搜索）；skip 标记只保留在 selectConsumption / applyCandidate（程序化填入非空标题）时使用
- 教训：ref 标记的"设置-消费"要覆盖所有状态路径，空值路径不会消费标记时会造成泄漏

**3. 豆瓣搜索页限流导致候选为空**

- 现象：`/api/fetch-metadata` 间歇返回空候选（"豆瓣没有找到匹配结果"），同一请求稍后重试又有结果
- 定位：豆瓣 subject_search 页面反爬限流（无 __DATA__ 内容时返回空数组），与代码无关
- 处理：保留现状（豆瓣限速 1.5s + TMDB 竞速兜底），失败提示已明确展示；恢复后自动可用

**4. Windows 下 Stop-Process 杀不掉 dev server（子进程残留）**

- 现象：多次 `Stop-Process -Id <pid> -Force` 后端口仍被占用，改动一直不生效；`netstat` 显示监听 PID 是已"杀掉"的进程
- 定位：Start-Process 返回的是包装进程 PID，真正的 node 子进程独立存活；Stop-Process 只杀父进程
- 解决：改用 `taskkill /PID <pid> /F /T`（连子进程树一起杀），杀后必须 `netstat -ano | findstr 端口` 确认无 LISTENING 再启动
- 教训：Windows 开发中清理后台 node 服务要用 taskkill /T；调试"代码改了不生效"先查端口占用，别急着怀疑缓存

**5. 点击候选后字段填充被封面下载阻塞**

- 现象：候选点击后表单字段迟迟不更新（网络差时），用户以为"没带出数据"
- 定位：applyMetadataCandidate 先 await save-cover（下载封面）再 setConsumptionForm，封面下载慢时阻塞全部字段
- 解决：先立即填充字段（封面用远程 URL），封面下载移入后台，成功后再替换为本地路径
- 教训：用户感知的"无响应"常因一个次要请求阻塞了主要更新；关键数据先渲染，增强项后台补

**6. 书籍元数据源单一且当前网络不可达**

- 现象：用"活着"测试时书籍候选基本查不出来（影视正常），且报过 "This operation was aborted"
- 定位：书籍唯一数据源豆瓣搜索页在用户网络下连接失败（node fetch 与 curl 均 fetch failed，属网络层阻断）；Google Books / Open Library / 微信读书接口同样不可达，系统无代理配置
- 处理：已修复超时错误透出与整体 502（各数据源独立兜底）；书籍源本身待网络恢复或接入国内可达源
- 教训：多数据源架构中"主源唯一"是单点风险；影视有 TMDB+豆瓣双源所以稳定，书籍只有豆瓣所以脆弱——后续应优先为书籍补充第二数据源

### 2026-08-03 — 书籍元数据四级降级链（v1.10.0）

**1. 书源连通性必须实测，网络结论会过期**

- 现象：v1.9.0 记录「豆瓣/微信读书/Google Books/Open Library 均不可达」，但本次 curl 实测豆瓣搜索页、豆瓣联想接口、豆瓣详情页、微信读书 Web 搜索全部可达且返回真实数据；Google Books / Open Library / 国图 OPAC / 中文维基百科仍超时；百度百科返回「百度安全验证」反爬页
- 结论：书源选型以当天实测为准，之前不可达的源不要直接否决，也不要只看 README 就接入
- 本次接入：豆瓣（主，保留 subject_search 解析）→ 微信读书（`weread.qq.com/web/search/global`，无 key，返回书名/作者/封面/简介/出版社/评分）→ iTunes（`itunes.apple.com/search?entity=ebook`，仅英文书补充）→ 本地书库（`book-library.json`，离线兜底）

**2. 降级链去重要按「源优先级 + 规范化标题」合并**

- 现象：四路并行后同名书籍会重复出现（豆瓣/微信读书/本地书库都有「活着」），候选列表变长且来源混乱
- 解决：`normalizeBookTitle()` 忽略大小写/空白/常见标点生成 key，合并顺序固定为豆瓣 > 微信读书 > iTunes > 本地书库，先到先占位；hint 按「第一个命中的源」提示本次用了谁
- iTunes 只在标题含拉丁字母时才发起请求，避免中文书名返回一堆无关英文书

**3. 本地书库的封面路径不能走 img-proxy / save-cover**

- 现象：本地书库候选带 `/covers/xxx.jpg` 时，候选缩略图仍走 `/api/img-proxy?url=...`（只接受 http(s)），返回 400 破图；点击候选后 `save-cover` 也会对本地路径发下载请求
- 解决：候选缩略图 `cover.startsWith('/')` 时直接用原路径；`applyMetadataCandidate` 只对 http(s) 封面发起下载
- 教训：本地资源与远程资源混用时，代理/下载逻辑要按 URL 形态分流

**4. source 联合类型扩展要全链清理**

- 现象：`MetadataCandidate.source` / `ConsumptionItem.source` / `ConsumptionFormShape.source` 三处类型不一致会导致 astro check 报错
- 解决：统一扩展为 `'tmdb' | 'douban' | 'weread' | 'itunes' | 'local' | 'manual'`；候选卡片来源徽标、详情页 `sourceLabel`、来源下拉选项、i18n 词典同步更新；旧数据（仅 douban/tmdb/manual）零迁移
