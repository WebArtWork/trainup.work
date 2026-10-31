import { addDays, WEEKDAYS, weekdayOf } from '@trainup/planner';

export type PeriodKey = 'week' | 'month' | 'year';

/** Inclusive `YYYY-MM-DD` range. */
export interface DateRange {
	from: string;
	to: string;
}

export interface PeriodPair {
	current: DateRange;
	previous: DateRange;
}

const pad = (value: number) => String(value).padStart(2, '0');

function monthRange(year: number, month: number): DateRange {
	const last = new Date(Date.UTC(year, month, 0)).getUTCDate();

	return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${pad(last)}` };
}

/** This and the previous week (Monday first), month and calendar year, around `today`. */
export function periodRanges(today: string): Record<PeriodKey, PeriodPair> {
	const [year, month] = today.split('-').map(Number) as [number, number];
	const weekStart = addDays(today, -WEEKDAYS.indexOf(weekdayOf(today)));
	const previousMonth = month === 1 ? monthRange(year - 1, 12) : monthRange(year, month - 1);

	return {
		week: {
			current: { from: weekStart, to: addDays(weekStart, 6) },
			previous: { from: addDays(weekStart, -7), to: addDays(weekStart, -1) },
		},
		month: { current: monthRange(year, month), previous: previousMonth },
		year: {
			current: { from: `${year}-01-01`, to: `${year}-12-31` },
			previous: { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` },
		},
	};
}

export function inRange(date: string, range: DateRange): boolean {
	return date >= range.from && date <= range.to;
}

/** Average of the values, rounded to one decimal; `null` when there are none. */
export function average(values: number[]): number | null {
	return values.length
		? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
		: null;
}
