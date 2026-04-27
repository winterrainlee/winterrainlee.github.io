import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const writingSchema = ({ image }: { image: () => z.ZodTypeAny }) =>
  z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    thumbnail: image().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  });

const writing = (base: string) =>
  defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base }),
    schema: writingSchema,
  });

const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: z.object({
    home: z.object({
      description: z.string(),
    }),
    memo: z.object({
      description: z.string(),
      intro: z.string(),
    }),
    articles: z.object({
      description: z.string(),
      intro: z.string(),
    }),
    selfPractice: z.object({
      description: z.string(),
      intro: z.string(),
    }),
    timeline: z.object({
      description: z.string(),
      intro: z.string(),
    }),
    guestbook: z.object({
      description: z.string(),
      intro: z.string(),
    }),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = {
  articles: writing('./src/content/articles'),
  memo: writing('./src/content/memo'),
  'self-practice': writing('./src/content/self-practice'),
  pages,
  site,
};
