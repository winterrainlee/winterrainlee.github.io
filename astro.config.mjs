import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';
import rehypeMarkdownText from './src/lib/rehype-markdown-text.mjs';
import remarkWikiLinks from './src/lib/remark-wikilinks.mjs';

export default defineConfig({
  site: 'https://winterrainlee.github.io',
  integrations: [mdx(), sitemap(), tailwind({ applyBaseStyles: false })],
  markdown: {
    remarkPlugins: [remarkWikiLinks],
    rehypePlugins: [rehypeMarkdownText],
  },
});
