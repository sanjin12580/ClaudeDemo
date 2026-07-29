// ============================================================
// 轻量 i18n — 默认中文，后续可扩展多语言
// 用法：
//   Astro 页面:  import { zh } from '../lib/i18n'
//   React 组件:  import { useI18n } from '../lib/i18n'
// ============================================================

/** 当前语言（默认中文） */
export type Locale = 'zh';

/** 中文词典 */
export const zh = {
  site: {
    title: '人生时间线',
    description: '记录我的一生',
  },
  nav: {
    home: '人生时间线',
    timeline: '时间线',
    blog: '博客',
    admin: '⚙️ 管理',
  },
  home: {
    heading: '🟩 人生全貌',
    summary: (start: number, end: number, count: number) =>
      `从 ${start} 年到 ${end} 年，共记录了 ${count} 个重要时刻。每个格子代表一周，颜色越深表示该周的事件越丰富。`,
    viewTimeline: '查看完整时间线 →',
  },
  timeline: {
    heading: '📜 时间线',
    description: '按时间倒序浏览所有事件，支持按分类和标签筛选。',
    noEvents: '暂无匹配的事件',
    count: (n: number) => `${n} 个事件`,
    filterBy: (cat: string) => ` · 筛选: ${cat}`,
  },
  yearPage: {
    back: '← 返回时间线',
    count: (n: number) => `共 ${n} 个事件`,
    empty: '这一年还没有记录',
    goAdd: '去添加 →',
  },
  admin: {
    heading: '⚙️ 管理后台',
    description: '创建和编辑人生事件与博客文章。',
    fileSavedTo: '文件将保存到',
    dir: 'src/content/events/',
    blogDir: 'src/content/blog/',
    and: '和',
    warning: '此功能仅在本地开发环境',
    devOnly: 'npm run dev',
    warningSuffix: '下可用。',
    // 列表
    eventList: '事件列表',
    postList: '文章列表',
    allEvents: '全部',
    search: '搜索...',
    newEvent: '+ 新建事件',
    newPost: '+ 新建文章',
    deleteConfirm: '确定删除「{title}」？此操作不可撤销。',
    deleteTitle: '确认删除',
    deleted: '已删除',
    deleteFailed: '删除失败',
    emptyList: '还没有内容',
    draftBadge: '草稿',
    articleBadge: '文章',
    tabEvents: '事件',
    tabPosts: '文章',
    // 编辑面板
    editTab: '编辑',
    previewTab: '预览',
    noSelection: '← 从左侧列表选择一项开始编辑，或点击「+ 新建」',
    // 表单
    dateLabel: '日期 *',
    dateHint: '精确到日，也可手动输入如 2024-03（只到月）',
    titleLabel: '标题 *',
    titlePlaceholder: '如：入职新公司、武功山徒步',
    categoryLabel: '分类',
    importanceLabel: '重要性',
    importanceMin: '1（轻微）',
    importanceMax: '5（里程碑）',
    draftToggle: '存为草稿（草稿不会显示在网站上）',
    locationLabel: '地点',
    locationPlaceholder: '如：深圳、武功山',
    tagsLabel: '标签',
    tagsPlaceholder: '多个标签用逗号分隔，如：前端, React, 转折点',
    contentLabel: '正文',
    contentPlaceholder: 'Markdown 格式，可嵌入图片链接和视频链接...',
    submitBtn: '保存事件',
    savingBtn: '保存中...',
    validationError: '请填写日期和标题',
    saved: (path: string) => `已保存: ${path}`,
    saveFailed: '保存失败',
    networkError: (msg: string) => `网络错误: ${msg}`,
    unknownError: '未知错误',
    cancelBtn: '取消',
    deleteBtn: '删除',
    // 图片上传
    imageUpload: '📷 上传图片',
    imageDrop: '拖拽图片到此处，或点击选择',
    imageUploading: '上传中...',
    imageFailed: '上传失败',
    imageMaxSize: '图片不能超过 10MB',
  },
  lifeGrid: {
    less: '清淡',
    more: '丰富',
    tooltip: (year: number, week: number) => `${year} 年第 ${week} 周`,
  },
  eventCard: {
    importance: (v: number) => `重要性: ${v}/5`,
  },
  eventDetail: {
    back: '← 返回时间线',
    prev: '← 上一篇',
    next: '下一篇 →',
    importance: (v: number) => `重要性: ${v}/5`,
    notFound: '事件未找到',
  },
  theme: {
    toggle: '切换主题',
    toDark: '切换到暗色模式',
    toLight: '切换到亮色模式',
  },
  search: {
    placeholder: '搜索事件...',
    results: (n: number) => `找到 ${n} 个结果`,
    noResults: '没有找到匹配的事件',
    clear: '清除搜索',
  },
  categories: {
    all: '全部',
    教育: '教育',
    工作: '工作',
    旅行: '旅行',
    健康: '健康',
    关系: '关系',
    项目: '项目',
    其他: '其他',
  },
  /** 博客相关 */
  blog: {
    title: '🌱 博客',
    description: '思考与写作',
    empty: '还没有文章',
    allTags: '全部',
    backToList: '← 返回博客列表',
    prevPost: '← 上一篇',
    nextPost: '下一篇 →',
    noPrev: '已是第一篇',
    noNext: '已是最后一篇',
    notFound: '文章未找到',
    tagged: '标签',
    postsCount: '篇文章',
  },
  /** 生命计数器 */
  lifeCounter: {
    title: '🌍 已来到地球',
    days: '天',
    weeks: '周',
    years: '年',
    seconds: '秒',
    lifePercent: '人生进度',
    zodiac: '属',
  },
} as const;

/** 当前激活的词典 */
const dictionaries: Record<Locale, typeof zh> = { zh };

/** React Hook：获取当前语言的词典 */
export function useI18n() {
  return dictionaries.zh;
}

/** Astro 页面直接引用 */
export const t = dictionaries.zh;
