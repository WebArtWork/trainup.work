import type { Exercise } from './types';

const PATTERNS = [
	'squat',
	'hinge',
	'lunge',
	'push-horizontal',
	'push-vertical',
	'pull-horizontal',
	'pull-vertical',
	'core',
	'conditioning',
	'mobility',
];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const STATUSES = ['draft', 'published', 'archived'];

/**
 * Metadata problems that make an exercise unsafe to auto-select (README §5). An empty list means
 * the exercise is complete. Published exercises also need a recorded review.
 */
export function validateExercise(exercise: Exercise): string[] {
	const issues: string[] = [];
	const check = (ok: boolean, issue: string) => {
		if (!ok) issues.push(issue);
	};
	const space = exercise.minimumSpace;

	check(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(exercise.id ?? ''), 'id must be kebab-case');
	check(exercise.slug === exercise.id, 'slug must equal id');
	check(!!exercise.name?.trim(), 'name is required');
	check(!!exercise.description?.trim(), 'description is required');
	check(PATTERNS.includes(exercise.movementPattern), 'unknown movementPattern');
	check(LEVELS.includes(exercise.fitnessLevel), 'unknown fitnessLevel');
	check(STATUSES.includes(exercise.status), 'unknown status');
	check(Array.isArray(exercise.primaryMuscles) && exercise.primaryMuscles.length > 0, 'primaryMuscles required');
	check(Array.isArray(exercise.equipmentRequired), 'equipmentRequired must be a list');
	check(
		(exercise.equipmentRequired ?? []).every(
			(group) => Array.isArray(group?.anyOf) && group.anyOf.length > 0,
		),
		'equipment groups must not be empty',
	);
	check([1, 2, 3].includes(exercise.coordinationDifficulty), 'coordinationDifficulty must be 1–3');
	check(!!space, 'minimumSpace is required');

	if (space) {
		check(space.lengthM > 0 && space.widthM > 0, 'minimumSpace needs positive length and width');
		check(space.heightM === null || space.heightM > 0, 'minimumSpace.heightM must be positive or null');
		check(typeof space.needsFloorContact === 'boolean', 'needsFloorContact is required');
		check(typeof space.needsAnchor === 'boolean', 'needsAnchor is required');
		check(Array.isArray(space.locations) && space.locations.length > 0, 'locations required');
	}

	check(['none', 'low', 'high'].includes(exercise.impactLevel), 'unknown impactLevel');
	check(['quiet', 'moderate', 'loud'].includes(exercise.noiseLevel), 'unknown noiseLevel');
	check(['none', 'low', 'moderate', 'high'].includes(exercise.axialSpinalLoad), 'unknown axialSpinalLoad');
	check(Array.isArray(exercise.contraindicatedAreas), 'contraindicatedAreas must be a list');
	check(Array.isArray(exercise.highLoadBodyAreas), 'highLoadBodyAreas must be a list');
	check(exercise.defaultSets >= 1 && exercise.defaultSets <= 6, 'defaultSets must be 1–6');
	check(exercise.estimatedSetSeconds > 0, 'estimatedSetSeconds must be positive');
	check(exercise.restSeconds >= 0, 'restSeconds must not be negative');

	if (exercise.intensityMode === 'reps') {
		check(
			!!exercise.repRange && exercise.repRange.min >= 1 && exercise.repRange.max >= exercise.repRange.min,
			'reps mode needs a valid repRange',
		);
	} else if (exercise.intensityMode === 'time') {
		check(
			!!exercise.durationRange &&
				exercise.durationRange.min >= 5 &&
				exercise.durationRange.max >= exercise.durationRange.min,
			'time mode needs a valid durationRange',
		);
	} else {
		issues.push('unknown intensityMode');
	}

	check(Array.isArray(exercise.steps) && exercise.steps.length > 0, 'steps are required');
	check(Number.isInteger(exercise.version) && exercise.version >= 1, 'version must be a positive integer');

	if (exercise.status === 'published') {
		check(!!exercise.reviewedBy?.trim() && !!exercise.reviewedAt, 'published exercises need a review');
	}

	return issues;
}
