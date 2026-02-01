# Claude Code Instructions for modulolotus.net

## Deployment

- **Test site**: Pushing to `master` auto-deploys to https://modulolotus-net.pages.dev/
- **Production**: Requires manual deploy with `mise run deploy` (deploys to modulolotus.net)

## Tech Stack

- Astro 5 with Cloudflare adapter
- Tailwind CSS v4 + DaisyUI v5
- Node.js 22+ required (see `.node-version`)

## Common Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm preview      # Preview production build locally
```
