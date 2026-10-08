import { filterExercises } from './eligibility';
import type {
	BodyArea,
	EligibilityResult,
	ExclusionReason,
	Exercise,
	ExerciseCategory,
	FitnessLevel,
	Goal,
	Infeasibility,
	InfeasibilityCode,
	LoadAdjustment,
	MovementPattern,
	PlanDay,
	PlannedExercise,
	PlannerInput,
	PlanResult,
	Weekday,
} from './types';

export const ALGORITHM_VERSION = 'calculator-1.0.0';
export const PLAN_SCHEMA_VERSION = 1;
export const DEFAULT_PLAN_WEEKS = 4;
/** Moving between exercises, setting up equipment. */
export const TRANSITION_SECONDS = 30;
export const MIN_EXERCISES_PER_DAY = 2;
export const MAX_EXERCISES_PER_DAY = 8;

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Evenly spread defaults when the user picked no preferred days. */
const DEFAULT_SCHEDULE: Record<number, Weekday[]> = {
	1: ['wed'],
	2: ['mon', 'thu'],
	3: ['mon', 'wed', 'fri'],
	4: ['mon', 'tue', 'thu', 'fri'],
	5: ['mon', 'tue', 'wed', 'fri', 'sat'],
	6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
	7: WEEKDAYS,
};

/** Session structure per goal: movement patterns in priority order. */
const SESSION_SLOTS: Record<Goal, MovementPattern[]> = {
	'build-strength': [
		'squat',
		'push-horizontal',
		'hinge',
		'pull-horizontal',
		'lunge',
		'push-vertical',
		'pull-vertical',
		'core',
	],
	'general-fitness': [
		'squat',
		'push-horizontal',
		'hinge',
		'pull-horizontal',
		'core',
		'conditioning',
		'lunge',
		'mobility',
	],
	'improve-conditioning': [
		'conditioning',
		'squat',
		'push-horizontal',
		'lunge',
		'pull-horizontal',
		'core',
		'conditioning',
		'mobility',
	],
};

const CATEGORY_FIT: Record<Goal, Record<ExerciseCategory, number>> = {
	'build-strength': { strength: 3, conditioning: 1, mobility: 0.5 },
	'general-fitness': { strength: 2, conditioning: 2, mobility: 1.5 },
	'improve-conditioning': { strength: 1.5, conditioning: 3, mobility: 1 },
};

const LEVEL_RANK: Record<FitnessLevel, number> = { beginner: 1, intermediate: 2, advanced: 3 };

const BASE_RPE: Record<FitnessLevel, number> = { beginner: 6, intermediate: 7, advanced: 7 };

export function scheduleWeekdays(daysPerWeek: number, preferredDays: Weekday[]): Weekday[] {
	if (preferredDays.length === daysPerWeek) {
		return WEEKDAYS.filter((day) => preferredDays.includes(day));
	}

	return DEFAULT_SCHEDULE[Math.min(Math.max(daysPerWeek, 1), 7)]!;
}

export function weekdayOf(date: string): Weekday {
	const [year, month, day] = date.split('-').map(Number);
	const sundayFirst = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();

	return WEEKDAYS[(sundayFirst + 6) % 7]!;
}

export function addDays(date: string, days: number): string {
	const [year, month, day] = date.split('-').map(Number);

	return new Date(Date.UTC(year!, month! - 1, day! + days)).toISOString().slice(0, 10);
}

/** Seconds one planned exercise takes: work + rest per set, plus moving to the next exercise. */
export function plannedExerciseSeconds(
	exercise: Pick<Exercise, 'estimatedSetSeconds'>,
	planned: Pick<PlannedExercise, 'sets' | 'durationSeconds' | 'restSeconds'>,
): number {
	const work = planned.durationSeconds ?? exercise.estimatedSetSeconds;

	return planned.sets * (work + planned.restSeconds) + TRANSITION_SECONDS;
}

/**
 * Deterministic plan generator (README §6.2). Same input, same plan. A simplified, rule-based
 * approximation of the research document's CSP objective — not the full optimizer.
 */
