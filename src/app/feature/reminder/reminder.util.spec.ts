import { describe, expect, it } from 'vitest';
import { nextReminder, zonedDate, zonedTimeToUtc } from './reminder.util';

const KYIV = 'Europe/Kyiv';

describe('zonedTimeToUtc', () => {
	it('converts summer and winter local times', () => {
		expect(zonedTimeToUtc('2026-10-08', '18:00', KYIV).toISOString()).toBe('2026-10-08T15:00:00.000Z');
		expect(zonedTimeToUtc('2026-11-12', '18:00', KYIV).toISOString()).toBe('2026-11-12T16:00:00.000Z');
		expect(zonedTimeToUtc('2026-07-01', '07:30', 'America/New_York').toISOString()).toBe(
			'2026-07-01T11:30:00.000Z',
		);
	});

	it('moves a time skipped by the spring change forward by the gap', () => {
		// 2027-03-28: Kyiv clocks jump 03:00 → 04:00, so 03:30 does not exist; it fires at 04:30.
		expect(zonedTimeToUtc('2027-03-28', '03:30', KYIV).toISOString()).toBe('2027-03-28T01:30:00.000Z');
	});

	it('uses the first occurrence of a time repeated by the autumn change', () => {
		// 2026-10-25: Kyiv clocks go 04:00 → 03:00, so 03:30 happens twice (UTC 00:30 and 01:30).
		expect(zonedTimeToUtc('2026-10-25', '03:30', KYIV).toISOString()).toBe('2026-10-25T00:30:00.000Z');
	});
});

describe('nextReminder', () => {
	const schedule = { time: '18:00', days: ['mon', 'thu'] as const, timeZone: KYIV };

	it('returns later today when today is selected and the time has not passed', () => {
		// Thursday 2026-10-08, 10:00 Kyiv.
		expect(nextReminder(new Date('2026-10-08T07:00:00Z'), { ...schedule, days: [...schedule.days] })!.toISOString()).toBe(
			'2026-10-08T15:00:00.000Z',
		);
	});

	it('skips to the next selected day once today has passed', () => {
		// Thursday 19:00 Kyiv → Monday 2026-10-12 18:00.
		expect(nextReminder(new Date('2026-10-08T16:00:00Z'), { ...schedule, days: [...schedule.days] })!.toISOString()).toBe(
			'2026-10-12T15:00:00.000Z',
		);
	});

	it('keeps the local time across the daylight-saving change', () => {
		// Thursday 2026-10-22 evening → Monday 2026-10-26, after clocks moved back: 18:00 is 16:00 UTC.
		expect(nextReminder(new Date('2026-10-22T17:00:00Z'), { ...schedule, days: [...schedule.days] })!.toISOString()).toBe(
			'2026-10-26T16:00:00.000Z',
		);
	});

	it('uses the user time zone, not UTC, to decide what "today" is', () => {
		// 23:30 UTC Wednesday is already Thursday 02:30 in Kyiv.
		expect(zonedDate(Date.parse('2026-10-07T23:30:00Z'), KYIV)).toBe('2026-10-08');
	});

	it('returns null when no day is selected', () => {
		expect(nextReminder(new Date(), { ...schedule, days: [] })).toBeNull();
	});
});
