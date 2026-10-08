import type { BodyArea } from '@trainup/planner';
import type { Timestamp } from 'firebase/firestore';
import { ChoiceOption } from '../profile/profile.const';

export const LIMITATION_SCHEMA_VERSION = 1;

export type { BodyArea } from '@trainup/planner';

export interface LimitationInput {
	area: BodyArea;
	note: string;
}

/**
 * `users/{uid}/limitations/{area}` document. Deselected areas are kept with `active: false`
 * so history stays intact; only the minimal data needed for exercise screening is stored.
 */
export interface Limitation extends LimitationInput {
	schemaVersion: number;
	active: boolean;
	updatedAt: Timestamp | null;
}

export const BODY_AREA_OPTIONS: ChoiceOption<BodyArea>[] = [
	{ value: 'neck', label: 'Шия' },
	{ value: 'shoulders', label: 'Плечі' },
	{ value: 'wrists', label: 'Зап’ястя' },
	{ value: 'lower-back', label: 'Поперек' },
	{ value: 'hips', label: 'Кульшові суглоби' },
	{ value: 'knees', label: 'Коліна' },
	{ value: 'ankles', label: 'Гомілкостопи' },
];

export const LIMITATION_NOTE_MAX_LENGTH = 300;
