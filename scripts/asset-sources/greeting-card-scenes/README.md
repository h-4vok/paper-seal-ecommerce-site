# Greeting card image assets

Greeting cards use separate generated metadata, templates, and an asset generator from the artwork
print pipeline. Product data and panel mappings live in `content/artworks.yaml` under the
`greeting-card` family. The approved template is the user supplied blank folded-card mock. Its
measured front corners are recorded in `approved/manifest.json` and the generator maps the front
panel to those four corners with a projective transform.

The production master stays in Google Drive. The card's Drive file ID and normalized panel rectangles
are recorded alongside the product: the left quarter is the exterior back (rotated 270°), and the
next quarter is the front (rotated 90°). The remaining half is outside the printed spread. The flat
images are produced without a surrounding mock and without a baked-in watermark. Perspective and
search images are derived from the approved folded-card template and do not have a baked-in watermark.

The generator writes 720 px and 1440 px derivatives for flat front, flat back, perspective mockup,
and a centre-cropped 4:3 product-search image to `public/images/greeting-cards/<assetBase>/`. Run
`bun run content:build:assets:greeting-cards`, or use `bun run content:build:assets` to run both
family pipelines.
