import { validateExercise } from './exercise-validation';
import type {
	BodyArea,
	CeilingPreset,
	EligibilityResult,
	EquipmentType,
	ExclusionReason,
	Exercise,
	ExerciseStatus,
	FitnessLevel,
	FloorPreset,
	PlannerProfile,
	TrainingSetupInput,
} from './types';

const LEVEL_RANK: Record<FitnessLevel, number> = { beginner: 1, intermediate: 2, advanced: 3 };

/** Floor sizes the presets promise (the lower end of what the user picked). */
export const FLOOR_PRESET_SIZES: Record<FloorPreset, { lengthM: number; widthM: number }> = {
	small: { lengthM: 1.5, widthM: 1 },
	medium: { lengthM: 2, widthM: 1.5 },
	large: { lengthM: 3, widthM: 2 },
};

/** Guaranteed clearance per ceiling preset; `low` and `unknown` guarantee nothing. */
const CEILING_PRESET_MIN_HEIGHT: Record<CeilingPreset, number | null> = {
	low: null,
	normal: 2.3,
	high: 2.7,
	unknown: null,
};

export interface EligibilityContext {
	profile: Pick<PlannerProfile, 'fitnessLevel'>;
	setup: TrainingSetupInput;
	limitations: BodyArea[];
	allowedStatuses: ExerciseStatus[];
	/** Exercises paused after reported pain; only the user can resume them. */
	pausedExerciseIds?: string[];
}

/** Usable floor in meters, or `null` when nothing is known. Exact measurements win over presets. */
export function usableFloor(setup: TrainingSetupInput): { lengthM: number; widthM: number } | null {
	const { lengthM, widthM, preset } = setup.floor;

	if (lengthM !== null && widthM !== null) {
		return { lengthM, widthM };
	}

	return preset ? FLOOR_PRESET_SIZES[preset] : null;
}

/** Guaranteed ceiling height in meters, or `null` when not confirmed. */
export function usableCeiling(setup: TrainingSetupInput): number | null {
	return setup.ceiling.heightM ?? CEILING_PRESET_MIN_HEIGHT[setup.ceiling.preset];
}

/**
 * Why an exercise can't be used with this profile and setup. An empty list means eligible.
 * Every unknown answer counts as "not suitable" for exercises that need it (README §4.2).
 */
export function exclusionReasons(exercise: Exercise, context: EligibilityContext): ExclusionReason[] {
	const reasons: ExclusionReason[] = [];
	const { setup, limitations } = context;
	const space = exercise.minimumSpace;

	if (!context.allowedStatuses.includes(exercise.status)) {
		reasons.push('not-published');
	}

	if (context.pausedExerciseIds?.includes(exercise.id)) {
		reasons.push('paused-after-pain');
	}

	if (validateExercise(exercise).length > 0) {
		// Incomplete metadata can't be screened safely; stop here.
		return [...reasons, 'incomplete-metadata'];
	}

	// Equipment: every group needs at least one matching item the user has.
	const owned = setup.noEquipment ? [] : setup.equipment;
	const hasType = (type: EquipmentType) => owned.some((item) => item.type === type);

	if (!exercise.equipmentRequired.every((group) => group.anyOf.some(hasType))) {
		reasons.push('missing-equipment');
	}

	const needs = (type: EquipmentType) =>
		exercise.equipmentRequired.some((group) => group.anyOf.includes(type));

	if (needs('pull-up-bar') && hasType('pull-up-bar')) {
		const bar = owned.find((item) => item.type === 'pull-up-bar');

		if (bar?.safelyInstalled !== true) {
			reasons.push('pull-up-bar-not-secure');
		}
	}

	if (exercise.requiresAdjustableBench && hasType('bench')) {
		const bench = owned.find((item) => item.type === 'bench');

		if (bench?.adjustable !== true) {
			reasons.push('bench-not-adjustable');
		}
	}

	// Floor space, in either orientation.
	const floor = usableFloor(setup);

	if (!floor) {
		reasons.push('floor-unknown');
	} else {
		const fits =
			(floor.lengthM >= space.lengthM && floor.widthM >= space.widthM) ||
			(floor.lengthM >= space.widthM && floor.widthM >= space.lengthM);

		if (!fits) {
			reasons.push('floor-too-small');
		}
	}

	if (space.heightM !== null) {
		const ceiling = usableCeiling(setup);

		if (ceiling === null) {
			reasons.push('ceiling-unknown');
		} else if (ceiling < space.heightM) {
			reasons.push('ceiling-too-low');
		}
	}

	if (space.surfaces !== null && !space.surfaces.includes(setup.surface)) {
		reasons.push('surface-unsuitable');
	}

	if (exercise.impactLevel === 'high' && setup.jumpingAllowed !== 'yes') {
		reasons.push('jumping-not-allowed');
	}

	if (setup.quietOnly && exercise.noiseLevel === 'loud') {
		reasons.push('too-noisy');
	}

	if (space.needsFloorContact && setup.canLieDown !== 'yes') {
		reasons.push('no-floor-contact');
	}

	if (space.needsAnchor && setup.safeAnchor !== 'yes') {
		reasons.push('no-anchor');
	}

	if (!setup.location || !space.locations.includes(setup.location)) {
		reasons.push('location');
	}

	if (exercise.contraindicatedAreas.some((area) => limitations.includes(area))) {
		reasons.push('limitation');
	}

	const level = context.profile.fitnessLevel;

	if (
		!level ||
		LEVEL_RANK[exercise.fitnessLevel] > LEVEL_RANK[level] ||
		(level === 'beginner' && exercise.coordinationDifficulty > 2)
	) {
		reasons.push('level-too-high');
	}

	return reasons;
}

export function filterExercises(catalog: Exercise[], context: EligibilityContext): EligibilityResult {
	const result: EligibilityResult = { eligible: [], excluded: [] };

	for (const exercise of catalog) {
		const reasons = exclusionReasons(exercise, context);

		if (reasons.length) {
			result.excluded.push({ exerciseId: exercise.id, reasons });
		} else {
			result.eligible.push(exercise);
		}
	}

	return result;
}
