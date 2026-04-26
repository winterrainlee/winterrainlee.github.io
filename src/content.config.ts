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

export const collections = {
  articles: writing('./src/content/articles'),
  memo: writing('./src/content/memo'),
  'self-practice': writing('./src/content/self-practice'),
};
