import { describe, expect, it } from 'vitest';
import { EQUIPMENT_OPTIONS } from '../training-setup/training-setup.const';
import { STORE_PRODUCTS } from './store.data';

describe('store catalog', () => {
	it('has unique ids and sensible prices and stock', () => {
		const ids = STORE_PRODUCTS.map((product) => product.id);

		expect(new Set(ids).size).toBe(ids.length);
		expect(STORE_PRODUCTS.every((product) => product.price > 0 && product.stock >= 0)).toBe(true);
	});

	it('maps every equipment product to a known equipment type; accessories map to none', () => {
		const known = new Set(EQUIPMENT_OPTIONS.map((option) => option.value));

		for (const product of STORE_PRODUCTS) {
			expect(!product.equipment || known.has(product.equipment.type), product.id).toBe(true);
		}
	});
});
