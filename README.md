# TrainUp.work

**TrainUp** is a mobile-first, visual workout-planning application. Users choose a training goal, describe their fitness level, available equipment, **available workout space**, schedule, and limitations. TrainUp builds an achievable training program, guides daily workouts with exercise images and tap-based controls, tracks progress, and adapts subsequent workouts.

**Product principle:** Users should not need to write prompts or chat with an AI to get a useful workout plan. AI is optional; the core app works without it.

**Project website:** `https://trainup.work` (brand/domain chosen; deployment is not assumed).

**Status:** MVP product/engineering specification for future implementation by Codex. This README describes requirements and decisions; it is not a claim that anything has been implemented.

## 1. Scope and source

The initial research document, **«РОЗДІЛ 2. МАТЕМАТИЧНЕ ТА АЛГОРИТМІЧНЕ МОДЕЛЮВАННЯ ПРОЦЕСУ ФОРМУВАННЯ ТРЕНУВАЛЬНИХ ПЛАНІВ»**, defines:

- A user profile containing age, weight, height, preparedness, equipment, medical restrictions, preferred workout days, and goal (2.1.1).
- Exercise metadata: targeted muscles, equipment, spinal axial load, high-load anatomical zones, coordination difficulty, and exercise duration (2.1.2).
- Workout plans with days, exercises, sets, repetitions, and intensity (2.1.3).
- Hard constraints for feasible workouts and soft criteria for balancing weekly training volume, recovery, and localized overloading (2.2).
- A hybrid deterministic optimization + LLM architecture: calculate/validate a plan first; use an LLM for understandable explanations and instructions (2.3).
- Adaptation using reported perceived exertion (RPE) and re-evaluation of restrictions after new pain (2.4).

**MVP adaptation:** Start with a deterministic TypeScript generator/validator (simpler to deploy with Firebase), while defining interfaces that can later be backed by the document's more advanced Python CSP/optimization engine. Do not misrepresent the MVP rule-based generator as the full mathematical CSP optimizer.

**Additional TrainUp product requirements** beyond the document: accessible mobile UI, exercise imagery, detailed equipment/space setup, optional OpenAI/Anthropic integrations, daily tasks, and reminders.

## 2. Target MVP

- **Platform:** mobile-first Angular + Capacitor app for Android and iOS, with a responsive web build.
- **Training scope:** individual strength, bodyweight, and general fitness/mobility routines. Running, cycling, yoga-specialist programming, rehabilitation, social features, and coaching marketplaces are not required for v1.
- **Experience:** visual onboarding with selectable cards; minimal typing; workouts displayed as images, instructions, timers, and completion controls.
- **Core behavior:** without any AI connection, users still receive and can complete a workout program.
- **Personalization:** goals, skill level, available minutes/days, equipment inventory, actual usable space, and limitations affect the result.
- **Account:** Firebase Authentication, independent of any optional AI account/provider.

### In scope

1. Authentication and saved user profile.
2. Visual onboarding for goals, level, schedule, equipment, and space.
3. Curated exercise catalog with pictures and verified metadata.
4. Deterministic workout-plan generator and validator.
5. Optional AI-powered suggestions/explanations where integration is supported.
6. Daily workout execution with sets, reps, timers, completion, and RPE feedback.
7. Simple daily to-dos and workout reminders.
8. History, basic progress summary, profile editing, and plan regeneration.

### Out of scope for v1

Payments, subscriptions, live chat, social feed, leaderboards, wearables, camera-based pose recognition, AI-generated exercise videos, calorie tracking, dietary/medical advice, sophisticated real-time coaching, and a full Python CSP solver.

## 3. User journeys

### A. First launch

1. Open app → sign up/sign in using Google, Apple (where configured), or email.
2. Choose the goal: **General fitness**, **Build strength**, or **Improve conditioning**. Support adding goal types later.
3. Set age, height, weight (clearly indicate optional/required fields), fitness level, workout days per week, typical session length, and preferred days.
4. Select equipment with visual cards; choose **No equipment** if applicable.
5. Describe workout location and **usable workout space** using the controls in section 4.
6. Select known movement restrictions and optionally add notes. Explain that the app cannot diagnose medical issues and that some conditions require professional input.
7. Review selections and generate a plan. If feasible constraints cannot be satisfied, show which inputs conflict and how to adjust them.
8. Land on **Today**, with the next session and a simple daily task list.

