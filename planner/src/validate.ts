import { exclusionReasons } from './eligibility';
import { plannedExerciseSeconds } from './generate';
import type { PlannerInput, PlanViolation, WorkoutPlan } from './types';

/**
 * Re-checks a plan against the hard constraints, independently of how it was produced. Every
 * planning path (calculator now, AI later) must pass this before a plan is saved (README §6.3).
 */
export function validatePlan(plan: WorkoutPlan, input: PlannerInput): PlanViolation[] {
	const violations: PlanViolation[] = [];
	const context = {
		profile: input.profile,
		setup: input.setup,
		limitations: input.limitations,
		allowedStatuses: input.allowedStatuses ?? ['published'],
		pausedExerciseIds: input.pausedExerciseIds ?? [],
	};
	const budgetSeconds = input.profile.sessionMinutes * 60;
	const daysPerWeek = new Map<number, number>();

	if (!plan.days.length) {
		violations.push({ code: 'empty-day', dayIndex: null, exerciseId: null, detail: 'plan has no days' });
	}

	for (const day of plan.days) {
		const seen = new Set<string>();
		let seconds = 0;

		daysPerWeek.set(day.week, (daysPerWeek.get(day.week) ?? 0) + 1);

		if (!day.exercises.length) {
			violations.push({ code: 'empty-day', dayIndex: day.index, exerciseId: null, detail: 'no exercises' });
		}

		for (const planned of day.exercises) {
			const exercise = input.catalog.find((item) => item.id === planned.exerciseId);

			if (!exercise) {
				violations.push({
					code: 'unknown-exercise',
					dayIndex: day.index,
					exerciseId: planned.exerciseId,
					detail: 'not in the catalog',
				});
				continue;
			}

			const reasons = exclusionReasons(exercise, context);

			if (reasons.length) {
				violations.push({
					code: 'ineligible-exercise',
					dayIndex: day.index,
					exerciseId: planned.exerciseId,
					detail: reasons.join(', '),
				});
			}

			if (seen.has(planned.exerciseId)) {
				violations.push({
					code: 'duplicate-in-day',
					dayIndex: day.index,
					exerciseId: planned.exerciseId,
					detail: 'exercise repeats within the day',
				});
			}

			seen.add(planned.exerciseId);
			seconds += plannedExerciseSeconds(exercise, planned);
		}

		if (seconds > budgetSeconds) {
			violations.push({
				code: 'over-time-budget',
				dayIndex: day.index,
				exerciseId: null,
				detail: `${Math.ceil(seconds / 60)} min > ${input.profile.sessionMinutes} min`,
			});
		}
	}

	for (const [week, count] of daysPerWeek) {
		if (count > input.profile.daysPerWeek) {
			violations.push({
				code: 'wrong-day-count',
				dayIndex: null,
				exerciseId: null,
				detail: `week ${week} has ${count} days, limit ${input.profile.daysPerWeek}`,
			});
		}
	}

	return violations;
}
