# Generated TrainUp images

Created with the built-in Imagegen tool. The prompt set is recorded in
`generation-prompts.json` and `generation-prompts-2026-10-31.json`; exercise prompts
expand the catalog's name, steps, and technique notes.
Product prompts are recorded in `product-generation-prompts-2026-10-31.json`.

- `src/assets/seo/`: 34 page covers, JPEG, 1200 × 630.
- `src/assets/exercises/`: 113 female exercise illustrations, JPEG, 960 × 600.
- `src/assets/exercises/male/`: 113 male exercise illustrations, JPEG, 960 × 600.
- `src/assets/products/`: 46 product illustrations, JPEG, 1200 × 900.
- Assets publish at `/seo/` and `/exercises/` through the existing Angular build.

Company data supplies the public pages' social images. App route metadata supplies
the private pages' images and retains `noindex, nofollow`. Exercise detail routes
use the corresponding exercise illustration. Redirects use their destination page.

The assistant connection cover is `src/assets/seo/connect.jpg`. Dashboard, store,
support, and account deletion have dedicated covers using their page identifiers.

The catalog records reference each illustration. Records with an empty image URL also
receive the local illustration through `EXERCISE_IMAGES`; remote image URLs continue to take
precedence.

The trainer selector uses the catalog image for the female trainer and
`/exercises/male/{id}.jpg` for the male trainer. All 113 exercises have both variants.
Custom exercises retain their supplied image URL.

Product records use `/products/{id}.jpg`. The shared `ProductImageComponent`
renders them in the store, product details, and cart, retaining an icon fallback
for failed requests. Catalog and cart images load lazily; product details load eagerly.

Run `node tools/images/check-assets.mjs` to verify catalog URLs, share-image lookup
coverage, both trainers, every page cover, JPEG encoding, and image dimensions.
It also checks every product image.
Run `review-sheet.ps1` to make temporary contact sheets for visual review.

Original PNGs remain in the Codex `generated_images` directory. To encode a newly
generated replacement, run `save-generated.ps1` with its source PNG, destination,
width, and height. It fits the image without cropping and encodes JPEG at quality 85.