### B. Everyday use

1. Open **Today** → see scheduled workout and daily to-dos.
2. Start workout → move through exercises using images and clear instructions.
3. Complete/skip sets, record actual repetitions/effort, optionally rest with a timer.
4. Finish workout → report session RPE, discomfort/pain (if any), and optional notes.
5. Save workout history. Apply appropriate conservative changes to future workouts; never silently change a workout currently in progress.
6. Receive reminders based on the user's preferences and time zone.

### C. Editing the environment

1. Open **Profile → Training setup**.
2. Add/remove equipment or change usable floor dimensions and restrictions.
3. Review changes and explicitly regenerate future sessions.
4. Existing completed workouts remain unchanged in history.

### D. Optional AI

1. Open **Profile → AI**.
2. See available supported methods (app-provided AI, supported account integration, or API-key connection if implemented).
3. AI can explain or suggest modifications to the program using approved exercise IDs and the user's preferences.
4. Deterministic server-side validation must approve the final plan before saving it. If AI is unavailable or invalid, fall back to the rule-based plan.

## 4. Equipment and workout space — key differentiation

**Do not treat “working out at home” as enough information.** A user can have dumbbells but only a narrow hallway, a small apartment, or a room without overhead clearance. The planner must check both equipment **and available space**.

### 4.1 Equipment inventory

Provide images/cards, search, and quantities where useful. Suggested initial categories:

- None / bodyweight only.
- Exercise mat; yoga blocks.
- Dumbbells (optional weight range or individual weights).
- Resistance bands (type and available resistance).
- Kettlebell (available weight).
- Adjustable or fixed bench.
- Pull-up bar (mark as safely installed or unavailable).
- Barbell and plates; rack (gym-focused).
- Jump rope; step/platform; cardio machine (where relevant).
- Custom item field, but do not assume an unknown item matches a required equipment type.

Rules:

- Exercise requirements are **specific item types**, not a free-text description.
- An exercise is excluded when any required item is missing, including safety-related fixtures.
- Treat weights and equipment capabilities as relevant only when exercise metadata and the planner can correctly use them.
- Users can save multiple setups later (e.g., home and gym); for MVP, support **one active setup**, editable at any time.

### 4.2 Workout location and usable space

Collect the following through simple cards/sliders/selects:

| Input                       | MVP representation                                         | Impact on exercise selection                                          |
| --------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| Location                    | Home / Gym / Outdoors / Other                              | Context and surface/setting restrictions                              |
| Usable floor area           | Length × width in meters, or Small / Medium / Large preset | Must meet exercise-specific clearance requirements                    |
| Ceiling height              | Optional numeric height or Low / Normal / High             | Exclude overhead activities when clearance is unknown or insufficient |
| Surface                     | Hard floor / Carpet / Mat / Grass / Other                  | Floor-contact and stability compatibility                             |
| Jumping/high impact         | Allowed / Not allowed                                      | Exclude jump-based and high-impact movements                          |
| Noise constraint            | Quiet only / Normal                                        | Exclude noisy movements when quiet is required                        |
| Can lie down on floor       | Yes / No                                                   | Exclude floor-based exercises when unavailable                        |
| Safe wall/anchor attachment | Yes / No / Unsure                                          | Do not require wall-anchored exercises without an affirmative setting |

**UX requirements:** Provide an illustrative top-down floor-space selector or preset choices, but also allow users to enter actual dimensions. Call it **clear usable floor space**, excluding furniture. Show example explanations such as “You need room to lie flat and extend your arms.” Do not force measuring tools or exact measurements; unknown data leads to conservative recommendations.

**Safety default:** Unknown space, ceiling, fixture, or impact tolerance must **not** be treated as confirmed suitable for exercises that explicitly require it.

### 4.3 Exercise spatial metadata

Every exercise must define, when relevant:

