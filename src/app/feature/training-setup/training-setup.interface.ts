import type { TrainingSetupInput } from '@trainup/planner';
import type { Timestamp } from 'firebase/firestore';

export const TRAINING_SETUP_SCHEMA_VERSION = 1;

/** MVP supports one active setup per user, stored under this document id. */
export const PRIMARY_SETUP_ID = 'primary';

// Equipment and space types live in the shared planner so app, planner, and server agree.
export type {
	BandResistance,
	CeilingClearance,
	CeilingPreset,
	EquipmentItem,
	EquipmentType,
	FloorPreset,
	FloorSpace,
	Surface,
	TrainingSetupInput,
	WorkoutLocation,
	YesNoUnknown,
} from '@trainup/planner';

/** `users/{uid}/trainingSetups/{setupId}` document. */
export interface TrainingSetup extends TrainingSetupInput {
	schemaVersion: number;
	active: boolean;
	updatedAt: Timestamp | null;
}
