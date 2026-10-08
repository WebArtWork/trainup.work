import { describe, expect, it } from 'vitest';
import { exclusionReasons, filterExercises } from './eligibility';
import { validateExercise } from './exercise-validation';
import { generatePlan, scheduleWeekdays, weekdayOf } from './generate';
import type { Exercise, MovementPattern, PlannerInput, TrainingSetupInput } from './types';
import { validatePlan } from './validate';

// --- fixtures ------------------------------------------------------------------------------

function exercise(id: string, pattern: MovementPattern, overrides: Partial<Exercise> = {}): Exercise {
	return {
		id,
		slug: id,
		name: id,
		description: id,
		category: pattern === 'conditioning' ? 'conditioning' : pattern === 'mobility' ? 'mobility' : 'strength',
		movementPattern: pattern,
		primaryMuscles: ['full-body'],
		secondaryMuscles: [],
		equipmentRequired: [],
		requiresAdjustableBench: false,
		fitnessLevel: 'beginner',
		coordinationDifficulty: 1,
		minimumSpace: {
			lengthM: 1,
			widthM: 1,
			heightM: null,
			needsFloorContact: false,
			needsAnchor: false,
			surfaces: null,
			locations: ['home', 'gym', 'outdoors', 'other'],
		},
		impactLevel: 'none',
		noiseLevel: 'quiet',
		axialSpinalLoad: 'none',
		highLoadBodyAreas: [],
		contraindicatedAreas: [],
		warnings: [],
		intensityMode: 'reps',
		defaultSets: 3,
		repRange: { min: 8, max: 12 },
		durationRange: null,
		estimatedSetSeconds: 36,
		restSeconds: 60,
		imageUrl: null,
		steps: ['step'],
		techniqueNotes: [],
		status: 'published',
		reviewedBy: 'Reviewer',
		reviewedAt: '2026-10-01',
		version: 1,
		...overrides,
	};
}

const space = (overrides: Partial<Exercise['minimumSpace']>) => ({
	...exercise('x', 'squat').minimumSpace,
	...overrides,
});

const CATALOG: Exercise[] = [
	exercise('squat', 'squat', { contraindicatedAreas: ['knees'] }),
	exercise('lunge', 'lunge', { minimumSpace: space({ lengthM: 2, widthM: 1 }) }),
	exercise('bridge', 'hinge', { minimumSpace: space({ lengthM: 2, widthM: 1, needsFloorContact: true }) }),
	exercise('push-up', 'push-horizontal', {
		minimumSpace: space({ lengthM: 2, widthM: 1, needsFloorContact: true }),
	}),
	exercise('wall-push-up', 'push-horizontal'),
	exercise('db-row', 'pull-horizontal', { equipmentRequired: [{ anyOf: ['dumbbells'] }] }),
	exercise('band-row', 'pull-horizontal', {
		equipmentRequired: [{ anyOf: ['resistance-bands'] }],
		minimumSpace: space({ needsAnchor: true }),
	}),
	exercise('db-press', 'push-vertical', {
		equipmentRequired: [{ anyOf: ['dumbbells'] }],
		minimumSpace: space({ heightM: 2.4 }),
	}),
	exercise('pull-up', 'pull-vertical', { equipmentRequired: [{ anyOf: ['pull-up-bar'] }] }),
	exercise('incline-press', 'push-horizontal', {
		equipmentRequired: [{ anyOf: ['dumbbells'] }, { anyOf: ['bench'] }],
		requiresAdjustableBench: true,
	}),
	exercise('plank', 'core', {
		intensityMode: 'time',
		repRange: null,
		durationRange: { min: 20, max: 40 },
		estimatedSetSeconds: 40,
	}),
	exercise('jacks', 'conditioning', {
		impactLevel: 'high',
		noiseLevel: 'loud',
		minimumSpace: space({ heightM: 2.4 }),
	}),
	exercise('march', 'conditioning'),
	exercise('jump-rope', 'conditioning', {
		equipmentRequired: [{ anyOf: ['jump-rope'] }],
		minimumSpace: space({ surfaces: ['hard-floor', 'mat'] }),
	}),
	exercise('stretch', 'mobility', { defaultSets: 2 }),
	exercise('burpee', 'conditioning', { fitnessLevel: 'advanced', coordinationDifficulty: 3 }),
	exercise('draft-move', 'squat', { status: 'draft', reviewedBy: null, reviewedAt: null }),
];

const OPEN_SETUP: TrainingSetupInput = {
	noEquipment: false,
	equipment: [
		{ type: 'dumbbells', weightsKg: [4, 8] },
		{ type: 'resistance-bands', resistances: ['medium'] },
		{ type: 'pull-up-bar', safelyInstalled: true },
		{ type: 'bench', adjustable: true },
		{ type: 'jump-rope' },
	],
	customEquipment: [],
	location: 'home',
	floor: { preset: 'large', lengthM: null, widthM: null },
	ceiling: { preset: 'high', heightM: null },
	surface: 'hard-floor',
	jumpingAllowed: 'yes',
	quietOnly: false,
	canLieDown: 'yes',
	safeAnchor: 'yes',
};

