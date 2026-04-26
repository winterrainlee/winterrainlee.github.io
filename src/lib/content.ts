import { getCollection } from 'astro:content';

export type Section = 'articles' | 'bookshelf' | 'thoughts' | 'talks';

export const sectionLabels: Record<Section, string> = {
  articles: 'Articles',
  bookshelf: 'Bookshelf',
  thoughts: 'Thoughts',
  talks: 'Talks',
};

export const sectionPaths: Record<Section, string> = {
  articles: '/articles/',
  bookshelf: '/bookshelf/',
  thoughts: '/thought/',
  talks: '/talks/',
};

export async function getPublished(section: Section) {
  const posts = await getCollection(section, ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getAllPublished() {
  const groups = await Promise.all(
    (Object.keys(sectionLabels) as Section[]).map(async (section) => {
      const posts = await getPublished(section);
      return posts.map((post) => ({ ...post, section }));
    }),
  );

  return groups.flat().sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function postPath(section: Section, slug: string) {
  return section === 'thoughts' ? `/posts/${slug}/` : `/posts/${slug}/`;
}

export function entrySlug(post: { id?: string; slug?: string }) {
  const raw = post.slug ?? post.id ?? '';
  return raw.replace(/\/index$/, '').replace(/\.(md|mdx)$/, '');
}
