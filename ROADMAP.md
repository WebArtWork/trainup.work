# TrainUp development roadmap

Status as of 2026-10-08. [README.md](README.md) is the feature contract: it defines **what** to build. This
file defines **the order** to build it in, what each phase depends on, and how to tell when it is done.

Phases have no dates yet. Add them once team capacity is known.

## Current state

| Area                    | Status                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| Marketing site          | Done: TrainUp branding, prerendered landing page at `trainup.work`, 14 languages                         |
| Firebase project        | Connected: `train-up-work` web config, browser-only `FirebaseService` (Auth + Firestore)                 |
| Firestore database      | `(default)` exists in Frankfurt (`europe-west3`); empty                                                   |
| Firestore rules         | Field validation for all collections in use, 26 emulator tests; **not deployed yet** (`npm run rules`)   |
| App (README §13)        | Phases 1–3 code done (onboarding, planner, workouts, feedback, to-dos, reminders); awaiting end-to-end check. Phases 4–5 open |
| Exercise catalog        | 48 **draft** exercises in `src/data/exercise/exercises.json`, unreviewed, no images; `npm run seed` syncs to Firestore |

## Critical path

```text
Phase 0 decisions ─► Phase 1 foundation ─► Phase 2 planner + catalog ─► Phase 3 feedback ─► Phase 4 AI ─► Phase 5 release
                                               ▲
Exercise content (reviewed metadata + licensed images) ─┘  start in Phase 0, needed by Phase 2
```

The exercise catalog is the longest lead item: 40–60 exercises with reviewed metadata and licensed images.
It doesn't depend on any code, so start it immediately.

## Phase 0: Decisions and setup

### Decisions (2026-10-08)

| Topic             | Decision                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| App location      | This repo. Web first; Capacitor Android/iOS platforms are added later (Phase 5)                           |
| App URL           | `trainup.work/app/**`, client-rendered. The prerendered landing page stays at `/`                         |
| Sign-in           | Google and Apple (an Apple Developer account already exists). No email/password at launch               |
| Firestore         | Existing `(default)` database in Frankfurt (`europe-west3`)                                               |
| Server            | **No Cloud Functions.** The existing WAW Node.js API (`environment.apiUrl`) hosts TrainUp endpoints. It verifies Firebase ID tokens and writes through `firebase-admin` |
| Firebase plan     | No Blaze upgrade needed for functions                                                                     |
| Exercise content  | Written in-house; images commissioned so they share one visual style                                      |
| Planning (Phase 2) | The app generates and validates plans with the shared `planner/` and saves them to Firestore itself. Rules check the plan shape; per-exercise checks rely on `validatePlan()` in the client. This deviates from README §12 (server validation) until a WAW API endpoint takes over |
| Seed data         | `src/data/` is the source of truth for Firestore-managed content; `npm run seed` uploads it with the Admin SDK |

### Remaining setup

- [ ] Firebase Auth: enable Google. Enable Apple: create a Services ID and a key in the Apple Developer
      account, then add `trainup.work` and `train-up-work.firebaseapp.com` as authorized domains.
- [ ] Enable Storage for exercise images, or decide to serve them from the WAW API or a CDN.
- [ ] Review `firestore.rules`, then deploy with `npm run rules`. The live database currently runs whatever
      rules were chosen when it was created.
- [ ] Enable App Check (reCAPTCHA Enterprise on the web). The Firestore console recommends it, and it
      limits abuse of the public web config.
- [ ] WAW API: add `firebase-admin` with a service account for `train-up-work`, plus a middleware that
      verifies Firebase ID tokens. Keep the service-account key in server secrets only.
- [ ] Set up the Firebase Emulator Suite (Auth + Firestore) so the rules can be tested locally.
- [ ] Exercise content: name the writer, the qualified professional who reviews it, and the illustrator.
      Agree on the image style and license terms (TrainUp must own or hold full rights).
- [ ] Fix README §8 and §15: they say Angular 21 (the stack is 22) and assume Cloud Functions (now the WAW
      API).

**Exit:** sign-in providers enabled, rules deployed, WAW API can verify TrainUp tokens, content owners named.

