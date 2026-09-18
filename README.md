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

## Artwork content workflow

See [`content/WORKFLOW.md`](./content/WORKFLOW.md) for the full content and asset pipeline,
including the Mermaid diagram.

Edit `content/artworks.yaml` as the single source of truth for editorial artwork data and
the internal asset-generation configuration. Generated JSON files in `src/data/` and
`data/assets/` are committed build outputs and must not be edited manually.

```sh
bun run content:build:metadata
PAPERSEAL_MASTER_DIR=/path/to/approved-masters bun run content:build:assets
```

`bun run content:build` runs both commands in that order. Production masters remain local
or in approved storage; only public display derivatives are written to `public/images/`.

# Content editing

Editable page and interface copy is stored in `content/copy/en-GB`. See [`content/WORKFLOW.md`](content/WORKFLOW.md) for the editing, preview and validation workflow. Product/artwork data remains separate from editorial copy.
