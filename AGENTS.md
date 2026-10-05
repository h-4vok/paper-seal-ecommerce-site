# Repo Rules

- Repo content: English.
- Read `CONTEXT.md` before repo work; load only relevant source docs.
- Runtime: Bun 1.3.10, Node 24.13.0; npm fallback.
- Branches: target `staging`; `main` = human releases.

## Delivery

- During implementation, run only focused checks relevant to the change. Do not run `bun run validate` or `bun run test:e2e`.
- Before handoff, tell the user to run:
  - `bun run validate`
  - `bun run test:e2e`
  - `bun run build-storybook`
- Add or update Playwright coverage when the change requires it. Do not claim that E2E coverage passes unless it was run and passed.
- Text uses LF via `.gitattributes`.
- If Prettier reports failures, run `bunx prettier --write <reported-files>` (including untouched files), inspect the diff, and tell the user to run the required checks.
- Never bypass hooks: do not use `HUSKY=0`, `--no-verify`, `core.hooksPath` overrides, hook edits/removal, or equivalent. The user should normally run `git push`; the pre-push hook must pass.
- If the user requested a PR, hand it off only after GitHub and Netlify checks are green.
- Gate fixes are exempt from the Boy Scout 10% cap.
- For design-system changes, update Storybook stories and capture visual evidence.
- Do not add secrets, real environment values, or unapproved coverage, SEO, or accessibility suppressions.

## Agentic UI Workflow

Use Atomic Design. Storybook = UI source of truth.

- Read `CONTEXT.md` + relevant source before UI work.
- Inventory existing atoms/molecules/organisms first. Reuse before create.
- Lookup: `.design-system-coverage.json` → matching source/story only; tokens + shared classes indexed there. Reuse first; update index with each new component.
- Classify every reusable UI: Foundations → Atoms → Molecules → Organisms → Templates/Pages.
- Keep production component + colocated story + tests + assets together.
- New UI req: real implementation, story, meaningful states, mobile/desktop, a11y interaction coverage.
- Route/page req: compose documented components. No Storybook-only clone.
- Repeated raw markup/class/inline style → extract token/component, or record explicit exception.
- Raw HTML allowed for semantic composition. Exception must state reason, owner, scope.
- Interactive UI: native control, accessible name, keyboard path, visible focus, state, announcement, focus restore.
- Images: deterministic asset, dimensions, meaningful alt, responsive source, fallback/error state.
- Design change: update story + visual evidence. Preserve approved visual direction.
- Report changed stories, tests, gates, visual evidence, exceptions, baseline failures.
- Stop + ask when change needs architecture/visual/product decision not encoded here.
- Boy Scout: fix adjacent issues within 10% task effort; report larger findings.

Definition of done: impl + story + states + tests + asset check + responsive check + validation green.

Story titles: `Foundations/*`, `Atoms/*`, `Molecules/*`, `Organisms/*`, `Templates/*`.

Design-system gate: `bun run check:design-system`. Update `.design-system-coverage.json` with every reusable component and story mapping.

Astro boundary: Storybook React cannot import `.astro` directly. Boundary story may mirror static Astro markup only when named component mapping exists, production classes/tokens/assets remain exact, exception is explicit, and parity review is recorded. Prefer shared implementation extraction when interaction/logic grows.

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
