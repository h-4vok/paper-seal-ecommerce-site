# Project Context

> Read before product, architecture, Shopify, operations, or visual-design work. Load only relevant source. Do not load all by default.

Source docs live in Google Drive.

## Source documents

### PROJECT — Art Boutique Storefront

- Source: [Google Doc](https://docs.google.com/document/d/1EvrMakS_qqXMoe373S0yVHJX5sMpchXgeU_fGWcv4AU/edit)
- Scope: business, product, customer experience, MVP boundaries, cross-cutting decisions.
- Load for: overall product behaviour, business rules, scope, cross-domain decisions.

### ARCHITECTURE — Storefront Architecture

- Source: [Google Doc](https://docs.google.com/document/d/10K8Wm-SjSDy7G6oBzWsEGKegPtC1IZi6mEKqvE0qzZ8/edit)
- Scope: static-first rendering, Astro, React islands, SEO, performance, deployment, accessibility, testing, runtime boundaries.
- Load for: app structure, framework, build, deployment, SEO, accessibility, testing.

### SHOPIFY — Integration Contract

- Source: [Google Doc](https://docs.google.com/document/d/1mh8WEB8WKssm7CXecfc9ckvukEsfmuNGGz6O3Ti9Pq4/edit)
- Scope: products, variants, SKUs, pricing, inventory, Storefront API, cart, checkout, security.
- Load for: Shopify, product model, variants, availability, cart, checkout, commerce data.

### OPERATIONS — Inventory & Commerce Operations

- Source: [Google Doc](https://docs.google.com/document/d/177PZoDHzgVZbi39rTU9HGW0AJtXGGDkOPWq0w_U4G28/edit)
- Scope: physical sales, SumUp, inventory adjustments, reconciliation, low-stock policy, fulfilment, returns.
- Load for: stock, fairs, SumUp, operations, fulfilment, returns, reconciliation.

### UI DESIGN — Visual System & Theme

- Source: [Google Doc](https://docs.google.com/document/d/1I3ktrLsbDYovDoFvpcch46AdsqG744ymSBU5sHn8L30/edit)
- Scope: visual direction, typography, colour, spacing, layout, imagery, components, motion, interaction aesthetics.
- Load for: visual design, styling, typography, colour, layout, imagery, components, interaction feel.

## Routing rules

1. General/cross-domain task → load `PROJECT`.
2. Specific task → load narrowest matching source.
3. Cross-domain task → load multiple sources only when needed.
4. `DECIDED` → implement unless superseded.
5. `LEANING` → preferred; `OPEN` → unresolved; `DEFERRED` → outside MVP.
6. Domain source overrides `PROJECT` on conflict; `PROJECT` remains summary/context layer.

## Visual references

`.pptx` files plus exported images = visual references. Load for matching visual/layout/interaction work. Never treat as authoritative product or technical specs.
