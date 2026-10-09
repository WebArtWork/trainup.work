import { inject, Service } from '@angular/core';
import {
	collection,
	deleteDoc,
	doc,
	Firestore,
	getDoc,
	getDocs,
	serverTimestamp,
	updateDoc,
	writeBatch,
} from 'firebase/firestore';
import { AuthService } from '../auth/auth.service';
import { FirebaseService } from '../firebase/firebase.service';
import {
	buildUserDataExport,
	chunk,
	exportFileName,
	USER_DATA_COLLECTIONS,
	UserDataCollection,
} from './privacy-export.util';

/** Data export and account deletion (README §12: consent, deletion and export paths). */
@Service()
export class PrivacyService {
	private readonly _firebase = inject(FirebaseService);
	private readonly _authService = inject(AuthService);

	/** Reads everything the user owns and downloads it as a JSON file. */
	async exportData(): Promise<void> {
		const { db, uid } = this._context();
		const profileSnapshot = await getDoc(doc(db, 'users', uid));
		const collections = Object.fromEntries(
			await Promise.all(
				USER_DATA_COLLECTIONS.map(async (name) => {
					const snapshot = await getDocs(collection(db, 'users', uid, name));

					return [name, snapshot.docs.map((item) => ({ id: item.id, data: item.data() }))];
				}),
			),
		) as Record<UserDataCollection, { id: string; data: Record<string, unknown> }[]>;

		_download(
			JSON.stringify(buildUserDataExport(profileSnapshot.data() ?? {}, collections), null, '\t'),
			exportFileName(),
		);
	}

	/**
	 * Permanently deletes the account: re-authenticates, stamps the deletion request (which the rules
	 * require before immutable documents can be deleted), removes every document, then the Auth user.
	 */
	async deleteAccount(): Promise<void> {
		const { db, uid } = this._context();

		await this._authService.reauthenticate();
		await updateDoc(doc(db, 'users', uid), {
			deletionRequestedAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
		});

		for (const name of USER_DATA_COLLECTIONS) {
			const snapshot = await getDocs(collection(db, 'users', uid, name));

			for (const group of chunk(snapshot.docs, 400)) {
				const batch = writeBatch(db);

				group.forEach((item) => batch.delete(item.ref));
				await batch.commit();
			}
		}

		await deleteDoc(doc(db, 'users', uid));
		await this._authService.deleteCurrentUser();
	}

	private _context(): { db: Firestore; uid: string } {
		const uid = this._firebase.auth?.currentUser?.uid;
		const db = this._firebase.firestore;

		if (!uid || !db) {
			throw new Error('No signed-in user.');
		}

		return { db, uid };
	}
}

function _download(content: string, fileName: string) {
	const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
	const link = document.createElement('a');

	link.href = url;
	link.download = fileName;
	link.click();
	URL.revokeObjectURL(url);
}
