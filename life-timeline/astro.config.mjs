import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { adminApiPlugin } from './vite-plugin-admin-api';

// https://astro.build/config
export default defineConfig({
  site: 'https://sanjin12580.github.io',
  base: '/ClaudeDemo',
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss(), adminApiPlugin()],
    server: {
      watch: {
        // 排除管理后台 API 写入的数据文件，防止上传/删除/保存操作触发页面刷新
        ignored: ['**/src/data/**'],
      },
    },
  },
});
