import { describe, expect, it } from 'vitest';
import {
	buildUserDataExport,
	chunk,
	exportFileName,
	toPlainJson,
	USER_DATA_COLLECTIONS,
} from './privacy-export.util';

const timestamp = (iso: string) => ({ toDate: () => new Date(iso) });

describe('toPlainJson', () => {
	it('turns timestamps into ISO strings at any depth', () => {
		expect(
			toPlainJson({
				createdAt: timestamp('2026-10-01T10:00:00.000Z'),
				nested: { list: [{ at: timestamp('2026-10-02T00:00:00.000Z') }] },
				plain: 5,
				none: null,
			}),
		).toEqual({
			createdAt: '2026-10-01T10:00:00.000Z',
			nested: { list: [{ at: '2026-10-02T00:00:00.000Z' }] },
			plain: 5,
			none: null,
		});
	});
});

describe('buildUserDataExport', () => {
	it('includes every collection, ids, and plain-JSON dates', () => {
		const result = buildUserDataExport(
			{ displayName: 'Alice', createdAt: timestamp('2026-10-01T10:00:00.000Z') },
			{ todos: [{ id: 't1', data: { title: 'Stretch', done: false } }] },
			new Date('2026-10-09T12:00:00.000Z'),
		);

		expect(result.app).toBe('TrainUp');
		expect(result.exportedAt).toBe('2026-10-09T12:00:00.000Z');
		expect(result.profile).toEqual({
			displayName: 'Alice',
			createdAt: '2026-10-01T10:00:00.000Z',
		});
		expect(Object.keys(result.collections)).toEqual([...USER_DATA_COLLECTIONS]);
		expect(result.collections.todos).toEqual([{ id: 't1', title: 'Stretch', done: false }]);
		expect(result.collections.sessions).toEqual([]);
		expect(() => JSON.stringify(result)).not.toThrow();
	});
});

describe('exportFileName', () => {
	it('is dated', () => {
		expect(exportFileName(new Date('2026-10-09T12:00:00.000Z'))).toBe(
			'trainup-data-2026-10-09.json',
		);
	});
});

describe('chunk', () => {
	it('splits into groups of at most the given size', () => {
		expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
		expect(chunk([], 3)).toEqual([]);
	});
});
