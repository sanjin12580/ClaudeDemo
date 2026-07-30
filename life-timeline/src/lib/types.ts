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

/** 人生目标 */
export interface Goal {
  id: string;               // 唯一标识，如 "g-001"
  title: string;            // 目标标题
  description: string;      // 备注
  progress: number;         // 0-100
  category: 'short' | 'long';
  relatedEvents: string[];  // 关联的事件 slug
  status: 'active' | 'completed' | 'paused';
  createdAt: string;        // ISO 日期
}

/** 目标看板数据 */
export interface GoalBoardData {
  short: Goal[];
  long: Goal[];
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

// ============================================================
// 多媒体档案 — 文件类型与媒体条目
// ============================================================

/** 文件大类（用于前端图标和预览策略） */
export type FileType = 'image' | 'document' | 'pdf' | 'video' | 'audio' | 'archive' | 'text' | 'mindmap' | 'cad' | 'other';

/** 允许上传的扩展名（按文件大类分组，覆盖 kkFileView v5 支持的格式） */
export const ALLOWED_EXTENSIONS: Record<FileType, string[]> = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tif', 'tiff', 'tga', 'heic', 'heif', 'jfif', 'psd', 'eps', 'wmf', 'emf'],
  document: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'csv', 'tsv', 'wps', 'dps', 'et', 'ett', 'wpt', 'vsd', 'vsdx', 'rtf', 'ofd', 'xlsm', 'pptm', 'dotm', 'dotx', 'xlam', 'xla', 'xlt', 'xltm', 'ots', 'otp', 'ott', 'fodt', 'fods', 'six', 'pages'],
  pdf: ['pdf', 'epub', 'mobi', 'azw3'],
  video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'rm', 'rmvb', '3gp', 'm4v', 'ts', 'mpeg', 'mpd', 'm3u8', 'm4a'],
  audio: ['mp3', 'wav', 'ogg', 'wma', 'aac'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'jar'],
  text: ['txt', 'md', 'json', 'xml', 'csv', 'yaml', 'yml', 'js', 'ts', 'java', 'py', 'c', 'cpp', 'h', 'css', 'html', 'htm', 'sql', 'sh', 'bat', 'properties', 'ini', 'toml', 'log', 'php', 'asp', 'jsp', 'gitignore', 'bas', 'prg', 'cmd', 'rb', 'go', 'cs', 'aspx', 'lua'],
  mindmap: ['xmind', 'mmap', 'bpmn', 'drawio'],
  cad: ['dwg', 'dxf', 'dwf', 'dwt', 'stl', 'step', 'iges', 'igs', 'dng', 'ifc', 'dwfx', 'cf2', 'plt', 'obj', '3ds', 'ply', 'gltf', 'glb', 'off', '3dm', 'fbx', 'dae', 'wrl', '3mf', 'brep', 'fcstd', 'bim', 'stp', 'o3dv'],
  other: ['eml', 'msg', 'dcm'],
};

/** 所有允许的扩展名扁平集合（用于服务端校验） */
export const ALL_ALLOWED_EXTENSIONS: Set<string> = new Set(
  Object.values(ALLOWED_EXTENSIONS).flat()
);

/** 根据扩展名判断文件大类 */
export function classifyFileType(ext: string): FileType {
  const lower = ext.toLowerCase();
  for (const [type, exts] of Object.entries(ALLOWED_EXTENSIONS)) {
    if (exts.includes(lower)) return type as FileType;
  }
  return 'other';
}

/** 文件类型的 emoji 图标 */
export const FILE_TYPE_ICONS: Record<FileType, string> = {
  image: '🖼️',
  document: '📄',
  pdf: '📑',
  video: '🎬',
  audio: '🎵',
  archive: '📦',
  text: '📝',
  mindmap: '🧠',
  cad: '📐',
  other: '📎',
};

