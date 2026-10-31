import { describe, expect, it } from 'vitest';
import catalogJson from '../../src/data/exercise/exercises.json';
import { validateExercise } from './exercise-validation';
import { generatePlan } from './generate';
import type { Exercise, FitnessLevel, Goal, PlannerInput, TrainingSetupInput } from './types';
import { validatePlan } from './validate';

// The real catalog in src/data: every plan below is built from it.
const catalog = catalogJson as Exercise[];

const SETUPS: Record<string, TrainingSetupInput> = {
	'small apartment, no equipment, quiet': {
		noEquipment: true,
		equipment: [],
		customEquipment: [],
		location: 'home',
		floor: { preset: 'medium', lengthM: null, widthM: null },
		ceiling: { preset: 'normal', heightM: null },
		surface: 'carpet',
		jumpingAllowed: 'no',
		quietOnly: true,
		canLieDown: 'yes',
		safeAnchor: 'unknown',
	},
	'home with dumbbells and bands': {
		noEquipment: false,
		equipment: [
			{ type: 'dumbbells', weightsKg: [4, 8, 12] },
			{ type: 'resistance-bands', resistances: ['light', 'medium'] },
			{ type: 'mat' },
		],
		customEquipment: [],
		location: 'home',
		floor: { preset: 'large', lengthM: null, widthM: null },
		ceiling: { preset: 'normal', heightM: null },
		surface: 'mat',
		jumpingAllowed: 'unknown',
		quietOnly: false,
		canLieDown: 'yes',
		safeAnchor: 'yes',
	},
	'outdoors, park bench and bar': {
		noEquipment: false,
		equipment: [{ type: 'bench', adjustable: false }, { type: 'pull-up-bar', safelyInstalled: true }],
		customEquipment: [],
		location: 'outdoors',
		floor: { preset: 'large', lengthM: null, widthM: null },
		ceiling: { preset: 'high', heightM: null },
		surface: 'grass',
		jumpingAllowed: 'yes',
		quietOnly: false,
		canLieDown: 'yes',
		safeAnchor: 'yes',
	},
	'gym, everything': {
		noEquipment: false,
		equipment: [
			{ type: 'dumbbells' },
			{ type: 'kettlebell' },
			{ type: 'resistance-bands' },
			{ type: 'bench', adjustable: true },
			{ type: 'pull-up-bar', safelyInstalled: true },
			{ type: 'barbell' },
			{ type: 'rack' },
			{ type: 'jump-rope' },
			{ type: 'step-platform' },
			{ type: 'cardio-machine' },
			{ type: 'machines' },
			{ type: 'cable-machine' },
		],
		customEquipment: [],
		location: 'gym',
		floor: { preset: 'large', lengthM: 6, widthM: 4 },
		ceiling: { preset: 'high', heightM: null },
		surface: 'hard-floor',
		jumpingAllowed: 'yes',
		quietOnly: false,
		canLieDown: 'yes',
		safeAnchor: 'yes',
	},
};

describe('exercise catalog (src/data/exercise/exercises.json)', () => {
	it('has unique ids', () => {
		const ids = catalog.map((exercise) => exercise.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	it.each(catalog.map((exercise) => [exercise.id, exercise] as const))(
		'%s has complete metadata',
		(_, exercise) => {
			expect(validateExercise(exercise)).toEqual([]);
		},
	);

	const goals: Goal[] = ['general-fitness', 'build-strength', 'improve-conditioning'];
	const levels: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

	for (const [name, setup] of Object.entries(SETUPS)) {
		it(`builds valid plans for every goal and level: ${name}`, () => {
			for (const goal of goals) {
				for (const level of levels) {
					const input: PlannerInput = {
						profile: {
							goal,
							fitnessLevel: level,
							daysPerWeek: 3,
							sessionMinutes: 30,
							preferredDays: [],
						},
						setup,
						limitations: [],
						catalog,
						startDate: '2026-10-05',
					};
					const result = generatePlan(input);

					expect(result.ok, `${goal}/${level}`).toBe(true);
					if (result.ok) {
						expect(validatePlan(result.plan, input), `${goal}/${level}`).toEqual([]);
					}
				}
			}
		});
	}

	describe('location shapes the workouts', () => {
		const idsFor = (location: 'gym' | 'outdoors', goal: Goal) => {
			const setup = SETUPS[location === 'gym' ? 'gym, everything' : 'outdoors, park bench and bar']!;
			const result = generatePlan({
				profile: { goal, fitnessLevel: 'intermediate', daysPerWeek: 3, sessionMinutes: 45, preferredDays: [] },
				setup,
				limitations: [],
				catalog,
				startDate: '2026-10-05',
			});

			expect(result.ok).toBe(true);

			return result.ok ? new Set(result.plan.days.flatMap((day) => day.exercises.map((e) => e.exerciseId))) : new Set<string>();
		};
		const only = (location: string) =>
			new Set(catalog.filter((e) => e.minimumSpace.locations.join() === location).map((e) => e.id));

		it('puts gym-only exercises into gym plans and none into outdoor plans', () => {
			const gym = [...idsFor('gym', 'build-strength')].filter((id) => only('gym').has(id));
			const outdoors = [...idsFor('outdoors', 'build-strength')].filter((id) => only('gym').has(id));

			expect(gym.length).toBeGreaterThanOrEqual(3);
			expect(outdoors).toEqual([]);
		});

		it('puts outdoor-only exercises into outdoor plans and none into gym plans', () => {
			const outdoors = [...idsFor('outdoors', 'general-fitness')].filter((id) => only('outdoors').has(id));
			const gym = [...idsFor('gym', 'general-fitness')].filter((id) => only('outdoors').has(id));

			expect(outdoors.length).toBeGreaterThanOrEqual(3);
			expect(gym).toEqual([]);
		});
	});
});
