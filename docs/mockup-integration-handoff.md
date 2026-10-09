# Paperseal mockup integration handoff

## Objective and current state

Promote the 16 approved scene designs to reusable, artwork-free templates. Each artwork initially receives one mockup for 7 × 5 in, one for A4, and one for A3. The selection is editorial and editable in `content/artworks.yaml`; each size accepts an ordered list so more mockups can be added later.

The product page keeps the flat artwork image first. Apply a subtle, repeated HTML/CSS watermark to that image in catalogue cards, the product gallery, and the lightbox. Mockups follow the flat image and have no watermark. Changing Small, Medium, or Large jumps the gallery to the first mockup of the selected size. Subsequent manual gallery navigation remains independent of the selected size.

At the time of this handoff, `content/artworks.yaml` contains 16 artworks. `scripts/build-artwork-assets.mjs` generates `flat` and one `room` image per artwork from fixed placement coordinates, at 720 and 1440 px. The 96 artwork-free, approved templates and their print rectangles are in `scripts/asset-sources/artwork-scenes/approved/`. The two-artwork review JPGs, contact sheets, and local review page are excluded from this repository. The storefront does not yet consume the new templates.

## 1. Production templates

1. Use the 96 artwork-free templates in `scripts/asset-sources/artwork-scenes/approved/`: 16 scenes × two orientations × three sizes. Its manifest provides scene ID, orientation, physical size, 4:3 output dimensions, and the paper placement rectangle. The review JPGs with Meet Me in Eastbourne and Parapente must never become production inputs.
2. Preserve stable scene IDs `"01"` through `"16"` and their readable names such as `01-ivory-shelf` and `13-window-green`. Resolve a variant from scene ID, the artwork's orientation, and the requested size. The YAML does not need the review codes' `E` or `P` suffixes.
3. Verify every template before use: its paper is blank; frame, mount, shadow, props, and crop match the approved design; and its manifest rectangle is inside the image. Production builds must depend only on these versioned templates, never on the excluded local `.design-mocks/` review archive.
4. Add the pre-existing scene designs to the same registry with distinct IDs. Their present templates do not supply measured variants for every orientation and size. Create and review those variants before making them selectable. Keep home-page scene usage independent of product-gallery generation.
5. Composite each approved master into the selected base's paper rectangle. The printed area is 177.8 × 127 mm for 7 × 5 in, 297 × 210 mm for A4, and 420 × 297 mm for A3; transpose dimensions for portrait artwork. Keep the mount uniform and outside the printed area. Preserve lighting and shadows within the paper to avoid a pasted-on appearance. Never redraw the artwork. Inspect focal subjects after cropping.

## 2. Editable artwork selection

Replace `gallery: [room]` and `roomScene` selection with ordered lists in `content/artworks.yaml`:

```yaml
mockups:
  '7x5': ['13']
  A4: ['13']
  A3: ['13']
```

Require all three non-empty lists. Reject unknown IDs, duplicate IDs within a size, and missing template variants for the artwork orientation and size. Different sizes may use different scenes. The flat image is implicit and always occupies gallery position zero. List order determines display order within a size.

The initial editorial assignment uses one scene across all three sizes for each artwork. These are choices to write to YAML, **not** rules for automatic colour matching:

| Artwork                        | Scene                  | Visual rationale                                               |
| ------------------------------ | ---------------------- | -------------------------------------------------------------- |
| Flower Bed                     | 15 · Chalk Workshop    | Light wall and black frame give the multicolour flowers space. |
| Seven Sisters from the Gardens | 07 · Rose Bedroom      | Dusty rose complements the sunset and flowers.                 |
| Beachy Head                    | 10 · Light Concrete    | A quiet neutral backdrop for blue sky and stone.               |
| Meet Me in Eastbourne          | 01 · Ivory Shelf       | Ivory and oak let the sea blue stand out.                      |
| Eastbourne Pier                | 03 · Pale Blue Ledge   | Soft blue and a white frame suit the coast.                    |
| Beach Huts, Eastbourne         | 08 · Ink Studio        | A dark wall contrasts with the colourful huts.                 |
| South Downs I                  | 11 · Muted Yellow Hall | Warm yellow supports the sunset sky.                           |
| Battle Abbey                   | 14 · Burgundy Library  | A restrained setting for historic architecture.                |
| Sovereign Harbour Waterfront   | 05 · Oak Console       | Warm oak balances blue water and buildings.                    |
| Long Man                       | 06 · Sage Reading      | Sage green supports the fields.                                |
| Eastbourne Sunset              | 02 · Charcoal Gallery  | Charcoal gives the intense sunset colour contrast.             |
| Martello 66                    | 04 · Terracotta Bench  | Terracotta picks up the orange coast.                          |
| Devils Dyke                    | 16 · Eclectic Living   | Muted mauve supports the pink sky and hills.                   |
| Parapente in the South Downs   | 13 · Window Green      | Light green and window light suit the landscape.               |
| Sovereign Harbour              | 12 · Coastal Cottage   | A neutral coastal setting lets the pink harbour stand out.     |
| South Downs, Jeeps and Bike    | 09 · Diagonal Table    | Light wood and an overhead view suit the rural subject.        |

