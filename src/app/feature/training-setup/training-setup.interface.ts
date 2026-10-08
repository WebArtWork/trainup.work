import type { Timestamp } from 'firebase/firestore';

export const TRAINING_SETUP_SCHEMA_VERSION = 1;

/** MVP supports one active setup per user, stored under this document id. */
export const PRIMARY_SETUP_ID = 'primary';

export type EquipmentType =
	| 'mat'
	| 'yoga-blocks'
	| 'dumbbells'
	| 'resistance-bands'
	| 'kettlebell'
	| 'bench'
	| 'pull-up-bar'
	| 'barbell'
	| 'rack'
	| 'jump-rope'
	| 'step-platform'
	| 'cardio-machine';

export type BandResistance = 'light' | 'medium' | 'heavy';

export interface EquipmentItem {
	type: EquipmentType;
	/** Dumbbells and kettlebells: the weights available, in kilograms. */
	weightsKg?: number[];
	/** Resistance bands: the resistances available. */
	resistances?: BandResistance[];
	/** Bench: whether the backrest is adjustable. */
	adjustable?: boolean;
	/** Pull-up bar: only usable when the user confirms a safe installation. */
	safelyInstalled?: boolean;
}

export type WorkoutLocation = 'home' | 'gym' | 'outdoors' | 'other';

export type FloorPreset = 'small' | 'medium' | 'large';

export type CeilingPreset = 'low' | 'normal' | 'high' | 'unknown';

export type Surface = 'hard-floor' | 'carpet' | 'mat' | 'grass' | 'other' | 'unknown';

export type YesNoUnknown = 'yes' | 'no' | 'unknown';

export interface FloorSpace {
	preset: FloorPreset | null;
	/** Clear usable length, excluding furniture. `null` when not measured. */
	lengthM: number | null;
	widthM: number | null;
}

export interface CeilingClearance {
	preset: CeilingPreset;
	heightM: number | null;
}

/**
 * Equipment and usable space. Unknown answers stay explicit (`unknown`, `null`) so the
 * planner never treats them as confirmed suitable (README §4.2 safety default).
 */
export interface TrainingSetupInput {
	noEquipment: boolean;
	equipment: EquipmentItem[];
	/** Free-text items for the user's reference; never matched to exercise requirements. */
	customEquipment: string[];
	location: WorkoutLocation | null;
	floor: FloorSpace;
	ceiling: CeilingClearance;
	surface: Surface;
	jumpingAllowed: YesNoUnknown;
	quietOnly: boolean;
	canLieDown: YesNoUnknown;
	safeAnchor: YesNoUnknown;
}

/** `users/{uid}/trainingSetups/{setupId}` document. */
export interface TrainingSetup extends TrainingSetupInput {
	schemaVersion: number;
	active: boolean;
	updatedAt: Timestamp | null;
}
