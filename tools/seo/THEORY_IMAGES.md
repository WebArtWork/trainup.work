# Theory SEO covers

121 new covers: one for each of the 120 public `/theory/<slug>` pages and one for `/theories`.

- Theory images: `src/assets/seo/theory/<slug>.jpg`.
- Library image: `src/assets/seo/theories.jpg`.
- Generation method: built-in `image_gen`, one distinct generation per page. No API/CLI fallback or new runtime dependency.
- Full final prompts and route/image mapping: `tools/seo/theory-images.json`.
- Initial topic briefs: `tools/seo/theory-image-briefs.json`.

The art direction follows the existing TrainUp covers: warm cream backgrounds, deep teal and coral orange, rounded shaded illustrations, a large TrainUp wordmark and short English headlines. English cover text preserves the established image convention; existing localized theory titles/descriptions and all lesson content remain untouched. Each page has its own subject illustration. The existing SEO artwork is preserved.

## Review and validation

All 121 covers were inspected in contact sheets and individual previews for text accuracy, relevant subject, composition and consistency. The overhead-clearance cover was regenerated after its first variant placed a ceiling fan above the training area; the final cover has a high unobstructed ceiling. The first variant is retained only in the local review output.

Every final image is a distinct, optimized 1200 × 630 JPEG below 250 kB. The whole new set totals 9.47 MiB. Route metadata uses absolute image URLs through the existing `buildAbsoluteUrl` helper, for both the library and individual theories. No page layout or controls were redesigned.

The production web build passed with 126 prerendered pages and a 492.94 kB initial bundle, below the existing 500 kB warning budget. The code build ran while artwork generation continued; after final export, the complete static cover set was copied into the build output and compared byte-for-byte with the source assets. A normal subsequent production build copies the complete set automatically.

The verifier passed for all 121 image dimensions, sizes, unique hashes, published assets, canonical URLs and absolute Open Graph/Twitter image tags. Edge smoke checks also passed for the library, first/middle/last theory pages, JPEG delivery and client-side navigation between theories.

```sh
npm run build:gh
node tools/seo/verify-theory-images.mjs --built
```

Local review artifacts are in `../output/trainup-seo/`: `review.html` links to every image, `contact-sheet-*.jpg` contains visual proof, `browser-check.json` records the browser checks, and `progress.json` records generation output. Nothing was committed, pushed or deployed.
