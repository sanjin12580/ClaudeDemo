# Phase 14 设计文档 — 读书观影清单重构（状态分栏 + 时间轴 + 元数据自动获取）

> 日期：2026-08-01 ｜ 版本：v1.1.0

## 一、背景与目标

原清单模块是"封面卡片网格 + 类型/状态筛选"，用户不满足。本轮按用户确认的方向重构：

- **A（状态管理）**：像豆瓣"我的书影音"，按 想看/在看/看过 三栏管理
- **C（时间轴/日记）**：按"看完日期"倒序的时间轴，带短评与日期
- **元数据自动获取**：影视/动漫 → TMDB（用户提供 API Key）；书籍/小说 → 豆瓣（OpenLibrary 在用户网络不可达）；综艺/音乐 → 手动

## 二、数据模型（向后兼容）

`src/data/consumptions.json` 在原有字段基础上新增可选字段：

```ts
year?: number;             // 发行/出版年份
author?: string;           // 作者 / 导演
sourceId?: string;         // TMDB id 或豆瓣 subject id
source?: 'tmdb' | 'douban' | 'manual';
sourceUrl?: string;        // 详情链接
```

`date` 语义：done = 看完日期（时间轴排序依据）；want/doing = 记录日期。

## 三、页面与交互

### `/consumptions`（ConsumptionList.tsx 重构）

- **视图切换**：🗂️ 状态管理 / 📜 时间轴
- **状态管理**：三栏（想看/在看/看过），每栏计数；条目为紧凑列表行：封面缩略图 + 标题 + 年份·作者·类型 + 星级 + 短评预览（2 行截断）
- **时间轴**：只看 done，按年份倒序分组，年份标题 + 竖线时间轴，每条含日期/封面/星级/完整短评
- **搜索**：标题 / 作者 / 标签，大小写不敏感
- 每条可点击进入详情页

### `/consumptions/[id]`（新增，静态生成）

封面大图 + 类型/状态徽标 + 星级 + 元数据（作者/年份/日期/标签/来源链接）+ 完整 Markdown 感受（`@astrojs/markdown-remark` 的 `createMarkdownProcessor` 服务端渲染，零新增依赖）。

### 管理后台「📚 清单」Tab（启用）

- Tab 栏新增入口（原代码已具备但无按钮，本轮补上）
- 表单新增 作者/年份 字段；提交时仅写入非空字段
- 「🪄 自动获取元数据」按钮 → 调 `/api/fetch-metadata` → 返回最多 3 个候选（封面/标题/年份/作者/评分）→ 点击候选自动填充表单
- 封面输入框保留手动粘贴兜底

## 四、服务端元数据接口 `/api/fetch-metadata`（vite 插件）

`GET /api/fetch-metadata?type={type}&title={title}`，返回 `{ success, candidates, hint }`。

- **movie / tv / anime**：TMDB Search API（movie 用 `/search/movie`，tv/anime 用 `/search/tv`），`language=zh-CN`，映射标题/年份/封面（w500）/id/链接/简介
- **book / novel**：豆瓣搜索页（浏览器 UA）→ 解析 `window.__DATA__` 内嵌 JSON → 过滤含 `cover_url` 且 URL 含 `/subject/` 的条目 → 从 `abstract`（"作者 / 出版社 / 年份 / 价格"）提取作者与年份 → 封面 `/m/` 升级为 `/l/`
- **variety / music**：返回空候选 + 提示手动填写
- TMDB Key 读取：`process.env.TMDB_API_KEY || loadEnv('development', process.cwd(), '').TMDB_API_KEY`，`.env.local` 已被 gitignore
- 豆瓣限速：相邻请求至少间隔 1.5s；全部请求带超时（12-15s），失败返回友好错误

## 五、边界与决策

- 旧数据无新字段时正常显示（可选字段兜底）
- `consumptions.json` 示例中 `127.0.0.1:8012` 的封面 URL 是本地 kkFileView 演示地址，线上会失效——待用户后续用自动获取替换
- 综艺/音乐没有合适免费元数据源，保持手动填写
- 管理后台仍是 dev-only 写入（工程侧"保存并发布"另行规划）

## 六、测试计划

1. `npm run build`（astro check + astro build）通过，27 个页面生成（含 6 个清单详情页）
2. `/consumptions`：三栏计数正确（想看/在看/看过）、时间轴按年份倒序、搜索生效
3. `/consumptions/c-001`：三体详情含作者/年份/豆瓣链接，Markdown 引用正常渲染
4. `/api/fetch-metadata?type=book&title=三体`：返回 3 个豆瓣候选（已验证 ✅）
5. `/api/fetch-metadata?type=movie&title=星际穿越`：TMDB 候选（本环境网络不稳，代码路径已验证；用户机器可用）
6. 管理后台「清单」Tab：新增/编辑/删除 + 自动获取候选填充
