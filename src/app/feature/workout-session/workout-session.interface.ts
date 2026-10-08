import type { BodyArea } from '@trainup/planner';
import type { Timestamp } from 'firebase/firestore';

/** 2: adds `rpe`, `pain`, `notes` (Phase 3). Version 1 documents have none of them. */
export const SESSION_SCHEMA_VERSION = 2;

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

export type PainArea = BodyArea | 'other';

/** Pain or discomfort reported during or after the workout (README §6.4). */
export interface SessionPain {
	areas: PainArea[];
	/** Exercises that caused it; they are paused until the user resumes them. */
	exerciseIds: string[];
}

export const SESSION_NOTES_MAX_LENGTH = 500;

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
	/** Session RPE 1–10; `null` when skipped (or a version 1 document). */
	rpe?: number | null;
	pain?: SessionPain | null;
	notes?: string;
	startedAt: Timestamp | null;
	completedAt: Timestamp | null;
}

export function sessionId(planId: string, dayIndex: number): string {
	return `${planId}_${dayIndex}`;
}
