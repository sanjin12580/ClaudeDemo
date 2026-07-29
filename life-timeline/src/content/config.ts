import { defineCollection, z } from 'astro:content';

// 事件分类
const categories = ['教育', '工作', '旅行', '健康', '关系', '项目', '其他'] as const;

// 事件集合的 schema
const eventsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.string().regex(
      /^\d{4}(-\d{2}(-\d{2})?)?$/,
      '日期格式必须为 YYYY、YYYY-MM 或 YYYY-MM-DD'
    ),
    title: z.string().min(1, '标题不能为空'),
    category: z.enum(categories),
    tags: z.array(z.string()).default([]),
    importance: z.number().int().min(1).max(5).default(3),
    location: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// 博客文章集合的 schema
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    date: z.string().regex(
      /^\d{4}-\d{2}-\d{2}$/,
      '日期格式必须为 YYYY-MM-DD'
    ),
    title: z.string().min(1, '标题不能为空'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  events: eventsCollection,
  blog: blogCollection,
};
