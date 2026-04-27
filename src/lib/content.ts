import { getCollection } from 'astro:content';

export type Section = 'memo' | 'articles' | 'self-practice';

export const sectionLabels: Record<Section, string> = {
  memo: 'Memo',
  articles: 'Article',
  'self-practice': 'Self-Practice',
};

export const sectionPaths: Record<Section, string> = {
  memo: '/memo/',
  articles: '/articles/',
  'self-practice': '/self-practice/',
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

export async function getSiteIntroductions() {
  const entries = await getCollection('site');
  const introductions = entries.find((entry) => entry.id === 'introductions.md' || entry.id === 'introductions');

  if (!introductions) {
    throw new Error('Missing site introductions content entry.');
  }

  return introductions.data;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function postPath(section: Section, slug: string) {
  return `/${section}/${slug}/`;
}

export function entrySlug(post: { id?: string; slug?: string }) {
  const raw = post.slug ?? post.id ?? '';
  return raw.replace(/\/index$/, '').replace(/\.(md|mdx)$/, '');
}

export function readingMinutes(post: { body?: string; data?: { description?: string } }) {
  const text = `${post.body ?? ''} ${post.data?.description ?? ''}`.trim();
  const koreanChars = (text.match(/[가-힣]/g) ?? []).length;
  const words = (text.replace(/[가-힣]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  const units = koreanChars / 2.5 + words;
  return Math.max(1, Math.round(units / 220));
}
