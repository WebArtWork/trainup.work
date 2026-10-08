import { inject, Service, signal } from '@angular/core';
import {
	AuthProvider,
	GoogleAuthProvider,
	OAuthProvider,
	onAuthStateChanged,
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

	private _ready: Promise<User | null> | null = null;

	/** Resolves with the restored user once Firebase has checked the persisted session. */
	whenReady(): Promise<User | null> {
		if (!this._ready) {
			this._ready = new Promise((resolve) => {
				const auth = this._firebase.auth;

				if (!auth) {
					this.user.set(null);
					resolve(null);
					return;
				}

				let resolved = false;

				onAuthStateChanged(auth, (user) => {
					this.user.set(user);

					if (!resolved) {
						resolved = true;
						resolve(user);
					}
				});
			});
		}

		return this._ready;
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
