// ============================================================
// GitHub 语言颜色映射
// 参考：https://github.com/ozh/github-colors
// ============================================================

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Vue: '#41b883',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Zig: '#ec915c',
  Dart: '#00B4AB',
  Lua: '#000080',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Clojure: '#db5855',
  Scala: '#c22d40',
  R: '#198CE7',
  Julia: '#a270ba',
  'Objective-C': '#438eff',
  MDX: '#fcb32c',
  Markdown: '#083fa1',
  Makefile: '#427819',
  Dockerfile: '#384d54',
  CMake: '#DA3434',
};

/**
 * 获取某个语言的 GitHub 颜色（hex 格式）
 * 未知语言返回默认灰色
 */
export function getLanguageColor(language: string | null | undefined): string {
  if (!language) return '#8b8b8b';
  return LANGUAGE_COLORS[language] ?? '#8b8b8b';
}

export default LANGUAGE_COLORS;
