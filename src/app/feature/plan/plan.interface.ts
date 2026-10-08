import type { WorkoutPlan } from '@trainup/planner';
import type { Timestamp } from 'firebase/firestore';

export type PlanStatus = 'active' | 'superseded';

/** `users/{uid}/plans/{planId}`. Plans are immutable except for `status`; regeneration adds a new one. */
export interface StoredPlan extends WorkoutPlan {
	id: string;
	status: PlanStatus;
	createdAt: Timestamp | null;
}
