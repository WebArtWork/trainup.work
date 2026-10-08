import { computed, inject, Service, signal } from '@angular/core';
import {
	collection,
	doc,
	Firestore,
	getDocs,
	serverTimestamp,
	updateDoc,
} from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { ExerciseFlag } from './exercise-flag.interface';

@Service()
export class ExerciseFlagService {
	private readonly _firebase = inject(FirebaseService);

	readonly flags = signal<ExerciseFlag[]>([]);
	readonly activeFlags = computed(() => this.flags().filter((flag) => flag.active));
	readonly pausedIds = computed(() => this.activeFlags().map((flag) => flag.exerciseId).sort());

	private _uid: string | null = null;
	private _loading: Promise<void> | null = null;

	ensureLoaded(): Promise<void> {
		const uid = this._firebase.auth?.currentUser?.uid ?? null;

		if (uid !== this._uid || !this._loading) {
			this._uid = uid;
			this._loading = this.reload().catch((error: unknown) => {
				this._loading = null;
				throw error;
			});
		}

		return this._loading;
	}

	async reload(): Promise<void> {
		const { db, uid } = this._context();
		const snapshot = await getDocs(collection(db, 'users', uid, 'exerciseFlags'));

		this.flags.set(snapshot.docs.map((item) => item.data() as ExerciseFlag));
	}

	/** The user confirms the exercise can be used again. Never called automatically. */
	async resume(exerciseId: string): Promise<void> {
		const { db, uid } = this._context();

		await updateDoc(doc(db, 'users', uid, 'exerciseFlags', exerciseId), {
			active: false,
			resolvedAt: serverTimestamp(),
		});
		await this.reload();
	}

	reset() {
		this._uid = null;
		this._loading = null;
		this.flags.set([]);
	}

	private _context(): { db: Firestore; uid: string } {
		const db = this._firebase.firestore;
		const uid = this._firebase.auth?.currentUser?.uid;

		if (!db || !uid) {
			throw new Error('No signed-in user.');
		}

		return { db, uid };
	}
}
