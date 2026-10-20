import { inject, Service, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FirebaseError } from 'firebase/app';
import {
	AuthCredential,
	AuthProvider,
	deleteUser,
	GoogleAuthProvider,
	OAuthProvider,
	onAuthStateChanged,
	reauthenticateWithCredential,
	reauthenticateWithPopup,
	signInWithCredential,
	signInWithPopup,
	signOut,
	User,
} from 'firebase/auth';
import { FirebaseService } from '../firebase/firebase.service';
import { hasAppleWebSignIn, signInWithAppleWeb } from './apple-web-sign-in';

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

	/** Apple has no Firebase JS credential on Android: the native SDK keeps the token to itself. */
	isAvailable(provider: SignInProvider): boolean {
		return provider !== 'apple' || Capacitor.getPlatform() !== 'android';
	}

	async signIn(provider: SignInProvider): Promise<User> {
		const auth = this._firebase.auth;

		if (!auth) {
			throw new Error('Firebase Auth is only available in the browser.');
		}

		const credential = await _getCredential(provider);
		const result = credential
			? await signInWithCredential(auth, credential)
			: await signInWithPopup(auth, _createProvider(provider));

		this.user.set(result.user);

		return result.user;
	}

	/** Re-checks the user with the provider they signed in with; needed before deleting the account. */
	async reauthenticate(): Promise<void> {
		const user = this._firebase.auth?.currentUser;

		if (!user) {
			throw new Error('No signed-in user.');
		}

		const provider: SignInProvider =
			user.providerData[0]?.providerId === 'apple.com' ? 'apple' : 'google';
		const credential = await _getCredential(provider);

		if (credential) {
			await reauthenticateWithCredential(user, credential);
		} else {
			await reauthenticateWithPopup(user, _createProvider(provider));
		}
	}

	/** Deletes the Firebase Auth user. Call only after their data is gone. */
	async deleteCurrentUser(): Promise<void> {
		const user = this._firebase.auth?.currentUser;

		if (user) {
			await deleteUser(user);
		}

		await _signOutNative();
		this.user.set(null);
	}

	async signOut(): Promise<void> {
		const auth = this._firebase.auth;

		if (auth) {
			await signOut(auth);
		}

		await _signOutNative();
		this.user.set(null);
	}
}

/**
 * Native apps can't use Firebase's popup: Google blocks sign-in inside a WebView. The native
 * plugin signs in with the platform SDK only (`skipNativeAuth`), and the JS SDK, which Firestore
 * uses, signs in with the returned token. Web Apple uses Apple's JS SDK (see apple-web-sign-in.ts).
 * `null` means the Firebase popup is fine (web Google, or web Apple without a Services ID).
 */
async function _getCredential(provider: SignInProvider): Promise<AuthCredential | null> {
	if (!Capacitor.isNativePlatform()) {
		if (provider === 'apple' && hasAppleWebSignIn()) {
			const { idToken, rawNonce } = await signInWithAppleWeb();

			return new OAuthProvider('apple.com').credential({ idToken, rawNonce });
		}

		return null;
	}

	const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

	try {
		if (provider === 'apple') {
			const result = await FirebaseAuthentication.signInWithApple({ skipNativeAuth: true });

			return new OAuthProvider('apple.com').credential({
				idToken: result.credential?.idToken,
				rawNonce: result.credential?.nonce,
			});
		}

		const result = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });

		return GoogleAuthProvider.credential(
			result.credential?.idToken,
			result.credential?.accessToken,
		);
	} catch (error) {
		// Native SDKs report a closed sheet as an error message, not a Firebase code.
		if (/cancel/i.test(String((error as { message?: unknown } | null)?.message ?? error))) {
			throw new FirebaseError('auth/popup-closed-by-user', 'Sign-in cancelled.');
		}

		throw error;
	}
}

/** Clears the native Google session too, so the next sign-in offers the account picker. */
async function _signOutNative(): Promise<void> {
	if (!Capacitor.isNativePlatform()) {
		return;
	}

	const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

	await FirebaseAuthentication.signOut().catch(() => undefined);
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
