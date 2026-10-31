import { describe, expect, it } from 'vitest';
import { average, inRange, periodRanges } from './dashboard.util';

describe('periodRanges', () => {
	it('uses Monday-first weeks', () => {
		// 2026-10-28 is a Wednesday.
		const { week } = periodRanges('2026-10-28');

		expect(week.current).toEqual({ from: '2026-10-26', to: '2026-11-01' });
		expect(week.previous).toEqual({ from: '2026-10-19', to: '2026-10-25' });
	});

	it('covers the month, with January looking back to December', () => {
		expect(periodRanges('2026-10-28').month.previous).toEqual({ from: '2026-09-01', to: '2026-09-30' });
		expect(periodRanges('2026-01-05').month.previous).toEqual({ from: '2025-12-01', to: '2025-12-31' });
		expect(periodRanges('2024-03-10').month.previous).toEqual({ from: '2024-02-01', to: '2024-02-29' });
	});

	it('covers calendar years', () => {
		const { year } = periodRanges('2026-10-28');

		expect(year.current).toEqual({ from: '2026-01-01', to: '2026-12-31' });
		expect(year.previous).toEqual({ from: '2025-01-01', to: '2025-12-31' });
	});
});

describe('helpers', () => {
	it('checks inclusive ranges and averages to one decimal', () => {
		const range = { from: '2026-10-01', to: '2026-10-31' };

		expect(inRange('2026-10-01', range) && inRange('2026-10-31', range)).toBe(true);
		expect(inRange('2026-11-01', range)).toBe(false);
		expect(average([80, 81, 82.5])).toBe(81.2);
		expect(average([])).toBeNull();
	});
});
