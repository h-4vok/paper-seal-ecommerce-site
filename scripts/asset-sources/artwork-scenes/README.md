# Artwork scene templates

These artwork-free, versioned templates are reusable sources for catalogue cards and product galleries.
The generated artwork mapping and exact placement coordinates live in `data/assets/artworks.json`.
Edit `content/artworks.yaml` instead of editing the generated JSON manually, then run
`bun run content:build:metadata` before generating derivatives.

Approved production masters remain outside the repository. Regenerate responsive derivatives with:

```sh
PAPERSEAL_MASTER_DIR=/path/to/approved-masters bun run assets:artworks
```

Never commit the production master artwork files.
