# Greeting card image assets

Greeting cards use a separate source file, template registry, and asset generator from the artwork
print pipeline. The approved template is the user supplied blank folded-card mock. Its measured front
corners are recorded in `approved/manifest.json` and the generator maps the front panel to those four
corners with a projective transform.

The production master stays in Google Drive. `content/greeting-cards.yaml` stores its Drive file ID
and normalized panel rectangles: the left quarter is the exterior back (rotated 270°), and the next
quarter is the front (rotated 90°). The remaining half is outside the printed spread. The flat images
are produced without a surrounding mock. The site watermark remains a presentation overlay from
`ArtworkPicture`; it is not baked into these source images. Perspective mockups have no watermark.

The generator writes 720 px and 1440 px derivatives for flat front, flat back, and the perspective
mock to `public/images/greeting-cards/<id>/`. Run `bun run assets:greeting-cards`, or use
`bun run content:build:assets` to build artwork and greeting card assets as separate pipelines.
