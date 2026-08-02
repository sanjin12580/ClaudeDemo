// ============================================================
// 轻量 Markdown 渲染（管理端预览用，不引入外部库）
// 与旧 AdminPanel 内嵌实现保持一致
// ============================================================

export function renderMarkdown(text: string, emptyText = '（空内容）'): string {
  if (!text) return `<p class="text-gray-400 dark:text-gray-500 italic">${emptyText}</p>`;

  const stashed: string[] = [];
  const stash = (htmlStr: string) => {
    stashed.push(htmlStr);
    return `\u0000${stashed.length - 1}\u0000`;
  };

  let html = text;

  // 1) 代码块（先于转义处理，带语言标签，支持 SQL 等）
  html = html.replace(/```([\w+-]*)\n?([\s\S]*?)```/g, (_m, lang: string, code: string) => {
    const safe = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n$/, '');
    const langTag = lang || 'text';
    return stash(
      `<div class="my-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">` +
      `<div class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-[10px] font-mono text-gray-500 dark:text-gray-400">${langTag}</div>` +
      `<pre class="p-3 overflow-x-auto text-xs leading-relaxed"><code class="language-${langTag}">${safe}</code></pre></div>`
    );
  });

  // 2) 原生 HTML 块（视频/音频/iframe/details）整体保留
  html = html.replace(/<(iframe|video|audio|details|summary)[^>]*>[\s\S]*?<\/\1>/gi, (m) => stash(m));

  // 3) 表格（连续以 | 开头的行）
  html = html.replace(/((?:^\|.*\|[ \t]*\r?\n)+)/gm, (block) => {
    const lines = block.trim().split('\n');
    const [head, sep, ...body] = lines;
    if (!sep || !/^\|?[\s:|-]+\|?$/.test(sep.trim())) return block;
    const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const ths = cells(head)
      .map((c) => `<th class="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-left">${c}</th>`)
      .join('');
    const trs = body
      .map((l) => `<tr>${cells(l).map((c) => `<td class="px-3 py-1.5 border border-gray-200 dark:border-gray-700">${c}</td>`).join('')}</tr>`)
      .join('');
    return stash(
      `<div class="my-3 overflow-x-auto"><table class="w-full text-xs border-collapse">` +
      `<thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`
    );
  });

  // 4) 转义剩余文本
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // 5) 块级语法
  html = html
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/^- \[x\] (.+)$/gim, '<label class="flex items-center gap-2 my-1 text-sm"><input type="checkbox" checked disabled class="checkbox checkbox-xs" /> <span class="line-through text-gray-400">$1</span></label>')
    .replace(/^- \[ \] (.+)$/gim, '<label class="flex items-center gap-2 my-1 text-sm"><input type="checkbox" disabled class="checkbox checkbox-xs" /> $1</label>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-green-400 pl-3 italic text-gray-500 dark:text-gray-400 my-2">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/^---+$/gm, '<hr class="my-4 border-gray-200 dark:border-gray-700" />');

  // 6) 行内语法
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-2" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-green-600 dark:text-green-400 underline">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">$1</code>')
    .replace(/\n\n+/g, '</p><p class="mb-2 leading-relaxed">');

  // 7) 还原占位符
  stashed.forEach((p, i) => {
    html = html.split(`\u0000${i}\u0000`).join(p);
  });

  return `<p class="mb-2 leading-relaxed">${html}</p>`;
}
