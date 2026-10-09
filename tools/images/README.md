# Generated TrainUp images

Created with the built-in Imagegen tool. The prompt set is recorded in
`generation-prompts.json`; exercise prompts expand the existing catalog's name,
steps, and technique notes.

- `src/assets/seo/`: 24 page covers, JPEG, 1200 × 630.
- `src/assets/exercises/`: 48 exercise illustrations, JPEG, 960 × 600.
- Assets publish at `/seo/` and `/exercises/` through the existing Angular build.

Company data supplies the public pages' social images. App route metadata supplies
the private pages' images and retains `noindex, nofollow`. Exercise detail routes
use the corresponding exercise illustration. Redirects use their destination page.

The catalog records reference each illustration. Published Firestore records with
an empty image URL also receive the local illustration through `EXERCISE_IMAGES`;
remote image URLs continue to take precedence. This does not publish draft exercises.

Original PNGs remain in the Codex `generated_images` directory. To encode a newly
generated replacement, run `save-generated.ps1` with its source PNG, destination,
width, and height. It fits the image without cropping and encodes JPEG at quality 85.