export function generatePlan(input: PlannerInput): PlanResult {
	const { profile, setup, limitations, catalog } = input;
	const weeks = input.weeks ?? DEFAULT_PLAN_WEEKS;
	const eligibility = filterExercises(catalog, {
		profile,
		setup,
		limitations,
		allowedStatuses: input.allowedStatuses ?? ['published'],
		pausedExerciseIds: input.pausedExerciseIds ?? [],
	});
	const adjustment = input.adjustment ?? 'keep';

	if (!profile.goal || !profile.fitnessLevel) {
		return _infeasible('missing-goal-or-level', eligibility);
	}

	if (!eligibility.eligible.length) {
		return _infeasible('no-eligible-exercises', eligibility);
	}

	const goal = profile.goal;
	const level = profile.fitnessLevel;
	const prescribe = (exercise: Exercise, week: number) =>
		_prescription(exercise, level, week, adjustment);
	const budgetSeconds = profile.sessionMinutes * 60;
	const weekdays = scheduleWeekdays(profile.daysPerWeek, profile.preferredDays);

	// Build one week of sessions; later weeks repeat it with progression (consistency helps adherence).
	const template = new Map<Weekday, Exercise[]>();
	const usedThisWeek = new Map<string, number>();
	let previousLoad: BodyArea[] = [];

	for (const weekday of weekdays) {
		const session = _buildSession(
			eligibility.eligible,
			goal,
			level,
			budgetSeconds,
			usedThisWeek,
			previousLoad,
			prescribe,
		);

		if (session.length < MIN_EXERCISES_PER_DAY) {
			const cheapest = Math.min(
				...eligibility.eligible.map((exercise) =>
					_peakSeconds(exercise, prescribe),
				),
			);

			return _infeasible(
				cheapest * MIN_EXERCISES_PER_DAY > budgetSeconds ? 'session-too-short' : 'too-few-exercises',
				eligibility,
			);
		}

		template.set(weekday, session);
		session.forEach((exercise) => usedThisWeek.set(exercise.id, (usedThisWeek.get(exercise.id) ?? 0) + 1));
		previousLoad = session.flatMap((exercise) => exercise.highLoadBodyAreas);
	}

	const days: PlanDay[] = [];

	for (let offset = 0; offset < weeks * 7; offset++) {
		const date = addDays(input.startDate, offset);
		const weekday = weekdayOf(date);
		const session = template.get(weekday);

		if (!session) {
			continue;
		}

		const week = Math.floor(offset / 7) + 1;
		const exercises = session.map((exercise) => prescribe(exercise, week));
		const seconds = session.reduce(
			(total, exercise, i) => total + plannedExerciseSeconds(exercise, exercises[i]!),
			0,
		);

		days.push({
			index: days.length,
			week,
			date,
			weekday,
			estimatedMinutes: Math.ceil(seconds / 60),
			exercises,
		});
	}

	return {
		ok: true,
		plan: {
			schemaVersion: PLAN_SCHEMA_VERSION,
			algorithmVersion: ALGORITHM_VERSION,
			provenance: 'calculator',
			startDate: input.startDate,
			weeks,
			daysPerWeek: weekdays.length,
			sessionMinutes: profile.sessionMinutes,
			days,
			input: {
				profile,
				setup,
				limitations: [...limitations].sort(),
				catalog: eligibility.eligible.map((exercise) => `${exercise.id}@${exercise.version}`).sort(),
				pausedExerciseIds: [...(input.pausedExerciseIds ?? [])].sort(),
				adjustment,
			},
		},
	};
}

function _buildSession(
	eligible: Exercise[],
	goal: Goal,
	level: FitnessLevel,
	budgetSeconds: number,
	usedThisWeek: Map<string, number>,
	previousLoad: BodyArea[],
	prescribe: (exercise: Exercise, week: number) => PlannedExercise,
): Exercise[] {
	const session: Exercise[] = [];
	let seconds = 0;

	// Second pass fills leftover time with other exercises for the same patterns.
	const slots = [...SESSION_SLOTS[goal], ...SESSION_SLOTS[goal]];

	for (const pattern of slots) {
		if (session.length >= MAX_EXERCISES_PER_DAY) {
			break;
		}

		const candidates = eligible
			.filter((exercise) => exercise.movementPattern === pattern && !session.includes(exercise))
			.map((exercise) => ({
				exercise,
				score: _score(exercise, goal, level, usedThisWeek, previousLoad),
			}))
			.sort((a, b) => b.score - a.score || a.exercise.id.localeCompare(b.exercise.id));

		for (const { exercise } of candidates) {
			// Size the slot by its heaviest week so every week of the plan fits the budget.
			const cost = _peakSeconds(exercise, prescribe);

			if (seconds + cost <= budgetSeconds) {
				session.push(exercise);
				seconds += cost;
				break;
			}
		}
	}

	return session;
}

