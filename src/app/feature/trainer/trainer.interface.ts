import type { Exercise, Trainer } from '@trainup/planner';
import { ChoiceOption } from '../profile/profile.const';

export type { Trainer } from '@trainup/planner';

export type TrainerChoice = Trainer | 'all';

export const TRAINERS: Trainer[] = ['female', 'male'];

export const TRAINER_OPTIONS: ChoiceOption<TrainerChoice>[] = [
	{ value: 'all', label: 'Усі' },
	{ value: 'female', label: 'Дівчина' },
	{ value: 'male', label: 'Хлопець' },
];

/** Trainers who demonstrate an exercise; a record without `trainers` is shared by both. */
export function exerciseTrainers(exercise: Exercise): Trainer[] {
	return exercise.trainers?.length ? exercise.trainers : TRAINERS;
}

/**
 * Whose picture to show: the chosen trainer, or (when "all") the first trainer who does the
 * exercise, so a shared exercise appears once.
 */
export function shownTrainer(exercise: Exercise, choice: TrainerChoice): Trainer {
	const trainers = exerciseTrainers(exercise);

	return choice !== 'all' && trainers.includes(choice) ? choice : trainers[0]!;
}

/**
 * Picture of the exercise for a trainer. The girl's pictures are the catalog images; the boy's
 * live in `src/assets/exercises/male/<id>.jpg`. A missing file shows the placeholder.
 */
export function trainerImage(exercise: Exercise, trainer: Trainer): string | null {
	return trainer === 'male' && !exercise.id.startsWith('custom-')
		? `/exercises/male/${exercise.id}.jpg`
		: exercise.imageUrl;
}

/**
 * Orders exercises one by one across the trainers, so the list starts with the first trainer's
 * exercise, then the second trainer's, and so on. Exercises both trainers do come last in turn.
 */
export function interleaveByTrainer<T extends { exercise: Exercise }>(items: T[]): T[] {
	const pools: T[][] = [[], [], []];

	for (const item of items) {
		const trainers = exerciseTrainers(item.exercise);

		pools[trainers.length > 1 ? 2 : trainers[0] === 'female' ? 0 : 1]!.push(item);
	}

	const result: T[] = [];

	for (let i = 0; result.length < items.length; i++) {
		for (const pool of pools) {
			if (pool[i]) {
				result.push(pool[i]!);
			}
		}
	}

	return result;
}
