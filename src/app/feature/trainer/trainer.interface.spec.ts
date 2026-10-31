import type { Exercise } from '@trainup/planner';
import { describe, expect, it } from 'vitest';
import { assignTrainers, interleaveByTrainer, shownTrainer, trainerImage } from './trainer.interface';

const exercise = (id: string, trainers?: Exercise['trainers']) =>
	({ id, trainers, imageUrl: `/exercises/${id}.jpg` }) as Exercise;

describe('trainer helpers', () => {
	it('shows a shared exercise once, with the first trainer unless one is chosen', () => {
		const shared = exercise('squat');

		expect(shownTrainer(shared, 'all')).toBe('female');
		expect(shownTrainer(shared, 'male')).toBe('male');
		expect(shownTrainer(exercise('lift', ['male']), 'female')).toBe('male');
	});

	it('uses the catalog image for the girl and the male folder for the boy', () => {
		expect(trainerImage(exercise('squat'), 'female')).toBe('/exercises/squat.jpg');
		expect(trainerImage(exercise('squat'), 'male')).toBe('/exercises/male/squat.jpg');
		expect(trainerImage(exercise('custom-a'), 'male')).toBe('/exercises/custom-a.jpg');
	});

	it('gives the trainers turns by position, even for shared exercises', () => {
		const items = ['a', 'b', 'c', 'd'].map((id) => ({ exercise: exercise(id) }));

		expect(assignTrainers(items, 'all').map((item) => item.trainer)).toEqual(['female', 'male', 'female', 'male']);
		expect(assignTrainers(items, 'male').map((item) => item.trainer)).toEqual(['male', 'male', 'male', 'male']);
		expect(assignTrainers([{ exercise: exercise('x', ['male']) }], 'all')[0]!.trainer).toBe('male');
	});

	it('alternates trainer one, trainer two, then shared exercises', () => {
		const items = [
			exercise('f1', ['female']),
			exercise('f2', ['female']),
			exercise('m1', ['male']),
			exercise('s1'),
			exercise('s2'),
		].map((item) => ({ exercise: item }));

		expect(interleaveByTrainer(items).map((item) => item.exercise.id)).toEqual([
			'f1',
			'm1',
			's1',
			'f2',
			's2',
		]);
	});
});
