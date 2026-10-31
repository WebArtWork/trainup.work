import { inject, Service, signal } from '@angular/core';
import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { WEIGHT_LIMITS, WEIGHT_SCHEMA_VERSION, WeightEntry } from './weight.interface';

@Service()
export class WeightService {
	private readonly _firebase = inject(FirebaseService);

	readonly entries = signal<WeightEntry[]>([]);

	async load(): Promise<void> {
		const { db, uid } = this._context();
		const snapshot = await getDocs(collection(db, 'users', uid, 'weights'));

		this.entries.set(
			snapshot.docs
				.map((item) => item.data() as WeightEntry)
				.sort((a, b) => a.date.localeCompare(b.date)),
		);
	}

	/** Saves the day's weigh-in (replacing an earlier one) and reloads the list. */
	async save(date: string, kg: number): Promise<void> {
		if (!Number.isFinite(kg) || kg < WEIGHT_LIMITS.min || kg > WEIGHT_LIMITS.max) {
			throw new Error('Weight is out of range.');
		}

		const { db, uid } = this._context();

		await setDoc(doc(db, 'users', uid, 'weights', date), {
			schemaVersion: WEIGHT_SCHEMA_VERSION,
			date,
			kg: Math.round(kg * 10) / 10,
			updatedAt: serverTimestamp(),
		});
		await this.load();
	}

	private _context() {
		const uid = this._firebase.auth?.currentUser?.uid;
		const db = this._firebase.firestore;

		if (!uid || !db) {
			throw new Error('Not signed in.');
		}

		return { db, uid };
	}
}
