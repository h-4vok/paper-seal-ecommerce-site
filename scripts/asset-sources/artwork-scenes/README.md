# Artwork scene templates

These artwork-free, versioned templates are reusable sources for catalogue cards and product galleries.
The generated artwork mapping and exact placement coordinates live in `data/assets/artworks.json`.
Edit `content/artworks.yaml` instead of editing the generated JSON manually, then run
`bun run content:build:metadata` before generating derivatives.

The `approved/` directory contains 96 additional artwork-free templates covering 16 scenes,
both orientations, and 7 × 5 in, A4, and A3. Its `manifest.json` records the paper rectangle
in each 1440 × 1080 image. These templates are approved design sources, but the current asset
generator does not consume them yet. The implementation contract is in
`docs/mockup-integration-handoff.md`. The local `.design-mocks/` review page, example-artwork
composites, and contact sheets are not part of the production source set.

Approved production masters remain outside the repository. Regenerate responsive derivatives with:

```sh
PAPERSEAL_MASTER_DIR=/path/to/approved-masters bun run assets:artworks
```

Never commit the production master artwork files.
