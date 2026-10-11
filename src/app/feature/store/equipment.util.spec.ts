import { describe, expect, it } from 'vitest';
import { EMPTY_TRAINING_SETUP_INPUT } from '../training-setup/training-setup.const';
import { addPurchasedEquipment, mergeEquipmentItem } from './equipment.util';

describe('mergeEquipmentItem', () => {
	it('adds a new type', () => {
		expect(mergeEquipmentItem([], { type: 'mat' })).toEqual([{ type: 'mat' }]);
	});

	it('merges dumbbell weights without duplicates, sorted', () => {
		const current = [{ type: 'dumbbells' as const, weightsKg: [10] }];

		expect(mergeEquipmentItem(current, { type: 'dumbbells', weightsKg: [5, 10] })).toEqual([
			{ type: 'dumbbells', weightsKg: [5, 10] },
		]);
	});

	it('merges band resistances and keeps a confirmed safe installation', () => {
		const current = [
			{ type: 'resistance-bands' as const, resistances: ['light' as const] },
			{ type: 'pull-up-bar' as const, safelyInstalled: true },
		];
		const next = mergeEquipmentItem(current, {
			type: 'resistance-bands',
			resistances: ['medium'],
		});

		expect(next[0]).toEqual({ type: 'resistance-bands', resistances: ['light', 'medium'] });
		expect(mergeEquipmentItem(next, { type: 'pull-up-bar' })[1]).toEqual({
			type: 'pull-up-bar',
			safelyInstalled: true,
		});
	});

	it('does not mark a purchased pull-up bar as safely installed', () => {
		expect(mergeEquipmentItem([], { type: 'pull-up-bar' })).toEqual([{ type: 'pull-up-bar' }]);
	});
});

describe('addPurchasedEquipment', () => {
	it('clears "no equipment" and does not mutate the setup', () => {
		const setup = { ...EMPTY_TRAINING_SETUP_INPUT, noEquipment: true, equipment: [] };
		const result = addPurchasedEquipment(setup, [{ type: 'mat' }, { type: 'jump-rope' }]);

		expect(result.noEquipment).toBe(false);
		expect(result.equipment.map((item) => item.type)).toEqual(['mat', 'jump-rope']);
		expect(setup.equipment).toEqual([]);
	});
});
