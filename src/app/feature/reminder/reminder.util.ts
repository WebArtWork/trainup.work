import { addDays, Weekday, weekdayOf } from '@trainup/planner';

const HOUR = 3_600_000;

/** Offset of `timeZone` from UTC at `instant`, in milliseconds (e.g. +3 h → 10 800 000). */
export function timeZoneOffset(instant: number, timeZone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).formatToParts(new Date(instant));
	const get = (type: string) => Number(parts.find((part) => part.type === type)!.value);
	const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));

	return wall - Math.floor(instant / 1000) * 1000;
}

/** Calendar date (`YYYY-MM-DD`) of `instant` in `timeZone`. */
export function zonedDate(instant: number, timeZone: string): string {
	return new Date(instant + timeZoneOffset(instant, timeZone)).toISOString().slice(0, 10);
}

/**
 * The instant at which the wall clock in `timeZone` shows `date` + `time`. Around daylight saving:
 * a time skipped by the spring change moves forward by the gap; a time that occurs twice in autumn
 * resolves to the first occurrence.
 */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
	const [year, month, day] = date.split('-').map(Number);
	const [hours, minutes] = time.split(':').map(Number);
	const wall = Date.UTC(year!, month! - 1, day!, hours!, minutes!);
	const offsetBefore = timeZoneOffset(wall - 12 * HOUR, timeZone);
	const offsetAfter = timeZoneOffset(wall + 12 * HOUR, timeZone);
	const valid = [...new Set([offsetBefore, offsetAfter])]
		.map((offset) => wall - offset)
		.filter((instant) => wall - instant === timeZoneOffset(instant, timeZone))
		.sort((a, b) => a - b);

	return new Date(valid[0] ?? wall - offsetBefore);
}

/** Next reminder strictly after `now`, or `null` when no day is selected. */
export function nextReminder(
	now: Date,
	schedule: { time: string; days: Weekday[]; timeZone: string },
): Date | null {
	if (!schedule.days.length) {
		return null;
	}

	const today = zonedDate(now.getTime(), schedule.timeZone);

	for (let offset = 0; offset <= 7; offset++) {
		const date = addDays(today, offset);

		if (schedule.days.includes(weekdayOf(date))) {
			const instant = zonedTimeToUtc(date, schedule.time, schedule.timeZone);

			if (instant.getTime() > now.getTime()) {
				return instant;
			}
		}
	}

	return null;
}

export function deviceTimeZone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