- Minimum clear length and width in meters.
- Minimum vertical clearance for overhead movement.
- Whether it needs open floor, a lying-down position, stable ground, or a fixed anchor.
- High-impact/noisy flags and indoor/outdoor compatibility.
- Required equipment and safe setup notes.

A spatial incompatibility is a **hard constraint**, not a preference that AI may override.

## 5. Exercise catalog

Seed a small **curated initial catalog of approximately 40–60 exercises** to support the MVP goals. All records must have reviewed technique instructions and appropriate licensing for images.

Minimum data per exercise:

| Field                                              | Meaning                                           |
| -------------------------------------------------- | ------------------------------------------------- |
| `id`, `slug`, `name`, `description`                | Stable identity and display                       |
| `primaryMuscles`, `secondaryMuscles`               | Grouping and weekly volume calculations           |
| `equipmentRequired`                                | Typed equipment references, not ambiguous prose   |
| `fitnessLevel`, `coordinationDifficulty`           | Baseline experience requirements                  |
| `minimumSpace`                                     | Width, length, height and applicable restrictions |
| `impactLevel`, `noiseLevel`, `surfaceRequirements` | Environmental suitability                         |
| `axialSpinalLoad`, `highLoadBodyAreas`             | Biomechanical screening metadata                  |
| `contraindications`, `warnings`                    | Conservative guidance requiring expert review     |
| `estimatedSetSeconds`, `restSeconds`               | Time budgeting                                    |
| `defaultSets`, `repRange`, `intensityMode`         | Generator starting parameters                     |
| `imageUrl`, `steps`, `techniqueNotes`              | Visual guidance                                   |
| `status`, `reviewedBy`, `reviewedAt`               | Content quality and publication controls          |

Exercises with incomplete required metadata must not be auto-selected. Images must be self-owned, permissively licensed, or explicitly licensed; preserve attribution when required.

## 6. Workout generation

### 6.1 Single contract

All planning paths must produce the same versioned **WorkoutPlan** structure: start date, number of weeks, ordered days, planned duration, exercise IDs, sets, rep/time targets, intensity/RPE target where applicable, rest, and generation provenance (`calculator` or AI provider).

### 6.2 Deterministic generator (always available)

1. Read validated user profile, active equipment, space, limitations, schedule, and approved exercise catalog.
2. **Hard-filter** incompatible exercises:
    - Missing required equipment or fixture.
    - Inadequate usable dimensions, ceiling clearance, or floor/surface compatibility.
    - Prohibited jumping/noise/floor-contact conditions.
    - Documented contraindicated loads/body areas and conservative skill-level boundaries.
    - Violations of exercise uniqueness within a workout.
3. Assemble candidate days respecting user-selected weekly frequency and time budget, including rest intervals.
4. **Score/rank** candidates using goal fit, muscle-group distribution, fatigue/recovery spacing, variety, and user preferences. This is a simplified v1 approximation of the source document's CSP objective.
5. Output a **4-week plan** by default, with initial weekly intensity kept conservative and no arbitrary weight prescriptions.
6. Validate every day and return an explanatory error when no feasible plan exists.
7. Save a snapshot of plan inputs and algorithm version to support reproducibility.

Do not prescribe a one-repetition maximum (1RM) weight based solely on age, height, and body weight. Start from user-reported performance/equipment and RPE or provide self-selection instructions. Parameters such as weekly set targets and progression need configurable, reviewed defaults.

### 6.3 AI-assisted mode

AI may improve goal interpretation, choose **from approved catalog exercise IDs**, draft readable explanations, and suggest a program. AI does **not** get unilateral authority to introduce exercises, modify safety constraints, prescribe unsupported loads, or overwrite data.

Server flow:

1. Fetch a minimized user context and approved exercise candidates.
2. Ask the selected AI provider for a **strict structured response** containing candidate exercise IDs, intended scheduling, and explanations.
3. Parse and validate types and allowed IDs.
4. Run exactly the same deterministic safety/space/time validator as the non-AI flow.
5. If invalid, retry with bounded feedback **or fall back** to calculator output; show source mode to the user.
6. Persist the accepted plan and plain-language explanations separately.

