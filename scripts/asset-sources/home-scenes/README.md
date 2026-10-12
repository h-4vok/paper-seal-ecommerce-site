# Home scene templates

`templates/` contains the approved, artwork-free room scenes used by the Home asset pipeline.
These reusable source scenes are versioned because they contain no clean production artwork.

Scene-to-artwork placement and provenance live in `data/assets/home-scenes.json`. The build reads
the approved high-resolution masters by `driveFileId` using Google Drive for desktop's local
index and writes only contextual composites to `src/assets/home/`.

Regenerate the Home composites with:

```sh
bun run assets:home
```

Never copy production masters into this repository or its public output.