/** Seconds the exercise takes in its heaviest week of the progression. */
function _peakSeconds(
	exercise: Exercise,
	prescribe: (exercise: Exercise, week: number) => PlannedExercise,
): number {
	return Math.max(
		...[1, 2, 3, 4].map((week) => plannedExerciseSeconds(exercise, prescribe(exercise, week))),
	);
}

function _score(
	exercise: Exercise,
	goal: Goal,
	level: FitnessLevel,
	usedThisWeek: Map<string, number>,
	previousLoad: BodyArea[],
): number {
	const levelGap = LEVEL_RANK[level] - LEVEL_RANK[exercise.fitnessLevel];
	const recoveryClash = exercise.highLoadBodyAreas.some((area) => previousLoad.includes(area));

	return (
		CATEGORY_FIT[goal][exercise.category] +
		(levelGap === 0 ? 1 : levelGap === 1 ? 0.5 : 0) -
		2 * (usedThisWeek.get(exercise.id) ?? 0) -
		(recoveryClash ? 1.5 : 0)
	);
}

/**
 * Conservative weekly progression: weeks 1–2 at the lower half of the range, week 3 at the upper
 * half, week 4 a lighter deload. No load (kg) is prescribed; the user picks a weight that matches
 * the target effort (README §6.2). Feedback can remove a set and lower the target effort (`ease`)
 * or add one set (`progress`), never more.
 */
function _prescription(
	exercise: Exercise,
	level: FitnessLevel,
	week: number,
	adjustment: LoadAdjustment = 'keep',
): PlannedExercise {
	const deload = week % 4 === 0;
	const upper = week % 4 === 3;
	const levelSets =
		level === 'beginner' && exercise.category !== 'mobility'
			? Math.min(exercise.defaultSets, 2)
			: exercise.defaultSets;
	const baseSets =
		adjustment === 'ease'
			? Math.max(1, levelSets - 1)
			: adjustment === 'progress' && exercise.category !== 'mobility'
				? Math.min(levelSets + 1, exercise.defaultSets + 1)
				: levelSets;
	const sets = deload ? Math.max(1, baseSets - 1) : baseSets;
	const rpe = Math.max(1, BASE_RPE[level] - (deload ? 1 : 0) - (adjustment === 'ease' ? 1 : 0));
	const planned: PlannedExercise = {
		exerciseId: exercise.id,
		exerciseVersion: exercise.version,
		name: exercise.name,
		movementPattern: exercise.movementPattern,
		sets,
		repsMin: null,
		repsMax: null,
		durationSeconds: null,
		restSeconds: exercise.restSeconds,
		targetRpe: rpe,
	};

	if (exercise.intensityMode === 'reps' && exercise.repRange) {
		const { min, max } = exercise.repRange;
		const middle = Math.round((min + max) / 2);

		planned.repsMin = upper ? middle : min;
		planned.repsMax = upper ? max : middle;
	} else if (exercise.durationRange) {
		const { min, max } = exercise.durationRange;
		const middle = Math.round((min + max) / 2 / 5) * 5;

		planned.durationSeconds = upper ? max : deload ? min : week % 4 === 2 ? middle : min;
	}

	return planned;
}

function _infeasible(code: InfeasibilityCode, eligibility: EligibilityResult): PlanResult {
	const counts = new Map<ExclusionReason, number>();

	for (const { reasons } of eligibility.excluded) {
		for (const reason of reasons) {
			counts.set(reason, (counts.get(reason) ?? 0) + 1);
		}
	}

	const infeasibility: Infeasibility = {
		code,
		topReasons: [...counts.entries()]
			.map(([reason, count]) => ({ reason, count }))
			.sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
			.slice(0, 5),
	};

	return { ok: false, infeasibility };
}
