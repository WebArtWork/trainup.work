# Theory text review (Humanizer pass)

**Status (2026-11-09): done.** All 120 theories were rewritten in `content/theories/*.md` following
`tools/theory/STYLE.md`. Em dashes 262 → 0, straight quotes 63 → 0, developer-voice phrases 40 → 0,
"appropriate/manageable/meaningful/sustainable" 114 → 0, contrasts 169 → 50 (kept where they correct
a real belief). "Using TrainUp" kept in 81 theories, each describing only current app features. All
numbers and source URLs are preserved; PubMed 41843416 is labelled "2026 ACSM position stand"
everywhere. Still open: verify the ACSM numbers against the paper and check all source links.
The importer now rejects em dashes and straight quotes.

The review below is the original one, kept for reference.

Review of the 120 English theories in `src/data/theory/i18n/en.json` and `en/*.json`, using the
Humanizer skill's patterns (`.claude/skills/humanizer`). Nothing has been rewritten yet. This file
lists what to change, in priority order, with sample rewrites.

Scale: 744 paragraphs, 31,175 words, 2,008 sentences, 15.5 words per sentence on average. Only 12
sentences are over 30 words, so the text is readable. The problems are repeated structures, not
long sentences.

## Verdict

The facts and tone are mostly sound and the text is plain, not salesy: only 14 hits on the stock AI
word list, no chatbot leftovers, no "delve" or "testament". What makes it read as generated is
the same template in every theory, a reflex "X rather than Y" contrast, and one closing section
that talks to the wrong reader. Fixing four things removes most of it.

## 1. "Using TrainUp" talks to the developer, not the learner (fix first)

119 of 120 theories end with a section called "Using TrainUp". In 29 of them the text is a product
spec: it tells the app what to do or calls the reader "the user".

> #41: Keep total sets appropriate to the user's recovery and flag movements that provoke pain
> rather than prescribing corrective rehabilitation.
>
> #90: The app should recommend rest or reduced load conservatively and never claim to treat
> overtraining syndrome.
>
> #99: Respect the user's sensitive-knee and impact inputs, offer lower-demand movements, and prompt
> review when new symptoms appear.

A learner reading this is told about rules for software, and some of them describe features the
app may not have yet (flagging movements, prompting reviews, labelling optional sessions).

What to do:

- Rewrite those 29 paragraphs for the learner, in the second person, and describe only what TrainUp
  does today. Keep the spec content, but move it to `ROADMAP.md` or the planner docs if you want it.
- Check the other 90 for claims about app features. Example: #23 says "TrainUp requests RPE after
  the session", which is true; any feature that is planned, not built, should go.
- Drop the fixed heading. A section with the same title in 119 places is a template closer (Humanizer
  §2 at document scale). Either fold the one useful sentence into the "Practical example" paragraph,
  or keep the section only where the app adds something specific (about 40 theories, judging by the
  samples: equipment, space, RPE, limitations, plan feedback).

Sample rewrite of #31:

> Before: Use the exercise catalog's movement-pattern tags to inspect a planned week. If most
> sessions include pushing but almost no pulling, substitute a row or pulldown within the user's
> equipment and limitations. The goal is useful coverage over time, not a perfect numerical ratio in
> every session.
>
> After: Each exercise in TrainUp shows its movement pattern. If your week has plenty of pushing and
> almost no pulling, swap one push for a row or pulldown you can do with your equipment. Aim to cover
> each pattern over the week; one session doesn't need to balance on its own.

## 2. Reflex contrasts: "rather than", "not just", "not merely" (162 sentences)

Humanizer §1, the strongest tell. Fitness writing needs some contrasts, because many readers hold
the wrong belief ("more soreness means a better workout"). Those should stay. Most of the 162 add
weight, not a correction.

Rule for the edit: keep the contrast only if a real reader believes the negative half. Otherwise
state the point.

| # | Before | After |
|---|---|---|
| 7 | The plan should make the next action clear, not just display an inspirational target. | A good plan tells you what to do next. |
| 32 | Record useful depth and perceived effort so progress reflects consistent technique, not merely heavier numbers. | Note your squat depth and how hard each set felt, so you can tell real progress from a heavier but shallower squat. |
| 77 | Plyometric actions develop the ability to produce force quickly, not merely to feel out of breath. | Plyometrics train you to produce force quickly. Keep reps low and rest fully between sets. *(second sentence only if the theory already says it)* |
| 105 | A beginner can improve fitness with a small, repeatable training routine rather than an advanced program. | Keep (corrects a real belief that beginners need a complex program). |

