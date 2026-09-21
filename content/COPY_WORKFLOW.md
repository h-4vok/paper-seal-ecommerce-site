# Site copy workflow

All page and interface copy lives in `content/copy/en-GB` as YAML. The locale is explicit: there is no implicit fallback, and a future locale must provide every required YAML namespace. JSON is not allowed as a copy or localisation source or generated copy artefact; JSON remains valid for technical tooling, generated artwork data and other repository contracts.

## Files

- `shared.yaml`: brand, navigation, accessibility labels and footer.
- `home.yaml`: Home page copy and SEO metadata.
- `catalogue.yaml`: catalogue framing, filters, states and SEO metadata.
- `cart.yaml`: cart and coming-soon commerce messaging.
- `product.yaml`: product gallery, option, sharing and commerce-interface copy.
- `institutional.yaml`: Our Story, policies, contact, East Sussex and Journal pages.
- `placeholder.yaml`: shared placeholder state copy.

Artwork/product editorial records remain in `content/artworks.yaml`; they are not duplicated in interface copy YAML.

## Editing and validation

1. Edit the relevant YAML file under `content/copy/en-GB`.
2. Keep values as plain text. Use `\\n` for intentional line breaks. Keep links and executable behaviour in Astro/TypeScript.
3. Run `npm test -- src/content/copy.test.ts` and `npm run typecheck`.
4. Run `npm run dev` and review the affected route, metadata, keyboard states and announcements.

The typed loader in `src/content/copy.ts` fails for unknown locales, missing namespaces, unknown YAML files, missing required keys, empty values, invalid navigation paths and invalid repeated structures. Interpolation is controlled through `copyText`; missing variables remain visible instead of silently disappearing.

## Format decision

YAML is the only copy/localisation format because it is readable for manual editing, already supported by the project, and keeps domain/page content easy to review. TypeScript modules, JSON files and runtime CMS dependencies are not used for copy. The hybrid domain layout avoids both one oversized file and component-level fragmentation.
