import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE_INPUT } from '../profile/profile.const';
import { ProfileInput } from '../profile/profile.interface';
import { EMPTY_TRAINING_SETUP_INPUT } from '../training-setup/training-setup.const';
import { TrainingSetupInput } from '../training-setup/training-setup.interface';
import {
	isEquipmentComplete,
	isGoalComplete,
	isLimitationsComplete,
	isScheduleComplete,
	isSpaceComplete,
	pickProfileInput,
} from './account.util';

const profile = (changes: Partial<ProfileInput> = {}): ProfileInput => ({
	...EMPTY_PROFILE_INPUT,
	goal: 'build-strength',
	fitnessLevel: 'beginner',
	...changes,
});

const setup = (changes: Partial<TrainingSetupInput> = {}): TrainingSetupInput => ({
	...EMPTY_TRAINING_SETUP_INPUT,
	location: 'home',
	floor: { preset: 'medium', lengthM: null, widthM: null },
	...changes,
});

describe('isGoalComplete', () => {
	it('requires a goal', () => {
		expect(isGoalComplete(profile({ goal: null }))).toBe(false);
		expect(isGoalComplete(profile())).toBe(true);
	});
});

describe('isScheduleComplete', () => {
	it('requires a fitness level', () => {
		expect(isScheduleComplete(profile({ fitnessLevel: null }))).toBe(false);
		expect(isScheduleComplete(profile())).toBe(true);
	});

	it('accepts no preferred days or exactly one per weekly session', () => {
		expect(isScheduleComplete(profile({ daysPerWeek: 3, preferredDays: [] }))).toBe(true);
		expect(
			isScheduleComplete(profile({ daysPerWeek: 3, preferredDays: ['mon', 'wed', 'fri'] })),
		).toBe(true);
		expect(isScheduleComplete(profile({ daysPerWeek: 3, preferredDays: ['mon', 'wed'] }))).toBe(
			false,
		);
	});

	it('treats body data as optional but range-checked', () => {
		expect(isScheduleComplete(profile({ age: null, heightCm: null, weightKg: null }))).toBe(
			true,
		);
		expect(isScheduleComplete(profile({ age: 30, heightCm: 180, weightKg: 80 }))).toBe(true);
		expect(isScheduleComplete(profile({ age: 12 }))).toBe(false);
		expect(isScheduleComplete(profile({ weightKg: 400 }))).toBe(false);
	});
});

describe('isEquipmentComplete', () => {
	it('requires an explicit answer: no equipment or at least one item', () => {
		expect(isEquipmentComplete(setup())).toBe(false);
		expect(isEquipmentComplete(setup({ noEquipment: true }))).toBe(true);
		expect(isEquipmentComplete(setup({ equipment: [{ type: 'mat' }] }))).toBe(true);
	});

	it('rejects contradictory answers', () => {
		expect(
			isEquipmentComplete(setup({ noEquipment: true, equipment: [{ type: 'mat' }] })),
		).toBe(false);
	});
});

describe('isSpaceComplete', () => {
	it('requires a location and a floor size', () => {
		expect(isSpaceComplete(setup())).toBe(true);
		expect(isSpaceComplete(setup({ location: null }))).toBe(false);
		expect(
			isSpaceComplete(setup({ floor: { preset: null, lengthM: null, widthM: null } })),
		).toBe(false);
	});

	it('accepts exact dimensions instead of a preset, but only both together', () => {
		expect(isSpaceComplete(setup({ floor: { preset: null, lengthM: 2.5, widthM: 2 } }))).toBe(
			true,
		);
		expect(
			isSpaceComplete(setup({ floor: { preset: null, lengthM: 2.5, widthM: null } })),
		).toBe(false);
	});

	it('range-checks measurements', () => {
		expect(
			isSpaceComplete(setup({ floor: { preset: 'small', lengthM: 0.1, widthM: 1 } })),
		).toBe(false);
		expect(isSpaceComplete(setup({ ceiling: { preset: 'unknown', heightM: 0.5 } }))).toBe(
			false,
		);
	});

	it('keeps unknown answers unknown by default', () => {
		const empty = EMPTY_TRAINING_SETUP_INPUT;

		expect(empty.canLieDown).toBe('unknown');
		expect(empty.jumpingAllowed).toBe('unknown');
		expect(empty.safeAnchor).toBe('unknown');
		expect(empty.ceiling.preset).toBe('unknown');
	});
});

describe('isLimitationsComplete', () => {
	it('accepts no limitations and limits note length', () => {
		expect(isLimitationsComplete([])).toBe(true);
		expect(isLimitationsComplete([{ area: 'knees', note: 'біль при присіданні' }])).toBe(true);
		expect(isLimitationsComplete([{ area: 'knees', note: 'x'.repeat(301) }])).toBe(false);
	});
});

describe('pickProfileInput', () => {
	it('drops identity and timestamp fields before writing', () => {
		const stored = { ...profile(), email: 'a@b.c', createdAt: null } as ProfileInput;

		expect(Object.keys(pickProfileInput(stored)).sort()).toEqual(
			Object.keys(EMPTY_PROFILE_INPUT).sort(),
		);
	});
});
