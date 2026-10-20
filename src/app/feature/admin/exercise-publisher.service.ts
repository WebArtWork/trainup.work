import { inject, Service } from '@angular/core';
import { Exercise, validateExercise } from '@trainup/planner';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';

export interface CatalogIssue {
	id: string;
	problems: string[];
}

export interface CatalogDiff {
	/** Exercises in src/data/exercise/exercises.json. */
	total: number;
	published: number;
	toCreate: string[];
	toUpdate: string[];
	unchanged: number;
	/** In Firestore but no longer in the JSON; left alone, like `npm run seed` without --prune. */
	onlyInFirestore: string[];
	issues: CatalogIssue[];
}

const BATCH_SIZE = 400;

/**
 * Browser version of tools/seed/seed.mjs for the exercise catalog: compares the bundled
 * src/data/exercise/exercises.json with Firestore and upserts what changed. Firestore rules let
 * only admins write `exercises`, so this works for the accounts listed in isAdmin().
 */
@Service()
export class ExercisePublisherService {
	private readonly _firebase = inject(FirebaseService);

	async compare(): Promise<CatalogDiff> {
		const exercises = await _loadCatalog();
		const issues = _validate(exercises);
		const db = this._db();
		const existing = new Map(
			(await getDocs(collection(db, 'exercises'))).docs.map((snapshot) => [
				snapshot.id,
				snapshot.data(),
			]),
		);
		const diff: CatalogDiff = {
			total: exercises.length,
			published: exercises.filter((exercise) => exercise.status === 'published').length,
			toCreate: [],
			toUpdate: [],
			unchanged: 0,
			onlyInFirestore: [],
			issues,
		};

		for (const exercise of exercises) {
			const current = existing.get(exercise.id);

			existing.delete(exercise.id);

			if (!current) {
				diff.toCreate.push(exercise.id);
			} else if (!_deepEqual(current, exercise)) {
				diff.toUpdate.push(exercise.id);
			} else {
				diff.unchanged++;
			}
		}

		diff.onlyInFirestore = [...existing.keys()];

		return diff;
	}

	/** Writes every new or changed exercise. Refuses to write anything if the catalog has issues. */
	async publish(): Promise<CatalogDiff> {
		const diff = await this.compare();

		if (diff.issues.length) {
			throw new Error('The catalog has validation issues; nothing was written.');
		}

		const changed = new Set([...diff.toCreate, ...diff.toUpdate]);
		const exercises = (await _loadCatalog()).filter((exercise) => changed.has(exercise.id));
		const db = this._db();

		for (let start = 0; start < exercises.length; start += BATCH_SIZE) {
			const batch = writeBatch(db);

			for (const exercise of exercises.slice(start, start + BATCH_SIZE)) {
				batch.set(doc(db, 'exercises', exercise.id), exercise);
			}

			await batch.commit();
		}

		return diff;
	}

	private _db() {
		const db = this._firebase.firestore;

		if (!db) {
			throw new Error('Firestore is only available in the browser.');
		}

		return db;
	}
}

async function _loadCatalog(): Promise<Exercise[]> {
	// Lazy chunk: only the admin page downloads the full catalog, drafts included.
	return (await import('../../../data/exercise/exercises.json')).default as Exercise[];
}

/** Same checks as `npm run seed` plus the planner's exercise validation. */
function _validate(exercises: Exercise[]): CatalogIssue[] {
	const issues: CatalogIssue[] = [];
	const ids = new Set<string>();

	for (const exercise of exercises) {
		const problems = validateExercise(exercise);
		const id = exercise.id;

		if (typeof id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(id)) {
			problems.push(`invalid id ${JSON.stringify(id)}`);
		} else if (ids.has(id)) {
			problems.push('duplicate id');
		}

		const nested = _findNestedArray(exercise, String(id));

		if (nested) {
			problems.push(`Firestore can't store an array inside an array (${nested})`);
		}

		ids.add(id);

		if (problems.length) {
			issues.push({ id: String(id), problems });
		}
	}

	return issues;
}

function _findNestedArray(value: unknown, trail: string): string | null {
	if (Array.isArray(value)) {
		for (const [i, item] of value.entries()) {
			if (Array.isArray(item)) return `${trail}[${i}]`;
			const nested = _findNestedArray(item, `${trail}[${i}]`);
			if (nested) return nested;
		}
	} else if (value && typeof value === 'object') {
		for (const [key, item] of Object.entries(value)) {
			const nested = _findNestedArray(item, `${trail}.${key}`);
			if (nested) return nested;
		}
	}

	return null;
}

/** Firestore returns maps with its own key order, so compare by value, not by JSON text. */
function _deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;

	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((item, i) => _deepEqual(item, b[i]));
	}

	const aKeys = Object.keys(a);
	const bRecord = b as Record<string, unknown>;

	return (
		aKeys.length === Object.keys(bRecord).length &&
		aKeys.every(
			(key) =>
				key in bRecord && _deepEqual((a as Record<string, unknown>)[key], bRecord[key]),
		)
	);
}
