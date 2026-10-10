import { computed, inject, Service, signal } from '@angular/core';
import type { Exercise, ExerciseStatus } from '@trainup/planner';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { FirebaseService } from '../firebase/firebase.service';
import { loadBundledCatalog } from './bundled-catalog';
import { EXERCISE_IMAGES } from './exercise-images';

/**
 * The exercise catalog. Production reads only published (reviewed) exercises from Firestore;
 * development uses the bundled src/data catalog including drafts (see `environment.exerciseSource`).
 */
@Service()
export class ExerciseCatalogService {
	private readonly _firebase = inject(FirebaseService);

	readonly exercises = signal<Exercise[]>([]);
	readonly loaded = signal(false);
	readonly error = signal(false);
	/** Statuses the planner may use with the current source. */
	readonly allowedStatuses: ExerciseStatus[] =
		environment.exerciseSource === 'bundled' ? ['draft', 'published'] : ['published'];
	readonly usesDrafts = environment.exerciseSource === 'bundled';
	readonly byId = computed(
		() => new Map(this.exercises().map((exercise) => [exercise.id, exercise] as const)),
	);

	private _loading: Promise<void> | null = null;

	/**
	 * The user's own exercises (created through the AI assistant connection) share the catalog's
	 * shape and ids start with `custom-`; they are only ever read from the user's own documents.
	 */
	isCustom(id: string): boolean {
		return id.startsWith('custom-');
	}

	/** Reloads the catalog and the user's exercises, e.g. after the assistant changed them. */
	refresh(): Promise<void> {
		this._loading = null;

		return this.ensureLoaded();
	}

	ensureLoaded(): Promise<void> {
		this._loading ??= this._load().catch((error: unknown) => {
			this._loading = null;
			this.error.set(true);
			throw error;
		});

		return this._loading;
	}

	private async _load() {
		this.error.set(false);

		const [catalog, custom] = await Promise.all([
			environment.exerciseSource === 'bundled' ? loadBundledCatalog() : this._loadPublished(),
			this._loadCustom(),
		]);
		const exercises = [...catalog, ...custom];

		this.exercises.set(
			exercises
				.filter((exercise) => this.allowedStatuses.includes(exercise.status))
				.map((exercise) => ({
					...exercise,
					imageUrl: exercise.imageUrl || EXERCISE_IMAGES[exercise.id] || null,
				}))
				.sort((a, b) => a.name.localeCompare(b.name, 'uk')),
		);
		this.loaded.set(true);
	}

	private async _loadPublished(): Promise<Exercise[]> {
		const db = this._firebase.firestore;

		if (!db) {
			return [];
		}

		// The `status` filter is required: rules only allow reading published exercises.
		const snapshot = await getDocs(
			query(collection(db, 'exercises'), where('status', '==', 'published')),
		);

		return snapshot.docs.map((doc) => doc.data() as Exercise);
	}

	/** A failure here must not hide the shared catalog, so it only logs. */
	private async _loadCustom(): Promise<Exercise[]> {
		const db = this._firebase.firestore;
		const uid = this._firebase.auth?.currentUser?.uid;

		if (!db || !uid) {
			return [];
		}

		try {
			const snapshot = await getDocs(collection(db, 'users', uid, 'customExercises'));

			return snapshot.docs.map((doc) => {
				const { createdAt: _createdAt, updatedAt: _updatedAt, custom: _custom, ...exercise } = doc.data();

				return exercise as Exercise;
			});
		} catch (error) {
			console.error(error);

			return [];
		}
	}
}
