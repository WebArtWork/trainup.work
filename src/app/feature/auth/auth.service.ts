import { inject, Service, signal } from '@angular/core';
import {
	AuthProvider,
	deleteUser,
	GoogleAuthProvider,
	OAuthProvider,
	onAuthStateChanged,
	reauthenticateWithPopup,
	signInWithPopup,
	signOut,
	User,
} from 'firebase/auth';
import { FirebaseService } from '../firebase/firebase.service';

export type SignInProvider = 'google' | 'apple';

@Service()
export class AuthService {
	private readonly _firebase = inject(FirebaseService);

	/** `undefined` until Firebase restores the session; `null` when signed out. */
	readonly user = signal<User | null | undefined>(undefined);

	private _ready: Promise<void> | null = null;

	/**
	 * Resolves with the current user once Firebase has checked the persisted session.
	 * Only the first check is awaited; later calls read the live `user` signal, so guards
	 * see sign-ins and sign-outs that happen after startup.
	 */
	async whenReady(): Promise<User | null> {
		if (!this._ready) {
			this._ready = new Promise<void>((resolve) => {
				const auth = this._firebase.auth;

				if (!auth) {
					this.user.set(null);
					resolve();
					return;
				}

				let resolved = false;

				onAuthStateChanged(auth, (user) => {
					this.user.set(user);

					if (!resolved) {
						resolved = true;
						resolve();
					}
				});
			});
		}

		await this._ready;

		return this.user() ?? null;
	}

	async signIn(provider: SignInProvider): Promise<User> {
		const auth = this._firebase.auth;

		if (!auth) {
			throw new Error('Firebase Auth is only available in the browser.');
		}

		const credential = await signInWithPopup(auth, _createProvider(provider));

		this.user.set(credential.user);

		return credential.user;
	}

	/** Re-checks the user with the provider they signed in with; needed before deleting the account. */
	async reauthenticate(): Promise<void> {
		const user = this._firebase.auth?.currentUser;

		if (!user) {
			throw new Error('No signed-in user.');
		}

		const provider: SignInProvider =
			user.providerData[0]?.providerId === 'apple.com' ? 'apple' : 'google';

		await reauthenticateWithPopup(user, _createProvider(provider));
	}

	/** Deletes the Firebase Auth user. Call only after their data is gone. */
	async deleteCurrentUser(): Promise<void> {
		const user = this._firebase.auth?.currentUser;

		if (user) {
			await deleteUser(user);
		}

		this.user.set(null);
	}

	async signOut(): Promise<void> {
		const auth = this._firebase.auth;

		if (auth) {
			await signOut(auth);
		}

		this.user.set(null);
	}
}

function _createProvider(provider: SignInProvider): AuthProvider {
	switch (provider) {
		case 'google':
			return new GoogleAuthProvider();
		case 'apple': {
			const apple = new OAuthProvider('apple.com');

			apple.addScope('email');
			apple.addScope('name');

			return apple;
		}
	}
}
