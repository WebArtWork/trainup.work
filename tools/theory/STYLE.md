# Theory writing style

Rules for writing and editing the theories in `content/theories/NNN.md`. The importer
(`node tools/theory/import-theories.mjs`) turns these files into app data, so the format rules are
strict. The review behind these rules is in `THEORY_REVIEW.md`.

## Reader

A learner, aged roughly 16 and up, who trains on their own at home, outdoors or in a gym and uses
the TrainUp app. Address them as "you". Plain, friendly, factual. American spelling.

## File format (the importer fails on anything else)

```
## <N>. <Title>

### EN: Short
<one paragraph>

### EN: Detailed
**<Section heading>.** <one paragraph>

**<Section heading>.** <one paragraph>

**Sources:** [Label](https://url); [Label](https://url).
```

- Do not change the number or the title in the first line. The title is the page URL.
- Short version: exactly one paragraph, 2 to 3 sentences.
- Detailed version: 3 to 6 paragraphs, each starting with a bold heading that ends with a period
  inside the bold, then the last paragraph is `**Sources:**`.
- No other Markdown: no lists, no links outside Sources, no extra bold or italics, no backticks, no
  HTML, no line breaks inside a paragraph.
- Keep every source link with its exact URL. Call PubMed 41843416 "2026 ACSM position stand"
  in both the label and the text, never "review", "overview", "synthesis" or "evidence review".

## Facts

- Keep every fact, number, range, formula, safety warning and source. Do not add new facts, numbers,
  studies or claims. If a sentence only works with a detail you don't have, write a simpler sentence.
- Keep the medical scope: TrainUp does not diagnose, treat, give rehab programs, diet plans or
  calorie targets. Keep every "see a doctor or physiotherapist" notice, but write it for the reader
  ("ask your doctor before...") rather than about the app.

## What TrainUp does today

Describe only these. Never describe a feature that is not on this list.

- Profile: goal (general fitness, strength or conditioning), fitness level, training days per week,
  session length and preferred days; equipment, including dumbbell weights, band resistance, bench
  type and whether a pull-up bar is safely installed; workout space: location, floor size, ceiling
  height, surface, whether jumping is OK and how much noise is OK; limitations by body area, with
  notes. You can edit any of these in Profile.
- Plan: a 4-week plan where week 4 is a lighter deload week. It picks only exercises that fit your
  equipment, space, ceiling, surface, jumping and noise limits, limitations, level and coordination.
  Each exercise has sets, reps or a hold time, and rest. It does not prescribe weights: you choose
  the load. If no plan fits, it says which setting blocks it.
- Exercises (Explore): search, category filter, a "suits me" filter, and a page per exercise with
  photos, steps, technique notes, movement pattern and muscles.
- Workout: check off each set, record your reps, hold timer and rest timer.
- After a workout: rate the whole session's effort (RPE, 1 to 10), report pain or discomfort with
  the body area and exercise, and add notes.
- "I feel pain" ends the current exercise at once. That exercise is paused and left out of your plans
  until you resume it from Profile.
- Plan changes happen only when you regenerate the plan, and never from fewer than 3 workouts. Any
  recent pain means no increase. If 2 of the last 3 workouts were very hard (RPE 9 or more) or less
  than 60% finished, the next plan is easier. If the last 4 were easy (RPE 5 or less) and complete,
  it gets a step harder. One step at a time.
- History: this week, total workouts, average effort and a 4-week chart. Finished workouts are never
  changed.
- Dashboard: body weight log. To-dos. Workout reminders on chosen days and times.

## The "Using TrainUp" section

Keep it only when the app adds something specific to this theory (a setting, a rule, a screen from
the list above). Write it to the learner in the second person. Otherwise drop the section, or move
its one useful sentence into another paragraph. When kept, it is the last section before Sources.

## Patterns to remove (Humanizer)

Read `C:\Users\crack\work\learning\.claude\skills\humanizer\SKILL.md` before starting. The ones
that matter most in these texts:

- **Contrasts** (not X but Y, not just, not merely, rather than, instead of, "X does not mean Y"):
  keep one only when a real reader believes the negative half, for example "more soreness means a
  better workout". Otherwise state the point. Section headings must say what the section holds,
  not contrast it ("How long recovery takes", not "Recovery is not a fixed countdown").
- **Stacked hedges**: one qualifier per claim at most. Replace "appropriate", "manageable",
  "meaningful", "sustainable" with the concrete test the text already gives (2 reps to spare, pain
  no worse than 3 out of 10). If the text gives none, use a plain word (light, easy, hard).
- **Closers** that repeat the paragraph ("Training stress matters, but more stress is not always
  better."). Cut them.
- **Forced triads**: lists of three only when there are three real things.
- **Spec voice**: no "the user", "the app should", "flag", "prompt", "label".
- **Dashes**: no em dash (—) anywhere, including headings. En dash (–) only in number ranges
  (8–12 reps). Prefer a full sentence over a colon; use a colon only before a real list or
  explanation.
- **Quotes**: curly only: ’ for apostrophes, “ ” for quotations. No straight ' or ".
- **Example sections** are always headed "Example".

Keep sentences varied: mostly short, some longer. Aim for the same length or shorter than before.