Expect to cut or rewrite about two thirds of them. Also rename the 17 headings built on a contrast,
such as "Failure is not the only hard training" and "Recovery is not a fixed countdown". Say what the
section holds instead: "Hard sets without failure", "How long recovery takes". Headings like "Bracing
versus hollowing" compare two real techniques and are fine.

## 3. Stacked hedges and soft adjectives

Humanizer §9. There are 691 hedges (may, can, often, usually, typically...) in 2,008 sentences, plus
99 sentences with "appropriate", "manageable", "meaningful" or "sustainable". Some hedging is right
for health content. The problem is stacking several in one claim, which hides the number the reader
needs:

> #18: The 2026 ACSM review found better growth with higher weekly volume, with evidence favoring at
> least about ten weekly sets per muscle group for maximizing growth in relevant study comparisons.
>
> After: The 2026 ACSM position stand found more muscle growth with more weekly sets, with at least
> about 10 hard sets per muscle per week working best.

- Allow one qualifier per claim. Keep the safety notices (see medical scope, below) as they are.
- Replace "appropriate" and "manageable" with the actual test: "a weight you can lift 8 times with 2
  reps to spare", "pain no worse than 3 out of 10". Where the theory has no such test, a plain word
  ("light", "easy") is better than "appropriate".

## 4. One source, five names

PubMed 41843416 is cited in 86 of 120 theories. I checked it: it is the real ACSM position stand
(Currier et al., "Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical
Performance in Healthy Adults", *Med Sci Sports Exerc*, April 2026). The text calls it "the 2026
ACSM review", "overview", "evidence overview", "synthesis" and "evidence review" (synonym cycling).

- Use one name everywhere: "the 2026 ACSM position stand".
- Check the numbers attributed to it (10+ sets per muscle per week, training twice a week, failure
  and tempo findings) against the paper itself, not the abstract. I could only confirm the citation.
- 65 unique sources and 310 links in total. Check all links before launch: the ACSM infographic URL
  (`wp-content/uploads/2026/03/...pdf`) and a few deep links look the most fragile.

## 5. Punctuation from my em dash replacement

The importer turned 262 em dashes into parentheses, commas or colons. Most read fine. The 41 new
colons should be reviewed by hand, because a few now introduce a list that isn't one:

> #28: A 40-minute strength session could follow: five-minute warm-up, main goblet squat, ...
>
> After: A 40-minute strength session could be a five-minute warm-up, then goblet squats, rows,
> a push-up variation, a hinge and a short side plank.

When the text is rewritten, fix this in the Markdown source (`content/theories/*.md`) so the
importer has nothing to replace. Then the replacement rule can become a check that fails on any em
dash.

## 6. Smaller items

- **Quote marks are mixed.** Apostrophes are straight in 18 places and curly in 18; double quotes
  are always curly (40), single quotes are used for quotations in some theories ('get fit'). Pick one
  style. Curly (’ and “ ”) matches the Ukrainian legal pages already in the app.
- **Example headings vary:** "Practical example" (17), "Example" (9), "Worked example" (1). Use one.
- **Repeated openings:** "Do not" starts 27 sentences and "A beginner" 13. Fine on their own, but when
  rewriting, avoid two "Do not" sentences in one paragraph.
- **Section headings are bold labels in the source** (`**Title.** text`). In the app they render as
  real headings, which is fine. Keep them short and specific, as most already are.

## Medical scope: keep as is

The README rules out diagnosis, rehab programs and diet plans. Sentences such as "The app cannot
decide whether a pregnancy is medically uncomplicated" (#108) or "persistent pain warrants
professional assessment" look like hedging but are scope notices. Keep them, but phrase them for the
reader ("Your doctor or midwife decides whether...") rather than about the app.

## Suggested order of work

1. Rewrite the 29 developer-voice "Using TrainUp" paragraphs and decide whether the section stays.
2. Contrast pass over the 162 sentences and 17 headings.
3. Hedge pass, using concrete tests instead of "appropriate".
4. Make the ACSM name consistent and verify its numbers; check all 310 links.
5. Punctuation: colons, quote style, example headings.
6. Re-run `node tools/theory/import-theories.mjs`. Translate after this, so translators work on
   the final English.

Rewrite in batches of 20 theories and edit `content/theories/*.md`, not the JSON, so the importer stays
the single path into the app.
