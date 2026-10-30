# Exercise image audit

Audited the local catalog in `src/data/exercise/exercises.json` and the local fallback map on 2026-10-27. Live Firestore records and user-created exercises were not inspected.

## Coverage

- 84 catalog exercises (all marked published).
- 48 have existing, decodable 960 × 600 JPEG images and local fallback entries.
- 36 have `imageUrl: null`, no local fallback entry, and no exercise-specific image.
- No exact duplicate files among the 48 existing images.
- Visually inspected all 48 existing images using four labeled contact sheets; examined potentially ambiguous examples at full resolution.

## Visual findings

- `kettlebell-swing`: the illustration appears to show a staggered stance, whereas the catalog specifies feet slightly wider than shoulder width. Replace with a clearer view of the specified stance.
- `burpee`: shows only the final jump. It does not communicate the floor/plank stages; a short sequence would identify the movement more clearly.
- `cat-cow`: shows only the arched-back phase. A paired image would communicate the alternating movement.
- `step-jacks`: the still is very similar to `jumping-jacks`. A stepping sequence or clear ground contact would make the difference easier to identify.
- `one-arm-dumbbell-row`: depicts bench support. This is compatible with the catalog’s stable-support option, but a thigh-supported version would better represent the version that requires only dumbbells.
- Kettlebells in `goblet-squat` and `farmer-carry` are valid: both catalog entries explicitly allow dumbbells or kettlebells.

These are visual consistency findings against the catalog, not a professional assessment of exercise technique. A single still cannot verify movement execution.

## Missing images

- `jump-rope-boxer-step` — Крок боксера зі скакалкою
- `jump-rope-side-to-side` — Стрибки скакалкою з боку в бік
- `jump-rope-high-knees` — Біг зі скакалкою
- `lateral-step-up` — Бічний підйом на степ
- `step-platform-push-up` — Віджимання з упором на степ
- `step-platform-calf-raise` — Підйом на носки на степі
- `step-platform-reverse-lunge` — Зворотний випад зі степа
- `step-platform-taps` — Торкання степа
- `bench-dip` — Зворотні віджимання від лави
- `bulgarian-split-squat` — Болгарський випад
- `bench-hip-thrust` — Сідничний міст із лави
- `chest-supported-dumbbell-row` — Тяга гантелі з упором на лаву
- `kettlebell-single-arm-row` — Тяга гирі однією рукою
- `kettlebell-overhead-press` — Жим гирі над головою
- `kettlebell-halo` — Гало з гирею
- `kettlebell-sumo-deadlift` — Станова тяга гирі сумо
- `kettlebell-reverse-lunge` — Зворотний випад із гирею
- `band-squat` — Присідання з еспандером
- `band-chest-press` — Жим від грудей з еспандером
- `band-overhead-press` — Жим еспандера над головою
- `band-good-morning` — Нахили з еспандером
- `band-bicep-curl` — Згинання рук з еспандером
- `scapular-pull-up` — Лопаткові підтягування
- `negative-pull-up` — Негативні підтягування
- `chin-up` — Підтягування зворотним хватом
- `hanging-leg-raise` — Підйом прямих ніг у висі
- `dumbbell-lateral-raise` — Розведення гантелей убік
- `dumbbell-bicep-curl` — Згинання рук з гантелями
- `dumbbell-overhead-triceps-extension` — Французький жим з гантелею
- `dumbbell-sumo-squat` — Присідання сумо з гантелею
- `dumbbell-glute-bridge` — Сідничний міст з гантелею
- `dumbbell-bent-over-row` — Тяга гантелей у нахилі
- `towel-row` — Тяга рушника до себе
- `inverted-table-row` — Тяга під столом
- `prone-y-t-w-raise` — Підйоми рук Y-T-W лежачи
- `reverse-snow-angel` — Зворотний «сніговий ангел»

## Review evidence

- `sheet-1.jpg`: exercises 1–12.
- `sheet-2.jpg`: exercises 13–24.
- `sheet-3.jpg`: exercises 25–36.
- `sheet-4.jpg`: exercises 37–48.

No exercise data, image assets, or application code were changed during this audit.
