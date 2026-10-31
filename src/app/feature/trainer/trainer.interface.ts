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
 * Which trainer shows each exercise in a list. A chosen trainer shows everything; with "all" the
 * trainers take turns by position (first, second, first, second...), and an exercise only one of
 * them does keeps its own trainer.
 */
export function assignTrainers<T extends { exercise: Exercise }>(
	items: T[],
	choice: TrainerChoice,
): (T & { trainer: Trainer })[] {
	return items.map((item, index) => {
		const turn: Trainer = index % 2 === 0 ? 'female' : 'male';
		const trainers = exerciseTrainers(item.exercise);
		const wanted = choice === 'all' ? turn : choice;

		return { ...item, trainer: trainers.includes(wanted) ? wanted : trainers[0]! };
	});
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
