import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { adminApiPlugin } from './vite-plugin-admin-api';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss(), adminApiPlugin()],
  },
});
