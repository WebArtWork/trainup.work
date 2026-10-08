import { LIMITATION_NOTE_MAX_LENGTH, LimitationInput } from '../limitation/limitation.interface';
import { PROFILE_LIMITS } from '../profile/profile.const';
import { ProfileInput } from '../profile/profile.interface';
import { SPACE_LIMITS } from '../training-setup/training-setup.const';
import { TrainingSetupInput } from '../training-setup/training-setup.interface';

/** Pure step validators shared by onboarding, profile editing, and unit tests. */

export function isInRange(value: number | null, limits: { min: number; max: number }): boolean {
	return value === null || (Number.isFinite(value) && value >= limits.min && value <= limits.max);
}

export function isGoalComplete(profile: ProfileInput): boolean {
	return profile.goal !== null;
}

export function isScheduleComplete(profile: ProfileInput): boolean {
	return (
		profile.fitnessLevel !== null &&
		profile.daysPerWeek >= 1 &&
		profile.daysPerWeek <= 7 &&
		profile.sessionMinutes > 0 &&
		(profile.preferredDays.length === 0 ||
			profile.preferredDays.length === profile.daysPerWeek) &&
		isInRange(profile.age, PROFILE_LIMITS.age) &&
		isInRange(profile.heightCm, PROFILE_LIMITS.heightCm) &&
		isInRange(profile.weightKg, PROFILE_LIMITS.weightKg)
	);
}

export function isEquipmentComplete(setup: TrainingSetupInput): boolean {
	return setup.noEquipment !== setup.equipment.length > 0;
}

export function isSpaceComplete(setup: TrainingSetupInput): boolean {
	const hasFloor =
		setup.floor.preset !== null ||
		(setup.floor.lengthM !== null && setup.floor.widthM !== null);

	return (
		setup.location !== null &&
		hasFloor &&
		isInRange(setup.floor.lengthM, SPACE_LIMITS.lengthM) &&
		isInRange(setup.floor.widthM, SPACE_LIMITS.widthM) &&
		isInRange(setup.ceiling.heightM, SPACE_LIMITS.heightM)
	);
}

export function isLimitationsComplete(limitations: LimitationInput[]): boolean {
	return limitations.every((limitation) => limitation.note.length <= LIMITATION_NOTE_MAX_LENGTH);
}

export function pickProfileInput(profile: ProfileInput): ProfileInput {
	return {
		goal: profile.goal,
		fitnessLevel: profile.fitnessLevel,
		age: profile.age,
		heightCm: profile.heightCm,
		weightKg: profile.weightKg,
		daysPerWeek: profile.daysPerWeek,
		sessionMinutes: profile.sessionMinutes,
		preferredDays: [...profile.preferredDays],
	};
}

export function pickSetupInput(setup: TrainingSetupInput): TrainingSetupInput {
	return {
		noEquipment: setup.noEquipment,
		equipment: setup.equipment.map((item) => ({ ...item })),
		customEquipment: [...setup.customEquipment],
		location: setup.location,
		floor: { ...setup.floor },
		ceiling: { ...setup.ceiling },
		surface: setup.surface,
		jumpingAllowed: setup.jumpingAllowed,
		quietOnly: setup.quietOnly,
		canLieDown: setup.canLieDown,
		safeAnchor: setup.safeAnchor,
	};
}