## Phase 1: Foundation and onboarding (README Milestone 1)

Code is in place (2026-10-08); the end-to-end check waits on Phase 0 setup.

- [x] App shell under `/app` in this repo:
    - `app/**` is `RenderMode.Client` in `app.routes.server.ts`; only the landing page is prerendered.
    - `/app` routes are lazy-loaded, so Firebase stays out of the landing page bundle.
    - `/app` pages are `noindex` and not in the sitemap.
    - Bottom navigation (Today / Workout / Explore / Profile) with the existing translation setup.
    - GitHub Pages serves `index.csr.html` as `404.html`, so `/app` deep links load.
- [x] Firebase Auth (Google, Apple popups) with route guards. `users/{uid}` is created on first sign-in.
- [x] Typed domain models with schema versions: profile, training setup, limitations.
- [x] Onboarding wizard: goal, level and schedule, equipment, space, restrictions, review. The draft
      survives a page reload.
- [x] Visual equipment selector, with weights, band resistance, bench type, and pull-up bar safety.
- [x] Usable-space step: preset sizes plus exact dimensions, ceiling height, surface, jumping, noise,
      lying down, anchor. Unknown answers stay unknown.
- [x] Profile page with an edit page per section, reusing the onboarding editors.
- [x] Firestore rules with field validation; 17 emulator tests (`npm run test:rules`, needs JDK 21+).
      12 validator unit tests (`npm test`).
- [x] Loading, empty and error states on every screen.
- [ ] End-to-end check with a real Google and Apple account once Phase 0 is done (providers enabled,
      rules deployed).
- [ ] Exercise-style equipment images instead of Material Symbols icons (needs the commissioned art).

**Exit:** README M1 "Done when" passes, plus acceptance test **12** (isolation between users).
Test 12 is covered by the rules tests; the "Done when" flow still needs the end-to-end check.

## Phase 2: Planner engine, catalog, workouts (README Milestone 2)

Code is in place (2026-10-08). Plans can be built and run end to end in development with the draft
catalog; production needs reviewed, published exercises first.

**2a. Planner engine** (`planner/`, plain TypeScript, no Angular or Firebase)

- [x] Hard filters: equipment (incl. secure pull-up bar, adjustable bench), floor size in either
      orientation, ceiling clearance, surface, jumping, noise, floor contact, anchor, location,
      limitations, level and coordination, incomplete metadata, unpublished status.
- [x] Time budgeting sized by the heaviest week, goal-based movement-pattern sessions, scoring for goal
      fit, variety and recovery spacing, 4-week plan with a week-4 deload; no weights prescribed.
- [x] Explained infeasibility (`missing-goal-or-level`, `no-eligible-exercises`, `too-few-exercises`,
      `session-too-short`) with the main exclusion reasons and links to the setting behind each.
- [x] Versioned `WorkoutPlan` with input snapshot, eligible catalog `id@version`, algorithm version.
- [x] `validatePlan()` re-checks every saved plan; acceptance tests **1–7** plus catalog coverage tests
      (`npm test`, 88 tests).
- [ ] Move generation and validation to a WAW API endpoint (README §12); the planner is ready to import.

**2b. Catalog**

- [x] 48 draft exercises in `src/data/exercise/exercises.json` (metadata decided per exercise; text
      written by an agent). Status `draft`, `reviewedBy` empty, no images.
- [x] `npm run seed`: validates the catalog, then upserts it to Firestore (`--dry-run`, `--prune`).
      Needs a service-account key (see `tools/seed/seed.mjs`).
- [x] Explore: search, category filter, "suits me" filter using the planner's own rules; detail page
      shows technique, needs, and why an exercise doesn't suit the user.
- [ ] Professional review of every exercise, then set `status: "published"`, `reviewedBy`,
      `reviewedAt` and run `npm run seed`. Until then production shows "catalog is being prepared".
- [ ] Commissioned images (`imageUrl`); translations of exercise text (currently Ukrainian only).

**2c. Workout execution**

