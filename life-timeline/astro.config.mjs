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
  },
});
