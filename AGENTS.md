# Repo Rules

- Repo content: English.
- Read `CONTEXT.md` before repo work; load only relevant source docs.
- Runtime: Bun 1.3.10, Node 24.13.0; npm fallback.
- Branches: target `staging`; `main` = human releases.

## Delivery

- Before handoff run `bun run validate`: copy check, lint, format, typecheck, covered unit tests, build.
- Run `bun run test:e2e`; add/update Playwright coverage.
- Format is implementation: on Prettier failure run `bunx prettier --write <changed-files>`, inspect diff, recheck.
- Pre-existing unrelated format failures: do not rewrite whole worktree; fix changed files, report baseline failures.
- Design-system changes: update Storybook stories; capture visual evidence.
- No secrets, real env values, or unapproved coverage/SEO/a11y suppressions.

## UI / A11y

- Mobile-first CSS; functional tokens; max 3 nesting levels; no `!important`.
- WCAG 2.2 AA required. Prefer semantic HTML/native controls.
- Interactive UI: keyboard, visible focus, logical order, focus restore, accessible names, ARIA state, live announcements, reduced motion, contrast.
- Add unit semantics/state tests, Storybook states, Playwright keyboard/focus tests, and axe checks.

## SEO

- Every user route uses `src/layouts/BaseLayout.astro`.
- Metadata: `src/components/SeoHead.astro`; structured data: `src/components/JsonLd.astro`.
- Indexable pages need unique title/description, canonical, OG/Twitter metadata, one primary `h1`, SSR/prerendered critical content, stable URLs, internal links.
- Images need meaningful alt and dimensions where possible.
- Keep `sitemap.xml`/`robots.txt` valid; set product/category indexability explicitly.
- Test metadata, headings, canonical, JSON-LD, crawlability; run SEO/a11y checks.
