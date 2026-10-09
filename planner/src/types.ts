/**
 * TrainUp planner domain types. Framework-free (no Angular, no Firebase) so the same code runs in
 * the app, in the seed script's validation, and later in the WAW API.
 */

export type Goal = 'general-fitness' | 'build-strength' | 'improve-conditioning';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type EquipmentType =
	| 'mat'
	| 'yoga-blocks'
	| 'dumbbells'
	| 'resistance-bands'
	| 'kettlebell'
	| 'bench'
	| 'pull-up-bar'
	| 'barbell'
	| 'rack'
	| 'jump-rope'
	| 'step-platform'
	| 'cardio-machine';

export type BandResistance = 'light' | 'medium' | 'heavy';

export type WorkoutLocation = 'home' | 'gym' | 'outdoors' | 'other';

export type FloorPreset = 'small' | 'medium' | 'large';

export type CeilingPreset = 'low' | 'normal' | 'high' | 'unknown';

export type Surface = 'hard-floor' | 'carpet' | 'mat' | 'grass' | 'other' | 'unknown';

export type YesNoUnknown = 'yes' | 'no' | 'unknown';

export type BodyArea = 'neck' | 'shoulders' | 'wrists' | 'lower-back' | 'hips' | 'knees' | 'ankles';

export interface EquipmentItem {
	type: EquipmentType;
	/** Dumbbells and kettlebells: the weights available, in kilograms. */
	weightsKg?: number[];
	/** Resistance bands: the resistances available. */
	resistances?: BandResistance[];
	/** Bench: whether the backrest is adjustable. */
	adjustable?: boolean;
	/** Pull-up bar: only usable when the user confirms a safe installation. */
	safelyInstalled?: boolean;
}

export interface FloorSpace {
	preset: FloorPreset | null;
	/** Clear usable length, excluding furniture. `null` when not measured. */
	lengthM: number | null;
	widthM: number | null;
}

export interface CeilingClearance {
	preset: CeilingPreset;
	heightM: number | null;
}

/**
 * Equipment and usable space. Unknown answers stay explicit (`unknown`, `null`) so the planner
 * never treats them as confirmed suitable (README §4.2 safety default).
 */
export interface TrainingSetupInput {
	noEquipment: boolean;
	equipment: EquipmentItem[];
	/** Free-text items for the user's reference; never matched to exercise requirements. */
	customEquipment: string[];
	location: WorkoutLocation | null;
	floor: FloorSpace;
	ceiling: CeilingClearance;
	surface: Surface;
	jumpingAllowed: YesNoUnknown;
	quietOnly: boolean;
	canLieDown: YesNoUnknown;
	safeAnchor: YesNoUnknown;
}

/** The profile fields the planner needs. */
export interface PlannerProfile {
	goal: Goal | null;
	fitnessLevel: FitnessLevel | null;
	daysPerWeek: number;
	sessionMinutes: number;
	preferredDays: Weekday[];
}

// ---------------------------------------------------------------------------------------------
// Exercise catalog (README §5)
// ---------------------------------------------------------------------------------------------

export type MuscleGroup =
	| 'quads'
	| 'hamstrings'
	| 'glutes'
	| 'calves'
	| 'chest'
	| 'back'
	| 'shoulders'
	| 'biceps'
	| 'triceps'
	| 'core'
	| 'full-body';

/** Used to build balanced sessions: each session fills movement-pattern slots. */
export type MovementPattern =
	| 'squat'
	| 'hinge'
	| 'lunge'
	| 'push-horizontal'
	| 'push-vertical'
	| 'pull-horizontal'
	| 'pull-vertical'
	| 'core'
	| 'conditioning'
	| 'mobility';

export type ExerciseCategory = 'strength' | 'conditioning' | 'mobility';

export type ImpactLevel = 'none' | 'low' | 'high';

export type NoiseLevel = 'quiet' | 'moderate' | 'loud';

export type AxialLoad = 'none' | 'low' | 'moderate' | 'high';

