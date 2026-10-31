import type { Exercise } from '@trainup/planner';
import { describe, expect, it } from 'vitest';
import { interleaveByTrainer, shownTrainer, trainerImage } from './trainer.interface';

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
