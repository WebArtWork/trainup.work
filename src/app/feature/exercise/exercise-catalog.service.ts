import { computed, inject, Service, signal } from '@angular/core';
import type { Exercise } from '@trainup/planner';
import { collection, getDocs } from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { loadBundledCatalog } from './bundled-catalog';
import { EXERCISE_IMAGES } from './exercise-images';

/**
 * The exercise catalog: the bundled src/data catalog plus the user's own exercises.
 */
@Service()
export class ExerciseCatalogService {
	private readonly _firebase = inject(FirebaseService);

	readonly exercises = signal<Exercise[]>([]);
	readonly loaded = signal(false);
	readonly error = signal(false);
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
			loadBundledCatalog(),
			this._loadCustom(),
		]);
		const exercises = [...catalog, ...custom];

		this.exercises.set(
			exercises
				.map((exercise) => ({
					...exercise,
					imageUrl: exercise.imageUrl || EXERCISE_IMAGES[exercise.id] || null,
				}))
				.sort((a, b) => a.name.localeCompare(b.name, 'uk')),
		);
		this.loaded.set(true);
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
