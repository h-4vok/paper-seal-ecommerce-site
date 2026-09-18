# Repo Instructions

- Write repo content in English.
- Read `CONTEXT.md` before repo work.

## Delivery standards

- Use Bun 1.3.10 and Node.js 24.13.0; npm is the documented fallback when Bun cannot run locally.
- Feature branches target `staging`; `main` is reserved for human-approved releases.
- Run `npm run validate` (or the equivalent Bun command) before handoff: lint, formatting, typecheck, unit tests with coverage, and production build.
- Run `npm run test:e2e` during implementation and commit the relevant Playwright coverage.
- Build or update Storybook stories for design-system components and capture relevant visual evidence for review.
- Never add secrets, real environment values, or human-approved coverage exclusions to the repository.
- Keep CSS mobile-first, tokenized with meaningful functional names, no more than three nesting levels, and no `!important`.
- Treat WCAG 2.2 AA as an implementation and verification requirement. Use semantic HTML and native controls by default.
- For every interactive component, implement and verify keyboard access, visible focus, logical focus order, focus restoration, accessible names, correct ARIA state, dynamic announcements, reduced-motion behaviour, and sufficient contrast.
- Add unit tests for state/semantics, Storybook states for relevant UI, and Playwright coverage for real keyboard/focus interaction. Run automated axe checks on representative pages.
- Do not mark an accessibility exception as accepted or add an exclusion without explicit human approval; Codex may report and suggest exceptions only.

## SEO requirements

- Treat SEO as a requirement for every user-facing route and component.
- Use `src/layouts/BaseLayout.astro` as the shared page shell for every route.
- Use `src/components/SeoHead.astro` for page metadata, including a unique title, description, and canonical URL.
- Use `src/components/JsonLd.astro` for applicable structured data such as `Product`, `Offer`, `BreadcrumbList`, and `Organization`.
- Every indexable page must have a unique, meaningful `<title>` and `<meta name="description">`.
- Use semantic HTML with exactly one primary `<h1>` per page.
- Add Open Graph and Twitter metadata for shareable pages.
- Ensure important content is present in server-rendered or prerendered HTML.
- Do not hide SEO-critical content behind client-only React rendering.
- Use descriptive, stable URLs and crawlable internal links.
- Images must have meaningful `alt` text and explicit dimensions where possible.
- Maintain valid `sitemap.xml` and `robots.txt`.
- Product and category pages must define their indexability explicitly.
- Add tests for metadata, headings, canonical URLs, structured data, and crawlability.
- Run automated SEO and accessibility checks on representative routes.
- Do not suppress or accept an SEO failure without explicit human approval.