- [x] Today: generate plan, today/next session, out-of-date banner with explicit regenerate.
- [x] Plan overview (4 weeks, completion marks), workout runner (set check-off, reps, hold timer, rest
      timer, local draft survives reload), summary, immutable session history.

**Exit:** README M2 "Done when" passes. Changing equipment or space changes which exercises are eligible.
Verified by planner tests; the in-app flow still needs the end-to-end check with a real account.

## Phase 3: Routines and adaptive feedback (README Milestone 3)

Code is in place (2026-10-08); the in-app flow still needs the end-to-end check.

- [x] Daily to-dos: create, optional due date, check off, edit, delete. Today shows open tasks due today,
      overdue, or undated; workouts stay separate (README §11).
- [x] Workout reminders: time, days, device time zone stored with the setting; next reminder computed in
      the user's zone and correct across daylight saving (tested). Permission is requested only from a
      tap; denied or unsupported notifications fall back to the reminder shown on Today.
- [ ] Reminders while the app is closed: browser delivery only works while TrainUp is open. Needs push
      from the WAW API or Capacitor local notifications (Phase 5); `ReminderService._deliver()` is the
      single place to swap.
- [x] Per-set logging (Phase 2), session RPE 1–10, pain and discomfort with areas and exercises, notes.
- [x] Pain stop: "I feel pain" ends the current exercise immediately; reported exercises are paused
      (`exerciseFlags`), excluded by the planner and blocked in the runner until the user resumes them
      from Profile. Pain never leads to more load (acceptance test **11**).
- [x] Conservative adaptation (`planner/src/adaptation.ts`): no change from fewer than 3 sessions; ease
      after 2 of the last 3 very hard or mostly unfinished; progress only after 4 easy, complete sessions
      without pain; at most one step per regeneration, and only when the user regenerates.
- [x] Progress on History (this week, total, average effort, 4-week chart). Completed sessions stay
      immutable (acceptance test **10**).
- [x] Rules for sessions v2, `exerciseFlags`, `todos`, `reminders`; 26 emulator tests. 108 unit tests.

**Exit:** README M3 "Done when" passes, plus acceptance tests **10, 11, 13**. 10 and 11 are covered by
planner and rules tests; 13 by rules and time-zone tests plus the permission fallbacks. The "receive a
reminder" part holds only while the app is open until push or native notifications exist.

## Phase 4: Optional AI (README Milestone 4, first part)

- [ ] Provider interface and strict JSON response schema, in the WAW API only.
- [ ] First provider: OpenAI **or** Anthropic.
- [ ] Every AI proposal goes through the same Phase 2a validator. Retry with feedback a limited number of
      times, then fall back to the rule-based plan.
- [ ] Quotas, timeouts, spending alerts. Logs must not include prompt or profile content.
- [ ] Profile, then AI: a settings screen that shows only connection modes that actually work, controlled
      by feature flags.

**Exit:** acceptance tests **8, 9, 14**. AI outages never block planning.

## Phase 5: Release (README Milestone 4, second part)

- [ ] End-to-end tests for the full journey (sign up, then onboarding, then plan, then workout, then
      feedback).
- [ ] Privacy controls: data export and account deletion.
- [ ] Privacy policy and terms pages on the marketing site. App stores and the Google sign-in consent
      screen require them.
- [ ] Add Capacitor Android and iOS platforms (local notifications, Sign in with Apple on iOS), then builds, signing, store listings.
- [ ] Update the marketing site: remove "in development" and add store links.

**Exit:** all 14 README acceptance tests pass, and the README MVP success criterion holds.

## Acceptance test coverage

| README §14 test               | Phase |
| ----------------------------- | ----- |
| 1–7 (constraints)             | 2a ✓ (planner tests) |
| 8–9 (AI fallback, validation) | 4     |
| 10 (progress intact)          | 2c ✓ (immutable sessions, rules tests) |
| 11 (RPE, pain)                | 3 ✓ (planner and rules tests) |
| 12 (isolation)                | 1 ✓ (rules tests) |
| 13 (reminders)                | 3 ✓ (rules, time-zone tests); closed-app delivery in 5 |
| 14 (credentials)              | 4     |
