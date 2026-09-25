import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({
  site: 'https://akkhilmorkonda.com',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'auto', assets: 'assets' },
});