/** 按扩展名的精确图标映射（优先于 FILE_TYPE_ICONS） */
export const EXTENSION_ICONS: Record<string, string> = {
  // 图片
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
  bmp: '🖼️', ico: '🖼️', tif: '🖼️', tiff: '🖼️', tga: '🖼️',
  heic: '📷', heif: '📷', jfif: '🖼️',
  psd: '🎨', eps: '🎨', wmf: '🖼️', emf: '🖼️',

  // Office 文档（按品牌区分）
  doc: '📝', docx: '📝', dot: '📝', dotx: '📝', dotm: '📝', wps: '📝', pages: '📝',
  xls: '📊', xlsx: '📊', xlsm: '📊', xlt: '📊', xltm: '📊', xla: '📊', xlam: '📊', csv: '📊', tsv: '📊', et: '📊', ett: '📊',
  ppt: '📽️', pptx: '📽️', pptm: '📽️', dps: '📽️',
  vsd: '📐', vsdx: '📐',
  odt: '📄', ods: '📄', odp: '📄', ots: '📄', otp: '📄', ott: '📄', fodt: '📄', fods: '📄', six: '📄',
  rtf: '📝', ofd: '📄', wpt: '📝',

  // 邮件
  eml: '✉️', msg: '✉️',

  // PDF / 电子书
  pdf: '📑', epub: '📖', mobi: '📖', azw3: '📖',

  // 视频
  mp4: '🎬', webm: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
  flv: '🎬', wmv: '🎬', rmvb: '🎬', rm: '🎬', '3gp': '🎬',
  m4v: '🎬', mpeg: '🎬', mpd: '🎬', m3u8: '🎬',

  // 音频
  mp3: '🎵', wav: '🎵', ogg: '🎵', aac: '🎵', wma: '🎵', m4a: '🎵',

  // 压缩包
  zip: '📦', rar: '📦', '7z': '📦', tar: '📦', gz: '📦', bz2: '📦', xz: '📦', jar: '📦',

  // 文本/代码
  txt: '📝', md: '📝', json: '📋', xml: '📋',
  yaml: '📋', yml: '📋',
  js: '💛', ts: '💙', java: '☕', py: '🐍',
  c: '⚙️', cpp: '⚙️', h: '⚙️',
  css: '🎨', html: '🌐', htm: '🌐',
  sql: '🗄️', sh: '💻', bat: '💻', ps1: '💻',
  properties: '📋', ini: '📋', toml: '📋', log: '📋',
  php: '🐘', rb: '💎', go: '🔵', cs: '🟣', aspx: '🌐', lua: '🌙',
  asp: '🌐', jsp: '🌐', gitignore: '📋', bas: '📋', prg: '📋', cmd: '💻',

  // 思维导图 / 流程图
  xmind: '🧠', mmap: '🧠', bpmn: '🔀', drawio: '🔀',

  // CAD / 3D
  dwg: '🏗️', dxf: '🏗️', dwf: '🏗️', dwt: '🏗️',
  stl: '🧊', step: '🧊', iges: '🧊', igs: '🧊',
  dng: '📐', ifc: '🏗️', dwfx: '🏗️', cf2: '📐', plt: '📐',
  obj: '🧊', '3ds': '🧊', ply: '🧊', gltf: '🧊', glb: '🧊',
  off: '🧊', '3dm': '🧊', fbx: '🧊', dae: '🧊', wrl: '🧊',
  '3mf': '🧊', brep: '🧊', fcstd: '🧊', bim: '🧊', stp: '🧊', o3dv: '🧊',

  // 医学
  dcm: '🩻',
};

/** 获取文件的最佳图标：优先扩展名图标，回退到 FileType 图标 */
export function getIconForFile(filename: string, fileType?: FileType): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return EXTENSION_ICONS[ext] || (fileType ? FILE_TYPE_ICONS[fileType] : FILE_TYPE_ICONS.other);
}

/** 媒体条目 */
export interface MediaItem {
  id: string;          // 唯一标识，如 "m-001"
  filename: string;    // 实际存储文件名
  url: string;         // 访问路径，如 "/files/1712345678-report.pdf"
  title: string;       // 显示标题
  description?: string;// 描述
  album: string;       // 所属相册/分组，默认 "未分类"
  fileType: FileType;  // 文件大类
  mimeType: string;    // 原始 MIME 类型
  fileSize: number;    // 字节数
  tags: string[];
  createdAt: string;   // ISO 上传时间
}

/** 媒体数据存储格式 */
export interface MediaData {
  media: MediaItem[];
}
