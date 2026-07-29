# 人生时间线 — 开发日志

> 最后更新：2026-07-29

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

### 部署
- [x] **GitHub Pages** — GitHub Actions 自动部署，推送 dev 分支即构建
- [ ] **自定义域名**

### 数据
- [x] 站点配置文件 `src/site.config.ts` — 出生年份等可配置项
- [ ] 填充真实个人事件 — 保留示例作为模板，通过管理后台自行添加

### 后续子系统（远期）
- [ ] 生活数据追踪（健康/财务/阅读/习惯）
- [ ] 思想花园（博客/随笔/笔记）
- [ ] 关系图谱
- [ ] 多媒体档案
- [ ] 人生周数可视化增强

---

## 变更记录

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
