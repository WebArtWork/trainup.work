import type { Weekday } from '@trainup/planner';
import type { Timestamp } from 'firebase/firestore';

export const REMINDER_SCHEMA_VERSION = 1;
export const WORKOUT_REMINDER_ID = 'workout';

/** `users/{uid}/reminders/workout`: when to remind about workouts, in the user's local time. */
export interface WorkoutReminder {
	schemaVersion: number;
	type: 'workout';
	enabled: boolean;
	/** Local wall-clock time, `HH:MM` (24 h). */
	time: string;
	days: Weekday[];
	/** IANA time zone the time is interpreted in, e.g. `Europe/Kyiv`. */
	timeZone: string;
	updatedAt: Timestamp | null;
}
