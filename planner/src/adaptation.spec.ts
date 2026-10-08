import { describe, expect, it } from 'vitest';
import catalogJson from '../../src/data/exercise/exercises.json';
import { nextAdjustment, recommendAdjustment } from './adaptation';
import { exclusionReasons } from './eligibility';
import { generatePlan } from './generate';
import type { Exercise, PlannerInput, SessionFeedback } from './types';
import { validatePlan } from './validate';

const catalog = catalogJson as Exercise[];

const session = (date: string, rpe: number | null, completionRate = 1, pain = false): SessionFeedback => ({
	date,
	rpe,
	completionRate,
	pain,
});

const baseInput = (overrides: Partial<PlannerInput> = {}): PlannerInput => ({
	profile: {
		goal: 'general-fitness',
		fitnessLevel: 'intermediate',
		daysPerWeek: 3,
		sessionMinutes: 45,
		preferredDays: [],
	},
	setup: {
		noEquipment: false,
		equipment: [{ type: 'dumbbells' }, { type: 'resistance-bands' }],
		customEquipment: [],
		location: 'home',
		floor: { preset: 'large', lengthM: null, widthM: null },
		ceiling: { preset: 'high', heightM: null },
		surface: 'mat',
		jumpingAllowed: 'yes',
		quietOnly: false,
		canLieDown: 'yes',
		safeAnchor: 'yes',
	},
	limitations: [],
	catalog,
	startDate: '2026-10-05',
	allowedStatuses: ['draft', 'published'],
	...overrides,
});

function plan(input: PlannerInput) {
	const result = generatePlan(input);

	if (!result.ok) {
		throw new Error(result.infeasibility.code);
	}

	expect(validatePlan(result.plan, input)).toEqual([]);

	return result.plan;
}

describe('recommendAdjustment', () => {
	it('never changes anything from fewer than three sessions', () => {
		expect(recommendAdjustment([session('2026-10-05', 10, 0.2), session('2026-10-07', 10, 0.2)])).toEqual(
			{ adjustment: 'keep', reason: 'not-enough-data', sessions: 2 },
		);
	});

	it('eases after repeated very hard or unfinished sessions', () => {
		const result = recommendAdjustment([
			session('2026-10-05', 6),
			session('2026-10-07', 9),
			session('2026-10-09', 7, 0.5),
		]);

		expect(result).toMatchObject({ adjustment: 'ease', reason: 'too-hard' });
	});

	it('does not ease after a single hard session', () => {
		expect(
			recommendAdjustment([session('2026-10-05', 6), session('2026-10-07', 6), session('2026-10-09', 10)])
				.adjustment,
		).toBe('keep');
	});

	it('progresses only after four easy, fully completed sessions', () => {
		const easy = ['2026-10-05', '2026-10-07', '2026-10-09', '2026-10-12'].map((date) => session(date, 4));

		expect(recommendAdjustment(easy).adjustment).toBe('progress');
		expect(recommendAdjustment(easy.slice(1)).adjustment).toBe('keep');
		expect(recommendAdjustment([...easy.slice(1), session('2026-10-14', null)]).adjustment).toBe('keep');
	});

	it('never progresses after reported pain (acceptance 11)', () => {
		const easyWithPain = [
			session('2026-10-05', 4),
			session('2026-10-07', 4),
			session('2026-10-09', 4, 1, true),
			session('2026-10-12', 4),
		];

		expect(recommendAdjustment(easyWithPain)).toMatchObject({ adjustment: 'keep', reason: 'pain' });
	});

	it('uses the most recent sessions regardless of input order', () => {
		const result = recommendAdjustment([
			session('2026-10-12', 9),
			session('2026-09-01', 4),
			session('2026-10-09', 9),
			session('2026-10-07', 6),
		]);

		expect(result.adjustment).toBe('ease');
	});
});

describe('paused exercises (acceptance 11)', () => {
	it('excludes an exercise paused after pain until the user resumes it', () => {
		const first = plan(baseInput());
		const pausedId = first.days[0]!.exercises[0]!.exerciseId;
		const paused = plan(baseInput({ pausedExerciseIds: [pausedId] }));
		const ids = paused.days.flatMap((day) => day.exercises.map((item) => item.exerciseId));

		expect(ids).not.toContain(pausedId);
		expect(paused.input.pausedExerciseIds).toEqual([pausedId]);
		expect(
			exclusionReasons(catalog.find((item) => item.id === pausedId)!, {
				profile: { fitnessLevel: 'intermediate' },
				setup: baseInput().setup,
				limitations: [],
				allowedStatuses: ['draft', 'published'],
				pausedExerciseIds: [pausedId],
			}),
		).toContain('paused-after-pain');
	});

	it('rejects a plan that still contains a paused exercise', () => {
		const first = plan(baseInput());
		const pausedId = first.days[0]!.exercises[0]!.exerciseId;
		const violations = validatePlan(first, baseInput({ pausedExerciseIds: [pausedId] }));

		expect(violations.map((violation) => violation.code)).toContain('ineligible-exercise');
	});
});

describe('load adjustment in generated plans', () => {
	const firstSets = (input: PlannerInput) =>
		plan(input).days[0]!.exercises.map((item) => ({ id: item.exerciseId, sets: item.sets, rpe: item.targetRpe }));

	it('ease removes one set and lowers the target effort; progress adds at most one set', () => {
		const keep = firstSets(baseInput());
		const ease = firstSets(baseInput({ adjustment: 'ease' }));
		const progress = firstSets(baseInput({ adjustment: 'progress' }));
		const keepById = new Map(keep.map((item) => [item.id, item]));

		for (const item of ease) {
			const kept = keepById.get(item.id);
			if (kept) {
				expect(item.sets).toBe(Math.max(1, kept.sets - 1));
				expect(item.rpe).toBe(kept.rpe - 1);
			}
		}

		for (const item of progress) {
			const kept = keepById.get(item.id);
			if (kept) {
				expect(item.sets - kept.sets).toBeLessThanOrEqual(1);
				expect(item.rpe).toBe(kept.rpe);
			}
		}
	});

	it('records the adjustment in the plan snapshot and still fits the session length', () => {
		for (const adjustment of ['ease', 'keep', 'progress'] as const) {
			expect(plan(baseInput({ adjustment, profile: { ...baseInput().profile, sessionMinutes: 20 } })).input.adjustment).toBe(
				adjustment,
			);
		}
	});
});

describe('nextAdjustment', () => {
	const rec = (reason: Parameters<typeof nextAdjustment>[1]['reason']) => ({
		adjustment: 'keep' as const,
		reason,
		sessions: 4,
	});

	it('moves one step at a time', () => {
		expect(nextAdjustment('keep', rec('too-hard'))).toBe('ease');
		expect(nextAdjustment('ease', rec('too-hard'))).toBe('ease');
		expect(nextAdjustment('ease', rec('too-easy'))).toBe('keep');
		expect(nextAdjustment('keep', rec('too-easy'))).toBe('progress');
		expect(nextAdjustment('progress', rec('too-easy'))).toBe('progress');
	});

	it('keeps the previous adjustment without a clear signal and never moves up after pain', () => {
		expect(nextAdjustment('ease', rec('not-enough-data'))).toBe('ease');
		expect(nextAdjustment('progress', rec('on-track'))).toBe('progress');
		expect(nextAdjustment('progress', rec('pain'))).toBe('keep');
		expect(nextAdjustment('ease', rec('pain'))).toBe('ease');
	});
});