Keep prompts, provider adapters, schemas, logs, timeouts, and fallback behavior versioned and testable. AI must never invent “safe for injury” claims.

### 6.4 Feedback and adaptation

- Capture per-set completion, actual reps/loads if used, and session RPE (e.g., 1–10).
- Recalculate **future** intensity/volume conservatively after accumulated feedback rather than scaling mechanically from a single session.
- Allow users to skip an exercise, substitute a validated compatible alternative, or regenerate after changed constraints.
- If pain is reported: **stop the affected activity, show an appropriate caution, flag the affected plan for review, and do not automatically resume/increase load**. Recommend qualified medical advice when indicated; do not offer diagnosis.
- Preserve completed sessions; new generations create a new plan revision.

## 7. Main app screens

Bottom navigation (MVP):

| Page        | Required functionality                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| **Today**   | Next workout, progress, daily to-dos, quick start, reminder summary                                  |
| **Workout** | Current training day, exercise cards/images, instructions, sets/reps, rest timer, complete/skip, RPE |
| **Explore** | Catalog search and filters for goal, body part, equipment, and space suitability                     |
| **Profile** | Personal data, goals, equipment, space, constraints, schedule, AI connection, reminder settings      |

Additional flows: authentication, onboarding wizard, plan preview/regenerate, session summary, training history, and daily to-do add/edit/check.

**UI guidelines:** Mobile-first touch targets; good contrast; loading/empty/error states; keyboard/screen-reader support; intuitive visual equipment selector; avoid requiring conversational AI to complete any core task. Prefer local image caching where feasible.

## 8. Suggested stack and architecture

| Concern                     | MVP decision                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| App                         | Angular 21 + TypeScript + Capacitor, SCSS with BEM                                                           |
| Angular conventions         | Signal-based APIs; `input()`, `output()`, `viewChild()`; `@if` / `@for`; `ChangeDetectionStrategy.OnPush`    |
| Authentication              | Firebase Authentication (Google, Apple where configured, email)                                              |
| User data and history       | Cloud Firestore                                                                                              |
| Exercise images             | Firebase Storage / licensed CDN                                                                              |
| Scheduled jobs              | Firebase scheduled Cloud Functions when necessary                                                            |
| Reminders                   | Capacitor local notifications for on-device workout reminders; FCM for server-originated notifications       |
| Workout engine              | Shared TypeScript calculator + validator, callable by a secure backend function                              |
| AI                          | OpenAI / Anthropic provider abstraction behind a server-side endpoint                                        |
| API                         | Existing Node.js backend **only** for functionality not conveniently or safely handled by Firebase Functions |
| Later advanced optimization | Python CSP / OR-Tools as isolated service behind the same planner interface                                  |

### Responsibilities

- **Client:** UI, onboarding, workout execution, timers, user input, notification permission requests.
- **Firebase:** Authentication, secured profile/plan/history persistence, media hosting, event/scheduled functions.
- **Trusted server:** AI calls, access control, secret storage, plan generation and validation, usage quotas, plan persistence.
- **Shared engine:** exercise screening, environment compatibility, scoring, schema validation, and reproducible plan generation.

Suggested conceptual flow:

**Angular + Capacitor → Firebase Auth / Firestore → secure planner endpoint → deterministic engine → optional AI adapter → final deterministic validation → Firestore plan**.

Do not deploy a custom NestJS/Express server for features that Firebase handles adequately; reuse the existing Node.js API where integration, secrets, policy or compute justify it.

## 9. AI connectivity and account expectations

Treat **signing into TrainUp** and **connecting an AI provider** as separate concerns.

- **TrainUp sign-in:** Firebase Auth.
- **No AI:** Full workout generation still functions using deterministic logic.
- **App-provided AI:** TrainUp's server-side OpenAI/Anthropic API credential; budget/quotas required.
- **Bring-your-own API key (optional):** Advanced mode only if secure server-side credential handling, revocation and clear billing information are implemented.
- **Use existing ChatGPT/Claude subscription:** **Not a guaranteed general-purpose integration.** A consumer chat subscription cannot simply be assumed to grant third-party API usage. Enable only if the provider explicitly offers and authorizes a suitable integration for this product. Do not describe ordinary OAuth/login as unlimited model access.

