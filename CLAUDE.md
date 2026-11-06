# Claude Code Instructions for modulolotus.net

## Deployment

- **Test site**: Pushing to `main` auto-deploys to https://modulolotus-net.pages.dev/
- **Production**: Requires manual deploy with `mise run deploy` (deploys to modulolotus.net)

## Tech Stack

- Astro 7 with static output for Cloudflare Pages and Workers assets
- Tailwind CSS v4 + DaisyUI v5
- Use the Node.js version in `mise.toml` and `.node-version`; Astro requires 22.23.4 or newer.

## Common Commands

```bash
mise run dev      # Serve https://modulo.localhost via portless
mise run build    # Build for production
mise run preview  # Preview the build with Wrangler
```

The portless proxy runs as a background service. Use `pnpm run dev` for the plain http://localhost:4321 fallback without portless.
