import { glob } from 'astro/loaders'
import { defineCollection} from 'astro:content';
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/posts" }),
  schema: ({image}) => z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    tags: z.string().optional(),
    mainImage: image(),
    // layout is preserved in frontmatter but ignored by collections API logic
    layout: z.string().optional(),
  }),
});

const makers = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/makers" }),
  schema: ({image}) => z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date(),
    tags: z.string().optional(),
    mainImage: image(),
    // layout is preserved in frontmatter but ignored by collections API logic
    layout: z.string().optional(),
  }),
});

export const collections = { posts, makers };
