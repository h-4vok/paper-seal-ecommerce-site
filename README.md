# Paperseal

Paperseal is an art boutique storefront in its earliest implementation stage. The MVP will present a considered, editorial shopping experience for framed art and connect it to Shopify for commerce.

This repository currently provides the production-ready project foundation: Astro static rendering, a custom design-system boundary, Storybook, Vitest, Playwright, quality gates, GitHub Actions, and Netlify deployment configuration. The visible product is intentionally a small coming-soon page until the feature epics are implemented.

## Development

Use Bun 1.3.10 with Node.js 24.13.0.

```sh
bun install
bun run dev
```

Before opening a PR, run `bun run validate` and `bun run test:e2e`. Feature pull requests target `staging`; `main` is reserved for releases.

Read [`AGENTS.md`](./AGENTS.md) and [`CONTEXT.md`](./CONTEXT.md) before making project changes.
