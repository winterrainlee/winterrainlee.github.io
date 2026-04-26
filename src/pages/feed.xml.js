import rss from '@astrojs/rss';
import { entrySlug, getAllPublished, postPath } from '../lib/content';

export async function GET(context) {
  const posts = await getAllPublished();

  return rss({
    title: 'winterrainlee',
    description: 'blog',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postPath(post.section, entrySlug(post)),
    })),
  });
}
