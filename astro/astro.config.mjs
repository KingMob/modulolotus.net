import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://modulolotus.net',
  integrations: [mdx(), sitemap(), tailwind()],
  redirects: {
    "/posts/[...slug]": "/blog/[...slug]"
  },
  experimental: {
    svg: true
  }
});