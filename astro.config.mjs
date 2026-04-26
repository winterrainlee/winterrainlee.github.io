import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import remarkWikiLinks from './src/lib/remark-wikilinks.mjs';

export default defineConfig({
  site: 'https://winterrainlee.github.io',
  integrations: [mdx(), sitemap(), tailwind({ applyBaseStyles: false })],
  markdown: {
    remarkPlugins: [remarkWikiLinks],
  },
});