The MVP **must not depend** on subscription-based provider connection. Use the deterministic generator as the mandatory path and app-provided AI as an optional enhancement if budget and provider access permit. Use feature flags to expose only working AI connection methods.

Security: never embed a platform API key in the mobile bundle; keep secrets server-side, encrypt any stored user-provided secrets, avoid returning them to clients, and support disconnect/revocation.

## 10. Suggested data model (Firestore)

Use typed documents, stable IDs, migrations/schema versions, server timestamps, and per-user security rules.

| Collection                         | Key information                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `users/{uid}`                      | Basic profile, goals, fitness level, locale/time zone, settings                                     |
| `users/{uid}/trainingSetups/{id}`  | Equipment inventory, location, dimensions, surface, clearance/noise/impact preferences, active flag |
| `users/{uid}/limitations/{id}`     | User-reported restrictions, affected area, dates, active flag; minimal sensitive data               |
| `exercises/{id}`                   | Reviewed metadata, equipment and spatial requirements, image, instructions, tags                    |
| `users/{uid}/plans/{planId}`       | Generated schedule, revision, calculator/AI provenance, input snapshots, validation status          |
| `users/{uid}/sessions/{sessionId}` | Planned vs actual sets/reps, completion, RPE, pain flags, timestamps                                |
| `users/{uid}/todos/{todoId}`       | Title, due date, completion, optionally linked workout                                              |
| `users/{uid}/reminders/{id}`       | Reminder type, local time, recurrence, enabled state, time zone                                     |
| `users/{uid}/aiConnections/{id}`   | Provider, integration type, status, secret reference only — **not raw credentials**                 |

Keep an exercise snapshot/version reference in saved plans so catalog edits do not unexpectedly change a completed session.

## 11. Reminders and simple daily tasks

- Users choose their preferred workout days and local times.
- Offer permission for notifications contextually; app remains usable if denied.
- Use device-local notifications for basic recurring workout reminders where supported; use FCM only if the product truly needs server-pushed events.
- Handle time-zone changes and daylight-saving transitions.
- Include a small personal checklist: create task, optional due date, mark done, edit/delete; workouts can be shown as scheduled items without duplicating them as arbitrary tasks.
- No general-purpose project management, collaboration, or complex recurring-task automation in MVP.

## 12. Security, privacy and safe behavior

- Firestore and Storage access rules enforce per-user ownership; exercise publishing requires admin privileges.
- Validate authorization and all plan constraints on the server; do not trust the client's claims about validation or exercise IDs.
- Minimize health-related information, provide clear consent and deletion/export paths, and avoid uploading unnecessary personal details to AI providers.
- Use quotas, rate limits, spending alerts, AI timeouts, idempotent plan generation, and structured error logging without sensitive prompt/profile content.
- Published exercise metadata and instructions should be reviewed by appropriately qualified fitness/health professionals where needed.
- Do not promise to prevent injuries or provide medical treatment. If a reported symptom creates uncertainty, prefer pausing/asking for professional guidance over a confident automatic substitute.
- Basic accessibility and internationalization support from the start; keep UI copy in translation files.

## 13. Implementation milestones for Codex

### Milestone 1 — App foundation and onboarding

- [ ] Initialize Angular + Capacitor application, Firebase environments and navigation.
- [ ] Add Firebase Auth and route guards.
- [ ] Create onboarding/profile types and screens.
- [ ] Implement **visual equipment selection and saved quantities/weights where applicable**.
- [ ] Implement **usable-space configuration with dimensions and environmental restrictions**.
- [ ] Add Firestore security rules, validation, loading/errors, tests and seed-friendly collection structure.

**Done when:** a user can sign up, complete onboarding, save/edit equipment and physical space, and retrieve the same setup after signing back in.

### Milestone 2 — Catalog and deterministic training

