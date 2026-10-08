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
| Firestore rules         | Field validation for Phase 1 collections, 17 emulator tests; **not deployed yet** (`npm run rules`)      |
| App (README §13)        | Phase 1 code done (sign-in, onboarding, profile); awaiting end-to-end check. Phases 2–5 open            |

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

Split into three tracks. 2a can start alongside Phase 1, because it is pure TypeScript.

**2a. Planner engine** (shared TypeScript package with no UI)

- [ ] Hard filters: equipment, floor size, ceiling height, surface, impact, noise, lying down, anchor,
      restrictions, skill level, no repeated exercise within a workout.
- [ ] Time budgeting, day assembly, scoring, 4-week plan output, feasibility errors that name the
      conflicting inputs.
- [ ] Versioned `WorkoutPlan` contract with an input snapshot and the algorithm version.
- [ ] Unit tests for acceptance tests **1–7**.
- [ ] WAW API endpoint that verifies the ID token, then generates, validates and saves `users/{uid}/plans`.
      Clients can't write plans directly (see `firestore.rules`).

**2b. Catalog**

- [ ] Seed 40–60 in-house exercises with commissioned images, each reviewed. Leave entries with incomplete
      metadata unpublished.
- [ ] Explore screen: search, plus filters for goal, body part, equipment and space suitability.

**2c. Workout execution**

- [ ] Plan preview and regeneration, Today screen, workout screen (images, sets and reps, rest timer,
      complete/skip), session summary, history.

**Exit:** README M2 "Done when" passes. Changing equipment or space changes which exercises are eligible.

## Phase 3: Routines and adaptive feedback (README Milestone 3)

- [ ] Daily to-dos (create, due date, done, edit, delete).
- [ ] Workout reminders with local notifications. Handle time zones and daylight saving time. Keep the app
      usable if notification permission is denied.
- [ ] Per-set logging, session RPE, discomfort and pain reports.
- [ ] Conservative updates to future plans. When pain is reported, stop the affected exercise, flag it, and
      never raise its load automatically.
- [ ] Progress and history views. Completed sessions never change after a plan is regenerated.

**Exit:** README M3 "Done when" passes, plus acceptance tests **10, 11, 13**.

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
| 1–7 (constraints)             | 2a    |
| 8–9 (AI fallback, validation) | 4     |
| 10–11 (progress, RPE, pain)   | 3     |
| 12 (isolation)                | 1     |
| 13 (reminders)                | 3     |
| 14 (credentials)              | 4     |