export type IntensityMode = 'reps' | 'time';

export type ExerciseStatus = 'draft' | 'published' | 'archived';

/**
 * Equipment the exercise needs: every group must be satisfied, and a group is satisfied by any one
 * of its types. `[{ anyOf: ['dumbbells', 'kettlebell'] }, { anyOf: ['bench'] }]` means
 * (dumbbells OR kettlebell) AND bench. An empty list means bodyweight only. (Objects, not nested
 * arrays, because Firestore can't store arrays inside arrays.)
 */
export interface EquipmentGroup {
	anyOf: EquipmentType[];
}

export type EquipmentRequirement = EquipmentGroup[];

export interface MinimumSpace {
	/** Clear floor needed, in meters. Orientation does not matter. */
	lengthM: number;
	widthM: number;
	/** Vertical clearance needed for overhead movement; `null` when there is no overhead part. */
	heightM: number | null;
	/** Lying, kneeling, or hands on the floor. Requires `canLieDown === 'yes'`. */
	needsFloorContact: boolean;
	/** Needs a fixed anchor (door anchor, wall). Requires `safeAnchor === 'yes'`. */
	needsAnchor: boolean;
	/** Surfaces the exercise is safe on; `null` means any surface. */
	surfaces: Surface[] | null;
	/** Where the exercise makes sense. */
	locations: WorkoutLocation[];
}

export interface Exercise {
	id: string;
	slug: string;
	/** Display content is Ukrainian source text, translated through the app's i18n layer. */
	name: string;
	description: string;
	category: ExerciseCategory;
	movementPattern: MovementPattern;
	primaryMuscles: MuscleGroup[];
	secondaryMuscles: MuscleGroup[];
	equipmentRequired: EquipmentRequirement;
	/** Bench exercises that need an incline. */
	requiresAdjustableBench: boolean;
	/** Minimum level at which the exercise is offered. */
	fitnessLevel: FitnessLevel;
	/** 1 = simple, 3 = demanding coordination. */
	coordinationDifficulty: 1 | 2 | 3;
	minimumSpace: MinimumSpace;
	impactLevel: ImpactLevel;
	noiseLevel: NoiseLevel;
	axialSpinalLoad: AxialLoad;
	/** Areas this exercise loads heavily; used to spread load across the week. */
	highLoadBodyAreas: BodyArea[];
	/** The exercise is never offered when the user has an active limitation in any of these areas. */
	contraindicatedAreas: BodyArea[];
	warnings: string[];
	intensityMode: IntensityMode;
	defaultSets: number;
	/** For `reps` mode. */
	repRange: { min: number; max: number } | null;
	/** For `time` mode, in seconds. */
	durationRange: { min: number; max: number } | null;
	/** Typical working time of one set, in seconds. */
	estimatedSetSeconds: number;
	restSeconds: number;
	imageUrl: string | null;
	steps: string[];
	techniqueNotes: string[];
	status: ExerciseStatus;
	/** Name of the qualified reviewer; required before publishing. */
	reviewedBy: string | null;
	/** ISO date of the review. */
	reviewedAt: string | null;
	/** Incremented on every content change; plans keep the version they were built with. */
	version: number;
}

// ---------------------------------------------------------------------------------------------
// Planning
// ---------------------------------------------------------------------------------------------

export interface PlannerInput {
	profile: PlannerProfile;
	setup: TrainingSetupInput;
	/** Body areas with an active limitation. */
	limitations: BodyArea[];
	catalog: Exercise[];
	/** First day of the plan, `YYYY-MM-DD` in the user's local calendar. */
	startDate: string;
	/** Which exercise statuses may be used. Production: `['published']` only. */
	allowedStatuses?: ExerciseStatus[];
	weeks?: number;
	/** Exercises the user reported pain in; excluded until the user explicitly resumes them. */
	pausedExerciseIds?: string[];
	/** Conservative change derived from accumulated feedback (see `recommendAdjustment`). */
	adjustment?: LoadAdjustment;
}

