import { getCollection } from 'astro:content';
import { execFileSync } from 'node:child_process';

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
  return posts.sort((a, b) => timelineDate(b).valueOf() - timelineDate(a).valueOf());
}

export async function getAllPublished() {
  const groups = await Promise.all(
    (Object.keys(sectionLabels) as Section[]).map(async (section) => {
      const posts = await getPublished(section);
      return posts.map((post) => ({ ...post, section }));
    }),
  );

  return groups.flat().sort((a, b) => timelineDate(b).valueOf() - timelineDate(a).valueOf());
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

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const gitLogCache = new Map<string, Date[]>();

function gitDates(filePath?: string) {
  if (!filePath) return [];

  const cached = gitLogCache.get(filePath);
  if (cached) return cached;

  try {
    const value = execFileSync('git', ['log', '--format=%cI', '--', filePath], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const dates = value
      .split('\n')
      .map((line) => new Date(line))
      .filter((date) => !Number.isNaN(date.valueOf()));
    gitLogCache.set(filePath, dates);
    return dates;
  } catch {
    gitLogCache.set(filePath, []);
    return [];
  }
}

type TimelineDatePost = { filePath?: string; data: { date: Date; updated?: Date } };

export function timelineDate(post: TimelineDatePost) {
  return post.data.updated ?? gitDates(post.filePath)[0] ?? post.data.date;
}

export function postFooterDate(post: TimelineDatePost) {
  const dates = gitDates(post.filePath);
  const date = dates[0] ?? post.data.updated ?? post.data.date;
  const label = dates.length <= 1 ? 'Created' : 'Updated';
  return { date, label };
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
