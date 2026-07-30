# 人生时间线 — 开发日志

> 最后更新：2026-07-30 (v0.7.0)

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
│   │   └── AdminPanel.tsx      # 管理面板
│   ├── layouts/
│   │   └── Layout.astro        # 基础布局
│   ├── lib/
│   │   ├── types.ts            # 类型定义
│   │   ├── parseEvents.ts      # 事件解析
│   │   └── i18n.ts             # 多语言工具
│   ├── pages/
│   │   ├── index.astro         # 首页：贡献图总览
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

### 部署
- [x] **GitHub Pages** — GitHub Actions 自动部署，推送 main 分支即构建
- [ ] **自定义域名**

### 数据
- [x] 站点配置文件 `src/site.config.ts` — 出生年份等可配置项
- [ ] 填充真实个人事件 — 保留示例作为模板，通过管理后台自行添加

### 后续子系统（远期）
- [ ] 生活数据追踪（健康/财务/阅读/习惯）
- [x] 思想花园（博客/随笔/笔记）
- [x] 个人档案页（基本资料 + 关系图谱）
- [x] 多媒体档案 — 画廊页面 + kkFileView 文件预览集成
- [x] 人生周数可视化增强

---

## 变更记录

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
