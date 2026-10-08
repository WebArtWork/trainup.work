import { computed, inject, Service, signal } from '@angular/core';
import { LanguageService } from '@wawjs/ngx-translate';
import type { User } from 'firebase/auth';
import {
	collection,
	doc,
	Firestore,
	getDoc,
	getDocs,
	serverTimestamp,
	setDoc,
	updateDoc,
	writeBatch,
	WriteBatch,
} from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { pickProfileInput, pickSetupInput } from './account.util';
import {
	Limitation,
	LIMITATION_SCHEMA_VERSION,
	LimitationInput,
} from '../limitation/limitation.interface';
import { EMPTY_PROFILE_INPUT } from '../profile/profile.const';
import { PROFILE_SCHEMA_VERSION, ProfileInput, UserProfile } from '../profile/profile.interface';
import { EMPTY_TRAINING_SETUP_INPUT } from '../training-setup/training-setup.const';
import {
	PRIMARY_SETUP_ID,
	TRAINING_SETUP_SCHEMA_VERSION,
	TrainingSetup,
	TrainingSetupInput,
} from '../training-setup/training-setup.interface';

/** Reads and writes the signed-in user's profile, training setup, and limitations. */
@Service()
export class AccountService {
	private readonly _firebase = inject(FirebaseService);
	private readonly _languageService = inject(LanguageService);

	readonly profile = signal<UserProfile | null>(null);
	readonly setup = signal<TrainingSetup | null>(null);
	readonly limitations = signal<Limitation[]>([]);

	readonly activeLimitations = computed(() =>
		this.limitations().filter((limitation) => limitation.active),
	);
	readonly isOnboarded = computed(() => !!this.profile()?.onboardingCompletedAt);

	private _uid: string | null = null;
	private _loading: Promise<void> | null = null;

	ensureLoaded(user: User): Promise<void> {
		if (this._uid !== user.uid || !this._loading) {
			this._uid = user.uid;
			this._loading = this._load(user).catch((error: unknown) => {
				this._loading = null;
				throw error;
			});
		}

		return this._loading;
	}

	reset() {
		this._uid = null;
		this._loading = null;
		this.profile.set(null);
		this.setup.set(null);
		this.limitations.set([]);
	}

	async completeOnboarding(
		profile: ProfileInput,
		setup: TrainingSetupInput,
		limitations: LimitationInput[],
	): Promise<void> {
		const { db, uid } = this._context();
		const batch = writeBatch(db);

		batch.update(doc(db, 'users', uid), {
			...pickProfileInput(profile),
			onboardingCompletedAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});
		this._writeSetup(batch, db, uid, setup);
		this._writeLimitations(batch, db, uid, limitations);

		await batch.commit();
		await this._reload();
	}

	async saveProfile(profile: ProfileInput): Promise<void> {
		const { db, uid } = this._context();

		await updateDoc(doc(db, 'users', uid), {
			...pickProfileInput(profile),
			updatedAt: serverTimestamp(),
		});
		await this._reload();
	}

	async saveSetup(setup: TrainingSetupInput): Promise<void> {
		const { db, uid } = this._context();
		const batch = writeBatch(db);

		this._writeSetup(batch, db, uid, setup);

		await batch.commit();
		await this._reload();
	}

	async saveLimitations(limitations: LimitationInput[]): Promise<void> {
		const { db, uid } = this._context();
		const batch = writeBatch(db);

		this._writeLimitations(batch, db, uid, limitations);

		await batch.commit();
		await this._reload();
	}

	private async _load(user: User): Promise<void> {
		const db = this._db();
		const userRef = doc(db, 'users', user.uid);
		const [userSnapshot, setupSnapshot, limitationsSnapshot] = await Promise.all([
			getDoc(userRef),
			getDoc(doc(db, 'users', user.uid, 'trainingSetups', PRIMARY_SETUP_ID)),
			getDocs(collection(db, 'users', user.uid, 'limitations')),
		]);

		if (userSnapshot.exists()) {
			this.profile.set({ ..._newProfile(user, ''), ...(userSnapshot.data() as UserProfile) });
		} else {
			const profile = _newProfile(user, this._languageService.language());

			await setDoc(userRef, {
				...profile,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			});
			this.profile.set(profile);
		}

		this.setup.set(
			setupSnapshot.exists()
				? {
						...EMPTY_TRAINING_SETUP_INPUT,
						...(setupSnapshot.data() as TrainingSetup),
					}
				: null,
		);
		this.limitations.set(
			limitationsSnapshot.docs.map((snapshot) => snapshot.data() as Limitation),
		);
	}

	private async _reload(): Promise<void> {
		const user = this._firebase.auth?.currentUser;

		if (user) {
			this._loading = this._load(user);
			await this._loading;
		}
	}

	private _writeSetup(batch: WriteBatch, db: Firestore, uid: string, setup: TrainingSetupInput) {
		batch.set(doc(db, 'users', uid, 'trainingSetups', PRIMARY_SETUP_ID), {
			...pickSetupInput(setup),
			schemaVersion: TRAINING_SETUP_SCHEMA_VERSION,
			active: true,
			updatedAt: serverTimestamp(),
		});
	}

	private _writeLimitations(
		batch: WriteBatch,
		db: Firestore,
		uid: string,
		limitations: LimitationInput[],
	) {
		const selectedAreas = new Set(limitations.map((limitation) => limitation.area));

		for (const limitation of limitations) {
			batch.set(doc(db, 'users', uid, 'limitations', limitation.area), {
				schemaVersion: LIMITATION_SCHEMA_VERSION,
				area: limitation.area,
				note: limitation.note.trim(),
				active: true,
				updatedAt: serverTimestamp(),
			});
		}

		for (const existing of this.activeLimitations()) {
			if (!selectedAreas.has(existing.area)) {
				batch.update(doc(db, 'users', uid, 'limitations', existing.area), {
					active: false,
					updatedAt: serverTimestamp(),
				});
			}
		}
	}

	private _context(): { db: Firestore; uid: string } {
		const uid = this._firebase.auth?.currentUser?.uid;

		if (!uid) {
			throw new Error('No signed-in user.');
		}

		return { db: this._db(), uid };
	}

	private _db(): Firestore {
		const db = this._firebase.firestore;

		if (!db) {
			throw new Error('Firestore is only available in the browser.');
		}

		return db;
	}
}

function _newProfile(user: User, language: string): UserProfile {
	return {
		...EMPTY_PROFILE_INPUT,
		schemaVersion: PROFILE_SCHEMA_VERSION,
		displayName: user.displayName ?? '',
		email: user.email ?? '',
		photoUrl: user.photoURL ?? '',
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		language,
		onboardingCompletedAt: null,
		createdAt: null,
		updatedAt: null,
	};
}
