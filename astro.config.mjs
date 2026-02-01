import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://modulolotus.net",
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },

  // AIDEV-NOTE: Redirects moved to public/_redirects file to avoid Cloudflare Workers duplicate rule warnings.
  // AIDEV-NOTE: Will need to reimplement if moving off CloudFlare

  experimental: {},

  adapter: cloudflare(),
});
