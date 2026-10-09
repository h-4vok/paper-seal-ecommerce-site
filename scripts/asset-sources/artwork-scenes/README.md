# Artwork scene templates

These artwork-free, versioned templates are reusable sources for product-gallery mockups. The
approved registry assigns stable scene IDs `01`–`16` and stores each orientation/size template and
its measured paper rectangle in `approved/manifest.json`.

Edit `content/artworks.yaml` to select scenes. Each artwork needs ordered, non-empty lists for all
three sizes; for example:

```yaml
mockups:
  '7x5': ['13']
  A4: ['13']
  A3: ['13']
```

To add a second mockup at one size, append its scene ID to only that size list, such as
`'7x5': ['13', '01']`. List order controls the gallery order, while filenames remain stable. The
catalogue and asset metadata are generated from the YAML; do not edit the generated JSON manually.
Run `bun run content:build:metadata` before generating derivatives.

The `approved/` directory contains 96 artwork-free templates: 16 scenes × two orientations × three
sizes. Each image is 1440 × 1080 and the manifest records the physical paper size and its pixel
rectangle. The product gallery uses these new scenes. Existing pale-oak and home-scene assets remain
in place for their current uses and are not part of the product selector; see [issue #92](https://github.com/h-4vok/paper-seal-ecommerce-site/issues/92).
The local `.design-mocks/` review page, example-artwork composites, and contact sheets are not
production inputs.

Approved production masters remain outside the repository. The asset generator validates all
selected template and master inputs before staging outputs, then publishes the flat derivatives and
selected mockups together. Regenerate with:

```sh
PAPERSEAL_MASTER_DIR=/path/to/approved-masters bun run assets:artworks
```

Never commit the production master artwork files.
