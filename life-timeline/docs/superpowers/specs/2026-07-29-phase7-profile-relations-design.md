# Phase 7: 个人档案页 + 关系图谱 — 设计文档

> 创建日期：2026-07-29
> 状态：已定稿

---

## 一、背景与目标

Phase 6 完成了博客系统和生命计数器。Phase 7 实现：

1. **个人档案页** `/about` — 展示个人资料、技能、目标
2. **关系图谱** — 人际关系网络可视化（Canvas + D3-force）

---

## 二、数据模型

### 2.1 个人资料 — Content Collection `profile`

```typescript
// src/content/config.ts — 新增
const profileCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    avatar: z.string().optional(),       // 头像图片 URL
    birthDate: z.string(),               // "YYYY-MM-DD"，关联生命计数器
    skills: z.array(z.string()).default([]),
    shortGoal: z.string().default(''),
    longGoal: z.string().default(''),
  }),
});
```

存储为单个文件 `src/content/profile/about.md`。

### 2.2 关系图谱 — JSON 数据

```typescript
// src/data/relations.json
interface Person {
  id: string;              // 唯一标识
  name: string;            // 姓名
  relation: RelationType;  // 关系类型
  importance: number;      // 1-5，影响节点大小
  avatar?: string;         // 可选头像 URL
  description: string;     // 简短描述
  links: string[];         // 关联的其他人物 id（用于连线）
  stories: { date: string; event: string }[];  // 共同经历
}

type RelationType = '家人' | '爱人' | '挚友' | '导师' | '同事' | '同学' | '萍水相逢' | '观众' | '其他';
```

### 2.3 关系类型配色

| 关系 | 连线颜色 |
|------|----------|
| 家人 | `#ef4444` (红) |
| 爱人 | `#ec4899` (粉) |
| 挚友 | `#22c55e` (绿) |
| 导师 | `#3b82f6` (蓝) |
| 同事 | `#8b5cf6` (紫) |
| 同学 | `#f59e0b` (黄) |
| 萍水相逢 | `#94a3b8` (灰) |
| 观众 | `#06b6d4` (青) |
| 其他 | `#6b7280` (深灰) |

---

## 三、页面布局

### 3.1 路由：`/about`

```
┌──────────────────────────────────────────┐
│  ┌──────────┐                            │
│  │  头像    │  姓名 / 昵称                │
│  │  (圆形)  │  一句话简介                  │
│  │          │  🎂 1998-06-15 · 28岁      │
│  └──────────┘  🏷️ 前端 React 摄影 徒步   │
│                                           │
│  ┌─────────────┐  ┌─────────────┐        │
│  │ 🎯 短期目标  │  │ 🏔️ 长期目标  │        │
│  │ ...         │  │ ...          │        │
│  └─────────────┘  └─────────────┘        │
│                                           │
│  ──────────────────────────────────────  │
│  🕸️ 关系图谱                             │
│  ┌───────────────────────────────────┐   │
│  │     Canvas 力导向图                │   │
│  │     节点大小=重要性，连线颜色=关系   │   │
│  │     粒子背景，节点脉冲动画          │   │
│  └───────────────────────────────────┘   │
│  图例: ●家人 ●爱人 ●挚友 ●导师 ...       │
└──────────────────────────────────────────┘
```

### 3.2 关系图谱组件 — RelationGraph.tsx

**技术栈**：Canvas + D3-force + React

**视觉效果**：
| 效果 | 描述 |
|------|------|
| 力导向布局 | 节点自动排布，弹性动画，可拖拽 |
| 粒子背景 | Canvas 缓慢流动粒子，「星空」感 |
| 节点脉冲 | 重要性≥4 的节点有呼吸光环 |
| 连线渐变 | 按关系类型着色 |
| 悬停高亮 | hover 节点时关联节点/连线高亮，其余变淡 |

**交互行为**：
| 交互 | 行为 |
|------|------|
| 拖拽节点 | 重新定位，松手缓慢回弹 |
| 点击节点 | 弹出侧边面板，展示详情+故事 |
| 滚轮缩放 | 整体缩放 |
| 图例筛选 | 点击图例高亮/隐藏该类关系 |

**故事面板（点击节点弹出）**：
- 人物姓名 + 关系类型 + 重要性星级
- 描述文字
- 共同经历列表（日期 + 事件）
- 关联人物快捷跳转

---

## 四、管理后台集成

### 4.1 AdminPanel 新增「档案」Tab

在现有事件/文章 Tab 旁新增第三个 Tab。档案 Tab 与事件/文章不同：
- 不需要左侧列表（档案只有一个文件）
- 不需要删除按钮
- 不需要 Edit/Preview Tab
- 直接展示表单即可

### 4.2 表单字段

| 字段 | 组件 | 说明 |
|------|------|------|
| 姓名 | `<input>` | 文本 |
| 简介 | `<input>` | 单行文本 |
| 头像 | `<input>` + 上传按钮 | 图片上传后填入 URL |
| 出生日期 | `<input type="date">` | YYYY-MM-DD |
| 技能标签 | `<input>` | 逗号分隔，展示为 pills |
| 短期目标 | `<input>` | 单行文本 |
| 长期目标 | `<input>` | 单行文本 |

### 4.3 Vite API

新增端点：

```
POST /api/write-profile — 保存档案数据到 src/content/profile/about.md
```

---

## 五、导航栏更新

在 `Layout.astro` 导航栏新增「关于」链接，指向 `/about`，位于「博客」和「管理」之间。

---

## 六、新增/修改文件清单

```
src/
├── content/
│   ├── config.ts              # [修改] 新增 profile collection
│   └── profile/
│       └── about.md           # [新增] 个人资料文件
├── data/
│   └── relations.json         # [新增] 关系图谱数据
├── components/
│   ├── AdminPanel.tsx          # [修改] 新增「档案」Tab
│   ├── RelationGraph.tsx       # [新增] Canvas 关系图谱
│   └── ProfileCard.tsx         # [新增] 个人资料卡片
├── lib/
│   ├── types.ts                # [修改] 新增 Profile/Person 类型
│   └── parseProfile.ts         # [新增] 档案加载工具
├── pages/
│   └── about.astro             # [新增] 个人档案页
├── layouts/
│   └── Layout.astro            # [修改] 导航栏新增「关于」链接
src/lib/i18n.ts                 # [修改] 新增 about/relations 键
vite-plugin-admin-api.ts        # [修改] 新增 write-profile API
package.json                    # [修改] 新增 d3 依赖
```

---

## 七、验证计划

1. `npm run build` 构建通过，0 错误
2. `/about` 页面正常渲染个人资料 + 关系图谱
3. 关系图谱：节点可拖拽、点击弹出故事面板、滚轮缩放、图例筛选
4. 管理后台「档案」Tab 可编辑所有字段并保存
5. 头像上传正常
6. 暗色模式全页适配
7. 导航栏「关于」链接正常跳转

---

## 八、不在此次范围

- RSS 订阅
- 评论系统
- 关系数据的网页端编辑（手动维护 JSON）
- 生活数据追踪
- 多媒体档案
