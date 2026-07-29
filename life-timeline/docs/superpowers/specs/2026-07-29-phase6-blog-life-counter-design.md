# Phase 6: 博客系统 + 生命计数器 — 设计文档

> 创建日期：2026-07-29
> 状态：已定稿

---

## 一、背景与目标

life-timeline 项目已完成 Phase 1-5（事件时间线 + 贡献图 + 管理后台），当前版本 v0.1.3。本次 Phase 6 启动远期规划中的第一批子系统：

1. **思想花园（博客系统）** — 独立博客，与事件时间线分离
2. **生命计数器** — 首页展示「已来到地球 X 天/X 周/X 年」
3. **个人档案页 + 关系图谱** — 推迟到 Phase 7

### 目标

- 博客系统：独立 Content Collection，列表页/详情页/标签页，管理后台集成
- 生命计数器：首页 LifeGrid 上方展示，精确到天/周/年
- 站点配置增强：`site.config.ts` 增加 `birthDate` 字段

---

## 二、架构总览

### 新增/修改文件

```
src/
├── content/
│   ├── config.ts              # [修改] 新增 blog collection schema
│   └── blog/                  # [新增] 博客文章目录
├── components/
│   ├── AdminPanel.tsx          # [修改] 新增「文章」Tab
│   ├── BlogCard.tsx            # [新增] 博客文章卡片
│   ├── BlogList.tsx            # [新增] 博客列表（含分类/标签筛选）
│   └── LifeCounter.tsx         # [新增] 生命计数器
├── lib/
│   ├── types.ts                # [修改] 新增 PostMeta 类型
│   └── parsePosts.ts           # [新增] 博客文章加载/分组工具
├── pages/
│   ├── index.astro             # [修改] 加入 LifeCounter
│   └── blog/
│       ├── index.astro         # [新增] 博客列表页
│       ├── [slug].astro        # [新增] 博客详情页
│       └── tag/
│           └── [tag].astro     # [新增] 标签筛选页
├── layouts/
│   └── Layout.astro            # [修改] 导航栏新增「博客」链接
├── site.config.ts              # [修改] 新增 birthDate 字段
vite-plugin-admin-api.ts        # [修改] 新增博客文章 CRUD API
```

---

## 三、数据模型

### 3.1 博客文章类型 (PostMeta)

```typescript
// src/lib/types.ts — 新增
interface PostMeta {
  slug: string;           // "2026-07-29-hello-world"
  date: string;           // "2026-07-29" (YYYY-MM-DD)
  title: string;
  tags: string[];
  draft: boolean;
  body: string;           // Markdown 正文
}
```

### 3.2 Content Collection Schema

```typescript
// src/content/config.ts — 新增 blog collection
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // 仅支持完整日期
    title: z.string().min(1),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});
```

### 3.3 与事件系统的对比

| | 事件 (Event) | 文章 (Post) |
|---|---|---|
| Collection | `events` | `blog` |
| 用途 | 人生节点记录 | 思考与写作 |
| 日期格式 | YYYY / YYYY-MM / YYYY-MM-DD | 仅 YYYY-MM-DD |
| 必填字段 | date, title, category | date, title |
| category | 7 种固定枚举 | 无（可选 tags） |
| importance | 1-5 | 无 |
| location | 可选 | 无 |
| 列表页 | /timeline | /blog |
| 存储路径 | events/{year}/ | blog/ |

### 3.4 site.config.ts 增强

```typescript
// 修改前
export const SITE_CONFIG = {
  birthYear: 1998,
  title: '人生时间线',
  description: '记录我的一生',
};

// 修改后 — 新增 birthDate
export const SITE_CONFIG = {
  birthYear: 1998,
  birthDate: '1998-06-15',    // 新增，用于精确计算天数和周数
  title: '人生时间线',
  description: '记录我的一生',
};
```

---

## 四、博客系统详细设计

### 4.1 页面路由

| 路由 | 页面文件 | 渲染模式 | 说明 |
|------|----------|----------|------|
| `/blog` | `pages/blog/index.astro` | SSG + React 水合 | 文章列表，按年分组，标签筛选 |
| `/blog/[slug]` | `pages/blog/[slug].astro` | SSG 预渲染 | 文章详情 |
| `/blog/tag/[tag]` | `pages/blog/tag/[tag].astro` | SSG 预渲染 | 按标签筛选 |

### 4.2 组件设计

#### BlogList.tsx
- Props: `posts: PostMeta[]`
- 按年份倒序分组（sticky 年份标题）
- 顶部标签筛选栏：统计所有标签出现次数，点击切换筛选
- 空状态：i18n 提示 "还没有文章"
- 交互：点击标签切换筛选（复用 Timeline 标签交互模式）

#### BlogCard.tsx
- 日期（格式：2026年7月29日）
- 标题（`<a>` 链接到 `/blog/{slug}`，hover 绿色高亮）
- 标签 pills（小圆角标签）
- 正文摘要（去除 Markdown 标记，截取 150 字）
- 纯展示组件，无内部状态

#### 博客详情页 (blog/[slug].astro)
- `getStaticPaths()`：遍历所有已发布文章，生成静态路径
- 使用 `entry.render()` 渲染 Markdown → HTML
- 文章头部：标题 + 日期 + 标签列表
- 正文：`<Content />` 组件 + prose 排版
- 上一篇/下一篇导航（按日期排序）
- 404 处理：slug 不匹配时返回 404