Document the scene IDs and show how the owner can add another ID to any size list.

## 3. Asset generation and data flow

1. Update validation and projection in `scripts/build-content-metadata.mjs`, the catalogue types and validation in `src/domain/catalogue.ts`, and composition in `scripts/build-artwork-assets.mjs`. YAML remains the source of truth; regenerate `src/data/artworks.json` and `data/assets/artworks.json` instead of editing them manually.
2. Generate only YAML-selected combinations. The first pass produces 16 × 3 = **48 product mockups**, each with 720 and 1440 px derivatives. Use deterministic scene-and-size filenames, such as `mock-7x5-13-720.jpg` and `mock-7x5-13-1440.jpg`; reordering a list must not rename an image.
3. Keep approved production masters outside the repository and retain `PAPERSEAL_MASTER_DIR`. Validate all required inputs before publishing outputs. Report the artwork and scene on failure, and avoid leaving partially regenerated galleries.
4. Retain flat derivatives. Catalogue and search cards should request only `flat-720.jpg`, sufficient for their mobile and desktop display sizes. The product gallery and zoom may use `flat-1440.jpg`. Correct the HTML dimensions for portrait images; the current picture component declares landscape dimensions for every artwork.
5. Replace dependencies on the old `room-1440.jpg` in Snipcart, Open Graph, and JSON-LD with a stable generated mockup, initially each artwork's first A3 selection. Verify these references never point at a retired file.

## 4. Gallery, size selection, and watermark

Build each product gallery in this order: **flat image, 7 × 5 mockups, A4 mockups, A3 mockups**. Give each slide a size and scene ID plus accessible text naming the artwork, size, and setting. Dots and thumbnails use the same order.

Small is selected initially, while the gallery starts on the flat image. Only a size-selection change jumps to the first mockup of the corresponding size. Arrows, dots, thumbnails, keyboard, and touch gestures may subsequently navigate without changing the selected size or price. A later size change jumps again. Keep focus on the activating control and announce the new selection without duplicate announcements.

Add a reusable, subtle diagonal Paper Seal watermark overlay to **flat images only**. It must stay within the visible artwork bounds on catalogue cards, the first product slide, and its lightbox view. It must not intercept clicks or controls. Mockup slides and their lightbox views have no watermark. Review legibility and contrast against both light and dark artworks, and provide Storybook states and mobile/desktop visual evidence.

**Limit:** an HTML/CSS watermark is a visual deterrent. A visitor opening the JPG URL directly can obtain the image without it. Protecting the downloadable asset requires a future generation-stage watermark. Do not claim the HTML overlay protects the raw file.

## 5. Verification and delivery

- Focused manifest tests: invalid or missing IDs, missing size, empty or duplicate lists, wrong orientation, multi-scene order, and deterministic output paths.
- Generator checks: 4:3 output, physical paper ratio and scale, symmetric mount, blank source templates, no production masters committed, and focal subjects preserved. Use the owner's approved review images for optional visual comparison; production builds must not require them.
- Interface and Playwright coverage: 720 px catalogue asset, flat image first, watermark on flat card/stage/lightbox only, first-mockup jump for each size, later manual navigation, price/cart state, focus, keyboard, mobile, and axe. Update affected stories, `.design-system-coverage.json` where applicable, and capture visual evidence.
- Editorial inspection of all 48 generated mockups at card size and full resolution for lighting integration, artwork fidelity, crop, and scale. Report any changed assignments or focal crops.
- During implementation, run only focused checks; repository rules prohibit `bun run validate` and `bun run test:e2e` during implementation. At handoff ask the owner to run `bun run validate`, `bun run test:e2e`, and `bun run build-storybook`. Never claim E2E passed unless it ran and passed.

## Confirmed defaults

The watermark is repeated and subtle. The initial YAML mapping has one mockup per size and artwork, with arrays ready for more. Frame dimensions are illustrative; advertised sizes refer to the printed paper.