- [ ] Seed 40–60 reviewed exercise entries with valid metadata and licensed placeholder/media assets.
- [ ] Implement browse/search/filter catalog.
- [ ] Implement generator, time budgeting, constraint validator, and reproducible plan revisions.
- [ ] Create plan preview, Today's workout, workout execution, session summary and history.
- [ ] Unit-test equipment, floor-clearance, overhead-clearance, noise, impact, restrictions, duration, and no-feasible-plan cases.

**Done when:** an unaided calculator can produce and complete a valid training plan, and changing equipment or space changes exercise eligibility as expected.

### Milestone 3 — Daily routines and adaptive feedback

- [ ] Add to-dos and configurable reminders.
- [ ] Capture completed sets, session RPE, and discomfort feedback.
- [ ] Implement conservative future-plan update rules and safe pain-stop behavior.
- [ ] Build basic progress and history views.

**Done when:** a user can follow workouts for several days, receive a reminder, check off a task, record effort, and request a future plan revision without losing history.

### Milestone 4 — Optional AI and release

- [ ] Define AI provider interface plus strict JSON response schema.
- [ ] Add first provider (OpenAI **or** Anthropic) server-side; add the second later if useful.
- [ ] Reuse deterministic validator for all AI-generated plan proposals; ensure graceful fallback.
- [ ] Add minimal connection/settings UI that only shows actually supported connection modes.
- [ ] Add telemetry/privacy controls, quota protections, e2e flows and Android/iOS release setup.

**Done when:** AI adds meaningful personalization while neither provider outages nor invalid AI output prevent core workout planning.

## 14. Acceptance tests (non-negotiable)

1. **No equipment:** A user with no gear gets only exercises that require no external gear.
2. **Limited floor area:** An exercise that requires more clear length/width than configured is never selected.
3. **Low ceiling:** Overhead exercises with insufficient or unknown required clearance are excluded.
4. **Quiet apartment:** Jumping/noisy exercises are excluded if the user disallows them.
5. **Missing anchor:** Exercises requiring an installed anchor are excluded if no safe anchor is confirmed.
6. **Injuries/restrictions:** An exercise marked incompatible with an active restriction is excluded; if suitability is unclear, do not assert safety.
7. **Short sessions:** Planned exercise plus rest time fits the session limit or the UI explains infeasibility.
8. **AI unavailable:** User can still create, see, perform and save the deterministic plan.
9. **AI invalid proposal:** Unknown exercise ID, missing equipment, or space-violating AI output never becomes an accepted plan.
10. **Progress:** Completed sessions remain intact after plan regeneration or equipment changes.
11. **RPE and pain:** Effort is recorded; reported pain prevents automatic escalation/resumption of the affected activity.
12. **Isolation:** User A cannot read or write User B's private data.
13. **Reminders:** User can enable/disable workout reminders and the app behaves sensibly without notification permission.
14. **Provider credentials:** No AI secret is exposed in client source, app bundle, Firestore-readable documents, or logs.

## 15. Coding-agent instructions

- Treat this README as the **feature contract**. Implement milestones in order; do not invent additional product areas.
- If an existing WAW repository, Firebase project, Node.js API, or Angular workspace is supplied, **inspect and reuse its conventions** rather than scaffolding duplicate services.
- Prefer small domain modules (auth, profile, training-setup, catalog, planner, workout-session, todos, notifications, AI adapters).
- For Angular 21 use function-based APIs, modern control flow (`@if`, `@for`), and `ChangeDetectionStrategy.OnPush`; use SCSS+BEM and accessible components.
- Centralize exercise constraints in one testable engine so calculator and AI paths cannot diverge.
- Separate **user-configured facts** from **model suggestions** and **verified exercise metadata**.
- Before each milestone, provide a short implementation plan; after it, provide tests, changed-file summary, and any external Firebase/provider configuration that requires human input.
- Do not claim subscription-backed OpenAI/Anthropic sign-in is available until an authorized provider mechanism has been confirmed and implemented.
- Keep unfinished/inaccessible provider connection methods disabled rather than showing nonfunctional buttons.

---

**MVP success criterion:** A new user can register, select a goal, inventory their equipment, describe the **physical space where they can actually move**, get a feasible workout plan **without AI**, visually complete workouts, track feedback, and receive reminders. AI improves this workflow when supported; it never replaces the core reliability checks.
