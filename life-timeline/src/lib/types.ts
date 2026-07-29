/** 事件分类 */
export type Category = '教育' | '工作' | '旅行' | '健康' | '关系' | '项目' | '其他';

/** 分类的颜色映射（daisyUI badge 类名） */
export const CATEGORY_COLORS: Record<Category, string> = {
  教育: 'badge-primary',
  工作: 'badge-secondary',
  旅行: 'badge-success',
  健康: 'badge-error',
  关系: 'badge-accent',
  项目: 'badge-warning',
  其他: 'badge-ghost',
};

/** 从 Frontmatter 解析出的事件元数据 */
export interface EventMeta {
  slug: string;           // 文件名（不含扩展名），如 "2024-03-15-入职新公司"
  date: string;           // "YYYY-MM-DD" | "YYYY-MM" | "YYYY"
  title: string;
  category: Category;
  tags: string[];
  importance: number;     // 1-5
  location?: string;
  draft: boolean;
  body: string;           // Markdown 正文（渲染前）
}

/** 贡献图中的一个格子 */
export interface CellData {
  year: number;
  week: number;           // 1-52
  intensity: number;      // 0-4（颜色深浅）
  events: EventMeta[];    // 本周的事件
}

/** 贡献图传给 LifeGrid 的完整数据 */
export interface GridData {
  startYear: number;      // 出生年
  endYear: number;        // 当前年
  cells: CellData[];
}

/** 按年份分组的事件 */
export interface YearGroup {
  year: number;
  events: EventMeta[];
}

/** 博客文章元数据 */
export interface PostMeta {
  slug: string;           // 文件名（不含扩展名），如 "2026-07-29-hello-world"
  date: string;           // "YYYY-MM-DD"
  title: string;
  tags: string[];
  draft: boolean;
  body: string;           // Markdown 正文（渲染前）
}

/** 按年份分组的文章 */
export interface PostYearGroup {
  year: number;
  posts: PostMeta[];
}

/** 关系类型 */
export type RelationType = '家人' | '爱人' | '挚友' | '导师' | '同事' | '同学' | '萍水相逢' | '观众' | '其他';

/** 关系类型配色 */
export const RELATION_COLORS: Record<RelationType, string> = {
  家人: '#ef4444',
  爱人: '#ec4899',
  挚友: '#22c55e',
  导师: '#3b82f6',
  同事: '#8b5cf6',
  同学: '#f59e0b',
  萍水相逢: '#94a3b8',
  观众: '#06b6d4',
  其他: '#6b7280',
};

/** 关系图谱 — 人物节点 */
export interface Person {
  id: string;
  name: string;
  relation: RelationType;
  importance: number;       // 1-5，影响节点大小
  avatar?: string;
  description: string;
  links: string[];          // 关联的其他人物 id
  stories: { date: string; event: string }[];
}

/** 关系图谱数据 */
export interface RelationsData {
  people: Person[];
}

/** 个人资料 */
export interface Profile {
  name: string;
  tagline: string;
  avatar?: string;
  birthDate: string;        // "YYYY-MM-DD"
  skills: string[];
  shortGoal: string;
  longGoal: string;
}
