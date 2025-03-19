import { z, defineCollection } from "astro:content";
import { glob, file } from 'astro/loaders';


const blogSchema = z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.string().optional(),
    heroImage: z.string().optional(),
    badge: z.string().optional(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).refine(items => new Set(items).size === items.length, {
        message: 'tags must be unique',
    }).optional(),
});

export type BlogSchema = z.infer<typeof blogSchema>;

const blog = defineCollection({ 
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
    schema: blogSchema 
});

export const collections = {
    'blog': blog
}