function input(overrides: { setup?: Partial<TrainingSetupInput> } & Partial<PlannerInput> = {}): PlannerInput {
	const { setup, ...rest } = overrides;

	return {
		profile: {
			goal: 'general-fitness',
			fitnessLevel: 'intermediate',
			daysPerWeek: 3,
			sessionMinutes: 45,
			preferredDays: [],
		},
		setup: { ...OPEN_SETUP, ...setup },
		limitations: [],
		catalog: CATALOG,
		startDate: '2026-10-05',
		...rest,
	};
}

function plannedIds(planInput: PlannerInput): string[] {
	const result = generatePlan(planInput);

	if (!result.ok) {
		throw new Error(`expected a plan, got ${result.infeasibility.code}`);
	}

	expect(validatePlan(result.plan, planInput)).toEqual([]);

	return [...new Set(result.plan.days.flatMap((day) => day.exercises.map((item) => item.exerciseId)))];
}

function reasonsFor(id: string, planInput: PlannerInput) {
	return exclusionReasons(CATALOG.find((item) => item.id === id)!, {
		profile: planInput.profile,
		setup: planInput.setup,
		limitations: planInput.limitations,
		allowedStatuses: planInput.allowedStatuses ?? ['published'],
	});
}

// --- README §14 acceptance tests 1–7 ---------------------------------------------------------

describe('acceptance 1: no equipment', () => {
	it('only plans exercises that need no gear', () => {
		const planInput = input({ setup: { noEquipment: true, equipment: [] } });
		const ids = plannedIds(planInput);

		expect(ids.length).toBeGreaterThan(0);
		for (const id of ids) {
			expect(CATALOG.find((item) => item.id === id)!.equipmentRequired).toEqual([]);
		}
	});

	it('ignores equipment entries when "no equipment" is set', () => {
		expect(reasonsFor('db-row', input({ setup: { noEquipment: true } }))).toContain('missing-equipment');
	});

	it('requires a safely installed pull-up bar and an adjustable bench where needed', () => {
		const planInput = input({
			setup: {
				equipment: [
					{ type: 'pull-up-bar', safelyInstalled: false },
					{ type: 'dumbbells' },
					{ type: 'bench', adjustable: false },
				],
			},
		});

		expect(reasonsFor('pull-up', planInput)).toEqual(['pull-up-bar-not-secure']);
		expect(reasonsFor('incline-press', planInput)).toEqual(['bench-not-adjustable']);
	});
});

describe('acceptance 2: limited floor area', () => {
	it('never plans an exercise that needs more floor than available', () => {
		const planInput = input({ setup: { floor: { preset: 'small', lengthM: null, widthM: null } } });
		const ids = plannedIds(planInput);

		for (const id of ids) {
			const { lengthM, widthM } = CATALOG.find((item) => item.id === id)!.minimumSpace;
			expect(Math.max(lengthM, widthM)).toBeLessThanOrEqual(1.5);
		}
		expect(reasonsFor('lunge', planInput)).toContain('floor-too-small');
	});

	it('uses exact dimensions over the preset, in either orientation', () => {
		expect(
			reasonsFor('lunge', input({ setup: { floor: { preset: 'small', lengthM: 1, widthM: 2.2 } } })),
		).toEqual([]);
		expect(
			reasonsFor('lunge', input({ setup: { floor: { preset: 'large', lengthM: 1.8, widthM: 1 } } })),
		).toContain('floor-too-small');
	});
});

describe('acceptance 3: low ceiling', () => {
	it('excludes overhead exercises when clearance is low, unknown, or insufficient', () => {
		for (const preset of ['low', 'unknown', 'normal'] as const) {
			const planInput = input({ setup: { ceiling: { preset, heightM: null } } });

			expect(plannedIds(planInput)).not.toContain('db-press');
			expect(reasonsFor('db-press', planInput)[0]).toMatch(/^ceiling-/);
		}
	});

	it('accepts a measured ceiling that is high enough', () => {
		expect(reasonsFor('db-press', input({ setup: { ceiling: { preset: 'low', heightM: 2.5 } } }))).toEqual(
			[],
		);
	});
});

describe('acceptance 4: quiet apartment', () => {
	it('excludes loud exercises when quiet is required', () => {
		const planInput = input({ setup: { quietOnly: true } });

		expect(plannedIds(planInput)).not.toContain('jacks');
		expect(reasonsFor('jacks', planInput)).toContain('too-noisy');
	});

	it('excludes jumping unless explicitly allowed', () => {
		for (const jumpingAllowed of ['no', 'unknown'] as const) {
			expect(reasonsFor('jacks', input({ setup: { jumpingAllowed } }))).toContain('jumping-not-allowed');
		}
	});
});

describe('acceptance 5: missing anchor', () => {
	it('excludes anchored exercises unless a safe anchor is confirmed', () => {
		for (const safeAnchor of ['no', 'unknown'] as const) {
			const planInput = input({ setup: { safeAnchor } });

			expect(plannedIds(planInput)).not.toContain('band-row');
			expect(reasonsFor('band-row', planInput)).toEqual(['no-anchor']);
		}
	});
});

