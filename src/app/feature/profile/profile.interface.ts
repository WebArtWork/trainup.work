import type { Timestamp } from 'firebase/firestore';

export const PROFILE_SCHEMA_VERSION = 1;

export type Goal = 'general-fitness' | 'build-strength' | 'improve-conditioning';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Editable profile fields, collected during onboarding and edited from Profile. */
export interface ProfileInput {
	goal: Goal | null;
	fitnessLevel: FitnessLevel | null;
	age: number | null;
	heightCm: number | null;
	weightKg: number | null;
	daysPerWeek: number;
	sessionMinutes: number;
	preferredDays: Weekday[];
}

/** `users/{uid}` document. */
export interface UserProfile extends ProfileInput {
	schemaVersion: number;
	displayName: string;
	email: string;
	photoUrl: string;
	timeZone: string;
	language: string;
	onboardingCompletedAt: Timestamp | null;
	createdAt: Timestamp | null;
	updatedAt: Timestamp | null;
}
