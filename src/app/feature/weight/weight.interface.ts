import type { Timestamp } from 'firebase/firestore';

export const WEIGHT_SCHEMA_VERSION = 1;
export const WEIGHT_LIMITS = { min: 20, max: 400 };

/** `users/{uid}/weights/{YYYY-MM-DD}`: one weigh-in per day, saving again replaces it. */
export interface WeightEntry {
	schemaVersion: number;
	date: string;
	kg: number;
	updatedAt: Timestamp | null;
}
