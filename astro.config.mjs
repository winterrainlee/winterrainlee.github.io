import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://winterrainlee.github.io',
  integrations: [mdx(), sitemap(), tailwind({ applyBaseStyles: false })],
});
