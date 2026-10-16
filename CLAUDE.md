# Claude Code Instructions for modulolotus.net

## Deployment

- **Test site**: Pushing to `main` auto-deploys to https://modulolotus-net.pages.dev/
- **Production**: Requires manual deploy with `mise run deploy` (deploys to modulolotus.net)

## Tech Stack

- Astro 7 with static output for Cloudflare Pages and Workers assets
- Tailwind CSS v4 + DaisyUI v5
- Use the Node.js version in `mise.toml` and `.node-version`; Astro requires 22.22.0 or newer.

## Common Commands

```bash
mise run dev      # Start dev server
mise run build    # Build for production
mise run preview  # Preview the build with Wrangler
```