/** How the next plan's volume changes compared to the default prescription. */
export type LoadAdjustment = 'ease' | 'keep' | 'progress';

/** Feedback from one finished workout, as the adaptation rules need it. */
export interface SessionFeedback {
	date: string;
	/** Session RPE 1–10, or `null` when the user skipped the question. */
	rpe: number | null;
	/** Done sets / planned sets, 0–1. */
	completionRate: number;
	pain: boolean;
}

export type AdjustmentReason = 'not-enough-data' | 'pain' | 'too-hard' | 'too-easy' | 'on-track';

export interface AdjustmentRecommendation {
	adjustment: LoadAdjustment;
	reason: AdjustmentReason;
	/** How many recent sessions the decision is based on. */
	sessions: number;
}

export type ExclusionReason =
	| 'not-published'
	| 'incomplete-metadata'
	| 'missing-equipment'
	| 'pull-up-bar-not-secure'
	| 'bench-not-adjustable'
	| 'floor-too-small'
	| 'floor-unknown'
	| 'ceiling-too-low'
	| 'ceiling-unknown'
	| 'surface-unsuitable'
	| 'jumping-not-allowed'
	| 'too-noisy'
	| 'no-floor-contact'
	| 'no-anchor'
	| 'location'
	| 'limitation'
	| 'level-too-high'
	| 'paused-after-pain';

export interface ExerciseExclusion {
	exerciseId: string;
	reasons: ExclusionReason[];
}

export interface EligibilityResult {
	eligible: Exercise[];
	excluded: ExerciseExclusion[];
}

export interface PlannedExercise {
	exerciseId: string;
	exerciseVersion: number;
	/** Snapshot of the name at planning time, so history reads correctly after catalog edits. */
	name: string;
	movementPattern: MovementPattern;
	sets: number;
	repsMin: number | null;
	repsMax: number | null;
	durationSeconds: number | null;
	restSeconds: number;
	/** Target rating of perceived exertion, 1–10. */
	targetRpe: number;
}

export interface PlanDay {
	/** Position in the plan, starting at 0. */
	index: number;
	/** Week of the plan, starting at 1. */
	week: number;
	date: string;
	weekday: Weekday;
	estimatedMinutes: number;
	exercises: PlannedExercise[];
}

export interface PlanInputSnapshot {
	profile: PlannerProfile;
	setup: TrainingSetupInput;
	limitations: BodyArea[];
	/** `id@version` of every exercise that was eligible. */
	catalog: string[];
	/** Missing on plans generated before Phase 3; read as `[]`. */
	pausedExerciseIds?: string[];
	/** Missing on plans generated before Phase 3; read as `'keep'`. */
	adjustment?: LoadAdjustment;
}

export type PlanProvenance = 'calculator' | 'ai';

/** The single plan contract every planning path produces (README §6.1). */
export interface WorkoutPlan {
	schemaVersion: number;
	algorithmVersion: string;
	provenance: PlanProvenance;
	startDate: string;
	weeks: number;
	daysPerWeek: number;
	sessionMinutes: number;
	days: PlanDay[];
	input: PlanInputSnapshot;
}

export type InfeasibilityCode =
	| 'missing-goal-or-level'
	| 'no-eligible-exercises'
	| 'too-few-exercises'
	| 'session-too-short';

export interface Infeasibility {
	code: InfeasibilityCode;
	/** Most common reasons exercises were excluded, most frequent first. */
	topReasons: { reason: ExclusionReason; count: number }[];
}

export type PlanResult = { ok: true; plan: WorkoutPlan } | { ok: false; infeasibility: Infeasibility };

export type PlanViolationCode =
	| 'unknown-exercise'
	| 'ineligible-exercise'
	| 'duplicate-in-day'
	| 'over-time-budget'
	| 'wrong-day-count'
	| 'empty-day';

export interface PlanViolation {
	code: PlanViolationCode;
	dayIndex: number | null;
	exerciseId: string | null;
	detail: string;
}
