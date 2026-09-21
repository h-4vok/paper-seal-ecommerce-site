# Site copy workflow

`content/site-copy.json` is the editable source for shared navigation, footer, Home, catalogue, cart, product-interface copy, and their SEO titles/descriptions. Product and artwork metadata remain in `content/artworks.yaml`; institutional pages remain a separate domain model because their status, indexability, and section structure are data concerns rather than UI labels.

## Why JSON

We compared YAML, JSON, TypeScript modules, and Astro content collections. JSON is the current recommendation because it is easy to edit, has no runtime dependency, works in the existing Astro/Vite toolchain, and can be validated before rendering. YAML is already reserved for the richer artwork pipeline. TypeScript would be less accessible to editors, while content collections would add a second content abstraction for a small single-locale site.

The file uses a hybrid organisation: shared brand/navigation copy is grouped by domain, while page copy is grouped by page. Keys use descriptive camelCase names. English is the only supported locale today; the validated shape is deliberately future-compatible with a locale-keyed wrapper if localisation is approved later.

## Editing and validation

1. Edit `content/site-copy.json`.
2. Keep markup out of values; links and rich text belong in Astro components.
3. Run `npm run typecheck` and `npm test`.
4. Preview with `npm run dev` and review the affected route and its metadata.

The Zod schema in `src/domain/site-copy.ts` fails the build/typecheck path for missing required keys, empty values, invalid navigation paths, or incorrect repeated structures. The `brand`, `navigation`, `home`, `catalogue`, `cart`, and `product` namespaces are explicit and required; edits are rendered by the corresponding Astro routes and shared components. Playwright coverage checks representative source values in the rendered pages. Interpolation and plural rules are intentionally not introduced until a second locale or dynamic commerce copy requires them.

## Current inventory

- Migrated: all Home sections, shared brand/footer/header values, catalogue framing and controls, cart messaging, and product-interface/commerce-status copy.
- Validated namespaces: `brand`, `navigation`, `home`, `catalogue`, `cart`, and `product`.
- Kept separate: artwork records (`content/artworks.yaml`) and institutional/legal pages (`src/domain/institutional.ts`).
