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