### 4.3 管理后台集成

在现有 AdminPanel 顶部新增 Tab 切换：

```
┌─────────────────────────────────────────┐
│  [ 事件 ]   [ 文章 ]                     │
├─────────────────────────────────────────┤
│  左侧：文章列表          右侧：编辑面板    │
│  - 搜索（标题+正文）      - Edit/Preview │
│  - 新建按钮              - 表单字段：    │
│  - 文章列表               │  日期/标题    │
│                          │  标签         │
│                          │  草稿开关     │
│                          │  正文 textarea │
│                          │  图片上传     │
│                          │  删除按钮     │
└─────────────────────────────────────────┘
```

关键行为：
- 切换 Tab 时刷新数据源（事件 → 文章，文章 → 事件）
- 文章表单比事件更简洁（无 importance/location/category 枚举）
- 复用 AdminPanel 的编辑/预览/图片上传/删除确认逻辑
- 标签输入：逗号分隔字符串，展示为 tag pills

### 4.4 Vite API 扩展

新增两个端点：

```typescript
// POST /api/write-post
// 接收：{ date, title, tags, draft, content }
// 行为：在 src/content/blog/{date}-{sanitized-title}.md 写入 frontmatter + body
// 已存在同 slug 文件时覆盖（编辑模式）

// DELETE /api/delete-post
// 接收：{ filePath }
// 行为：删除 src/content/blog/ 下的 .md 文件，安全检查仅限 blog 目录
```

图片上传复用现有 `POST /api/upload-image`，无需修改。

---

## 五、生命计数器详细设计

### 5.1 组件设计 — LifeCounter.tsx

- 纯客户端 React 组件，`client:load` 水合
- Props:
  - `birthDate: string` — 出生日期 "YYYY-MM-DD"
  - `t: i18nDict` — i18n 词典
- 状态：`{ days, weeks, years }` 和当前时间
- 每秒 tick 更新（`setInterval 1000ms`）

### 5.2 数据计算

```typescript
const birth = new Date(birthDate);
const now = new Date();
const diffMs = now.getTime() - birth.getTime();
const days = Math.floor(diffMs / 86400000);
const weeks = Math.floor(days / 7);
const years = days / 365.2425;  // 带一位小数
```

### 5.3 布局

```
┌──────────────────────────────────────────────────┐
│  🌍 已来到地球                                     │
│                                                    │
│   10,258 天  │  1,465 周  │  28.1 年               │
│    ~25亿秒   │  36% 人生  │  属虎 🐯               │
└──────────────────────────────────────────────────┘
```

- 3 列 flex 布局
- 大号数字（`text-3xl font-bold`）+ 小号标签（`text-sm text-gray-500`）
- 副文字：秒数（约数）、人生进度百分比（假设 80 岁寿命）、生肖（按出生年计算）
- 暗色模式适配

### 5.4 首页集成

在 `pages/index.astro` 中，LifeCounter 放在标题和 LifeGrid 之间：

```
标题 "人生全貌"
摘要文案
[LifeCounter 组件]    ← 新增
[SearchBar 组件]
[LifeGrid 组件]
[跳转时间线按钮]
```

---

## 六、导航栏更新

在 `Layout.astro` 导航栏中新增「博客」链接：

```
[人生时间线] [时间线] [博客]    ← 新增     [🌙] [管理]
```

位于「时间线」和「管理」之间，所有页面可见。

---

## 七、i18n 更新

`src/lib/i18n.ts` 新增以下键：

```typescript
blog: {
  title: '博客',
  description: '思考与写作',
  empty: '还没有文章',
  allTags: '全部',
  prevPost: '上一篇',
  nextPost: '下一篇',
  noPrev: '已是第一篇',
  noNext: '已是最后一篇',
},
lifeCounter: {
  title: '已来到地球',
  days: '天',
  weeks: '周',
  years: '年',
  seconds: '秒',
  lifePercent: '人生',
  zodiac: '属',
},
```

---

## 八、验证计划

### 8.1 博客系统

1. `npm run dev` → 导航栏出现「博客」链接
2. 访问 `/blog` → 空状态显示 "还没有文章"
3. 管理后台 → 切到「文章」Tab → 新建文章
4. 保存后 `/blog` 列表页显示新文章
5. 点击文章卡片 → `/blog/{slug}` 详情页正确渲染 Markdown
6. 详情页上一篇/下一篇导航正常
7. 标签筛选：点击标签 → `/blog/tag/{tag}` 正确筛选
8. 编辑已有文章 → 保存覆盖
9. 删除文章 → 二次确认 → 删除成功
10. `npm run build` → 所有博客页面静态生成成功

### 8.2 生命计数器

1. 首页 LifeGrid 上方显示计数器
2. 天/周/年三个数字正确计算
3. 每秒 tick 更新时间
4. 暗色模式切换后样式正常
5. `site.config.ts` birthDate 修改后计数器反映正确数值

### 8.3 回归验证

1. 现有事件时间线、贡献图、搜索功能不受影响
2. 管理后台事件 Tab 功能正常
3. GitHub Pages 构建不报错（`npm run build` 通过）
4. 暗色模式全站正常

---

## 九、不在此次范围

- RSS 订阅（留到后续迭代）
- 文章分类体系（当前仅用 tags）
- 评论系统
- 个人档案页 + 关系图谱（Phase 7）
- 生活数据追踪（Phase 8+）
- 多媒体档案管理