describe('acceptance 6: restrictions', () => {
	it('excludes exercises contraindicated for an active limitation', () => {
		const planInput = input({ limitations: ['knees'] });

		expect(plannedIds(planInput)).not.toContain('squat');
		expect(reasonsFor('squat', planInput)).toEqual(['limitation']);
	});

	it('excludes floor exercises unless lying down is confirmed', () => {
		expect(reasonsFor('push-up', input({ setup: { canLieDown: 'unknown' } }))).toEqual(['no-floor-contact']);
	});
});

describe('acceptance 7: short sessions', () => {
	it('fits every planned day into the session length', () => {
		for (const sessionMinutes of [15, 20, 30, 45, 60]) {
			const planInput = input({ profile: { ...input().profile, sessionMinutes } });

			plannedIds(planInput); // asserts validatePlan() reports no over-time days
		}
	});

	it('explains when not even two exercises fit', () => {
		const result = generatePlan(input({ profile: { ...input().profile, sessionMinutes: 3 } }));

		expect(result.ok).toBe(false);
		expect(!result.ok && result.infeasibility.code).toBe('session-too-short');
	});
});

// --- generator behaviour ---------------------------------------------------------------------

describe('generatePlan', () => {
	it('is deterministic', () => {
		expect(generatePlan(input())).toEqual(generatePlan(input()));
	});

	it('uses only published exercises by default', () => {
		expect(reasonsFor('draft-move', input())).toEqual(['not-published']);
		expect(reasonsFor('draft-move', input({ allowedStatuses: ['draft', 'published'] }))).toEqual([]);
	});

	it('respects fitness level', () => {
		expect(reasonsFor('burpee', input())).toEqual(['level-too-high']);
		expect(reasonsFor('burpee', input({ profile: { ...input().profile, fitnessLevel: 'advanced' } }))).toEqual(
			[],
		);
	});

	it('schedules preferred days over four weeks with correct dates', () => {
		const planInput = input({
			profile: { ...input().profile, daysPerWeek: 2, preferredDays: ['tue', 'sat'] },
		});
		const result = generatePlan(planInput);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.plan.days).toHaveLength(8);
		expect(result.plan.days.map((day) => day.weekday)).toEqual(Array(4).fill(['tue', 'sat']).flat());
		for (const day of result.plan.days) {
			expect(weekdayOf(day.date)).toBe(day.weekday);
		}
	});

	it('falls back to an even spread when preferred days do not match the count', () => {
		expect(scheduleWeekdays(3, ['mon'])).toEqual(['mon', 'wed', 'fri']);
	});

	it('deloads in week 4 and never prescribes weights', () => {
		const result = generatePlan(input());

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const firstWeek = result.plan.days.find((day) => day.week === 1)!;
		const deloadWeek = result.plan.days.find((day) => day.week === 4)!;

		expect(deloadWeek.exercises[0]!.sets).toBeLessThan(firstWeek.exercises[0]!.sets);
		expect(JSON.stringify(result.plan.days)).not.toMatch(/kg|weight/i);
	});

	it('explains infeasible setups with the main exclusion reasons', () => {
		const result = generatePlan(
			input({
				setup: { noEquipment: true, equipment: [], canLieDown: 'no', floor: { preset: null, lengthM: null, widthM: null } },
			}),
		);

		expect(result.ok).toBe(false);
		expect(!result.ok && result.infeasibility.code).toBe('no-eligible-exercises');
		expect(!result.ok && result.infeasibility.topReasons[0]!.reason).toBe('floor-unknown');
	});
});

describe('validatePlan', () => {
	it('rejects plans that include ineligible or unknown exercises', () => {
		const planInput = input({ setup: { quietOnly: true } });
		const result = generatePlan(planInput);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		const tampered = structuredClone(result.plan);
		tampered.days[0]!.exercises.push({ ...tampered.days[0]!.exercises[0]!, exerciseId: 'jacks' });
		tampered.days[1]!.exercises.push({ ...tampered.days[1]!.exercises[0]!, exerciseId: 'invented' });

		const codes = validatePlan(tampered, planInput).map((violation) => violation.code);

		expect(codes).toContain('ineligible-exercise');
		expect(codes).toContain('unknown-exercise');
	});
});

describe('validateExercise', () => {
	it('accepts complete metadata and requires a review before publishing', () => {
		expect(validateExercise(CATALOG[0]!)).toEqual([]);
		expect(validateExercise({ ...CATALOG[0]!, reviewedBy: null })).toContain(
			'published exercises need a review',
		);
	});

	it('never selects exercises with incomplete metadata', () => {
		const broken = { ...CATALOG[0]!, id: 'broken', steps: [] };
		const result = filterExercises([broken], {
			profile: { fitnessLevel: 'advanced' },
			setup: OPEN_SETUP,
			limitations: [],
			allowedStatuses: ['published'],
		});

		expect(result.eligible).toEqual([]);
		expect(result.excluded[0]!.reasons).toContain('incomplete-metadata');
	});
});
