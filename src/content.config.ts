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

const timeline = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/timeline' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    link: z.string().url().optional(),
  }),
});

export const collections = {
  articles: writing('./src/content/articles'),
  bookshelf: writing('./src/content/bookshelf'),
  thoughts: writing('./src/content/thoughts'),
  talks: writing('./src/content/talks'),
  timeline,
};
