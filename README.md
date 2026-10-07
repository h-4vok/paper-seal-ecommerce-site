# The Paper Seal Studio - Ecommerce platform

The Paper Seal Studio is an art boutique storefront in its earliest implementation stage. The MVP presents a considered, editorial shopping experience and uses Snipcart for commerce.

This repository currently provides the project foundation: Astro static rendering, a custom design-system boundary, Vitest, quality gates, GitHub Actions, and Netlify deployment configuration. The visible product is intentionally a small coming-soon page until the feature epics are implemented.

## Development

Use Bun 1.3.10 with Node.js 24.13.0.

```sh
bun install
bun run dev
```

Commit checks run copy and design-system validation, lint, type checking, and the production build. Push checks run formatting and Vitest. Feature pull requests target `staging`; `main` is reserved for releases.

Reusable interface components follow Atomic Design. The component inventory and classifications are maintained in `.design-system-coverage.json` and checked by `bun run check:design-system`.

Read [`AGENTS.md`](./AGENTS.md) and [`CONTEXT.md`](./CONTEXT.md) before making project changes.

## Snipcart Test cart

The header bag opens Snipcart's real empty side cart. `SnipcartIntegration.astro`
configures GBP and loads Snipcart on demand; the cart button and count badge use
Snipcart's documented CSS hooks. Products and payment setup are outside this milestone.
Issue #53 supersedes the earlier Shopify cart direction for this integration.

### Local setup

Select **Test** in Snipcart, then copy the **public Test API key** from Account → API keys.
Create an ignored `.env.local` file in the repository root:

```dotenv
PUBLIC_SNIPCART_TEST_API_KEY=<your public Test API key>
```

Run `bun run dev` and open `http://localhost:4321`. Restart the dev server after changing
the key. For a static build, set the key before `bun run build`, then use `bun run preview`.
The key is intentionally browser-visible; never use a secret key or a Live key here.
The Test/Live dashboard toggle does not change a site's operating mode: its key does.

Missing or invalid keys do not block a build. Snipcart reports configuration errors in
the browser. The bag uses Snipcart's documented `snipcart-checkout` class to open the
cart; its badge uses `snipcart-items-count` for the live item count. Snipcart loads on
first interaction (or after 2,750 ms). This integration does not create
products, variants, a Shopify cart, checkout, payments, an order-history route or
redirection.

### Netlify staging and Deploy Previews

Use the existing **paperseal** project, with `main` as its production branch and
`staging` enabled as a branch deploy. Keep Deploy Previews enabled for pull requests.

In **Project configuration → Environment variables**, add `PUBLIC_SNIPCART_TEST_API_KEY`
with scope **Builds**. Set its public Test key value for the specific branch `staging`
and for **Deploy Previews**. Do not configure a Live key or a Production value for this
milestone. Do not put actual values in `netlify.toml` or commit `.env.local`.

If using Umami, add `PUBLIC_UMAMI_URL` (the Umami script URL, for example
`https://analytics.example.com/script.js`) and `PUBLIC_UMAMI_WEBSITE_ID` (the website ID)
in the same **Project configuration → Environment variables** screen. Set each variable's
scope to **Builds**, then select the `staging` branch and **Deploy Previews** as its
deploy contexts. These are optional: the storefront currently does not load Umami, and
empty or obsolete Umami values do not block a build. Configure the public Snipcart Test
key there as described above; never add a Snipcart secret or Live key to the frontend.

Trigger a fresh build/deploy after setting or changing the variable. Astro embeds the
public configuration at build time; changing Netlify variables cannot update an existing
static deployment. Netlify builds do not read your local `.env.local`.

In Snipcart **Test → Domains and URLs**, retain `staging.paperseal.uk` and
`staging--paperseal.netlify.app`. Add the concrete Deploy Preview hostnames being tested
(for example, `deploy-preview-<PR number>--paperseal.netlify.app`); do not assume wildcard
support. Once the integration is deployed, set the Test Redirect URL to
`https://staging.paperseal.uk/`. No additional order-history route is needed.

### Verification

Vitest checks application behavior without requiring Snipcart credentials or external CDN
availability. It is not evidence that the real Snipcart account is configured correctly.

For a manual payment in Snipcart Test mode, use **4242 4242 4242 4242** with any future
expiry date and a three-digit CVC. See Snipcart's
[payment testing guide](https://docs.snipcart.com/v3/testing/payments). Keep these test
credentials in project documentation rather than the checkout UI.

References: [installation](https://docs.snipcart.com/v3/setup/installation),
[SDK](https://docs.snipcart.com/v3/sdk/api),
[Test environment](https://docs.snipcart.com/v3/testing/environment),
[domains and redirect](https://docs.snipcart.com/v3/dashboard/domains-urls),
[Netlify variables](https://docs.netlify.com/build/environment-variables/get-started/).

For editable UI copy, see [`content/COPY_WORKFLOW.md`](./content/COPY_WORKFLOW.md).
Copy/localisation sources are YAML-only under `content/copy/en-GB`; repository JSON remains reserved for technical tooling and generated data.

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
