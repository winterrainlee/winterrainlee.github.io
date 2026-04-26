import rss from '@astrojs/rss';
import { entrySlug, getAllPublished, postPath } from '../lib/content';

export async function GET(context) {
  const posts = await getAllPublished();

  return rss({
    title: '겨울비',
    description: '끄적이는 것을 좋아하는 개인의 단상과 정리된 생각',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: postPath(post.section, entrySlug(post)),
    })),
  });
}
