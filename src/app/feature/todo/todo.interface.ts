import type { Timestamp } from 'firebase/firestore';

export const TODO_SCHEMA_VERSION = 1;
export const TODO_TITLE_MAX_LENGTH = 120;

/** `users/{uid}/todos/{todoId}`: a simple personal task (README §11). Workouts are not duplicated here. */
export interface Todo {
	id: string;
	schemaVersion: number;
	title: string;
	/** `YYYY-MM-DD` in the user's calendar, or `null` for no due date. */
	dueDate: string | null;
	done: boolean;
	createdAt: Timestamp | null;
	updatedAt: Timestamp | null;
	completedAt: Timestamp | null;
}
