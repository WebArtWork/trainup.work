import { computed, inject, Service, signal } from '@angular/core';
import type { Exercise, ExerciseStatus } from '@trainup/planner';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { FirebaseService } from '../firebase/firebase.service';
import { loadBundledCatalog } from './bundled-catalog';

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

		const exercises =
			environment.exerciseSource === 'bundled'
				? await loadBundledCatalog()
				: await this._loadPublished();

		this.exercises.set(
			exercises
				.filter((exercise) => this.allowedStatuses.includes(exercise.status))
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
}
