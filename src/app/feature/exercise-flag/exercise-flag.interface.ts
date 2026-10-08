import type { Timestamp } from 'firebase/firestore';
import type { PainArea } from '../workout-session/workout-session.interface';

export const EXERCISE_FLAG_SCHEMA_VERSION = 1;

/**
 * `users/{uid}/exerciseFlags/{exerciseId}`: an exercise paused after reported pain. The planner
 * skips it and the workout runner won't start it until the user explicitly resumes it.
 */
export interface ExerciseFlag {
	schemaVersion: number;
	exerciseId: string;
	reason: 'pain';
	areas: PainArea[];
	planId: string;
	sessionDate: string;
	active: boolean;
	createdAt: Timestamp | null;
	resolvedAt: Timestamp | null;
}
