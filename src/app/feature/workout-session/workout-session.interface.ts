import type { Timestamp } from 'firebase/firestore';

export const SESSION_SCHEMA_VERSION = 1;

export type SetStatus = 'done' | 'skipped';

export interface SessionSet {
	status: SetStatus;
	/** Reps actually done (reps-based exercises). */
	reps: number | null;
	/** Seconds actually held (time-based exercises). */
	durationSeconds: number | null;
}

export interface SessionExercise {
	exerciseId: string;
	exerciseVersion: number;
	name: string;
	sets: SessionSet[];
}

export type SessionStatus = 'completed' | 'partial';

/**
 * `users/{uid}/sessions/{planId}_{dayIndex}`. Written once when the workout is finished, so
 * completed history is never rewritten by later plan changes (README §6.4).
 */
export interface WorkoutSession {
	schemaVersion: number;
	planId: string;
	dayIndex: number;
	date: string;
	status: SessionStatus;
	durationSeconds: number;
	exercises: SessionExercise[];
	startedAt: Timestamp | null;
	completedAt: Timestamp | null;
}

export function sessionId(planId: string, dayIndex: number): string {
	return `${planId}_${dayIndex}`;
}
