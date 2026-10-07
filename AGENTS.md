# Repo Rules

- Repo content: English.
- Read `CONTEXT.md` before repo work; load only relevant source docs.
- Runtime: Bun 1.3.10, Node 24.13.0; npm fallback.
- Branches: all feature pull requests target `staging`; `main` is reserved for human releases.

## Delivery

- Run focused checks relevant to the change during implementation.
- Commit hook checks, in order: `bun run check:copy`, `bun run check:design-system`, `bun run lint`, `bun run typecheck`, `bun run build`.
- Push hook checks, in order: `bun run format`, `bun run test`, `bun run build-storybook`.
- If `bun run format` fails, run `bun run format:write`, then rerun `bun run format`.
- If `bun run test` fails, make the necessary non-destructive fixes and rerun it. Keep the test suite meaningful and strong; update obsolete assertions or add missing coverage when appropriate.
- If `bun run build-storybook` fails, fix the Storybook issue and rerun it.
- At the end of every completed work round, create a commit and push it. Create one pull request to `staging` on the first round; subsequent rounds push updates to that same pull request.
- After pushing, the agent may hand off without waiting for GitHub checks or confirming that a Netlify Deploy Preview was generated.
- Text uses LF via `.gitattributes`.
- Never bypass hooks: do not use `HUSKY=0`, `--no-verify`, `core.hooksPath` overrides, hook edits/removal, or equivalent.
- Gate fixes are exempt from the Boy Scout 10% cap.
- For design-system changes, update Storybook stories and capture visual evidence when useful.
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

Definition of done: implementation + relevant tests + relevant gates green, then commit, push, and create/update the `staging` PR.

Story titles: `Foundations/*`, `Atoms/*`, `Molecules/*`, `Organisms/*`, `Templates/*`.

Design-system gate: `bun run check:design-system`. Update `.design-system-coverage.json` with every reusable component and story mapping.

Astro boundary: Storybook React cannot import `.astro` directly. Boundary story may mirror static Astro markup only when named component mapping exists, production classes/tokens/assets remain exact, exception is explicit, and parity review is recorded. Prefer shared implementation extraction when interaction/logic grows.

## UI / A11y

- Mobile-first CSS; functional tokens; max 3 nesting levels; no `!important`.
- WCAG 2.2 AA required. Prefer semantic HTML/native controls.
- Interactive UI: keyboard, visible focus, logical order, focus restore, accessible names, ARIA state, live announcements, reduced motion, contrast.
- Add unit semantics/state tests, Storybook states, and axe checks where appropriate.

## SEO

- Every user route uses `src/layouts/BaseLayout.astro`.
- Metadata: `src/components/SeoHead.astro`; structured data: `src/components/JsonLd.astro`.
- Indexable pages need unique title/description, canonical, OG/Twitter metadata, one primary `h1`, SSR/prerendered critical content, stable URLs, internal links.
- Images need meaningful alt and dimensions where possible.
- Keep `sitemap.xml`/`robots.txt` valid; set product/category indexability explicitly.
- Test metadata, headings, canonical, JSON-LD, crawlability; run SEO/a11y checks.
