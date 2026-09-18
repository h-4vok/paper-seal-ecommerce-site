# Home scene templates

`templates/` contains the approved, artwork-free room scenes used by the Home asset pipeline.
These reusable source scenes are versioned because they contain no clean production artwork.

Scene-to-artwork placement and provenance live in `data/assets/home-scenes.json`. The build reads
the approved high-resolution masters from the external `PAPERSEAL_MASTER_DIR` directory and writes
only contextual composites to `src/assets/home/`.

Regenerate the Home composites with:

```sh
PAPERSEAL_MASTER_DIR=/path/to/approved-masters bun run assets:home
```

Never copy production masters into this repository or its public output.
