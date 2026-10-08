import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, initializeFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

/**
 * Lazily initializes Firebase in the browser only.
 * SSR/prerender never touches Firebase, so the static site stays network-free at build time.
 */
@Service()
export class FirebaseService {
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	private _app: FirebaseApp | null = null;
	private _firestore: Firestore | null = null;
	private _auth: Auth | null = null;

	get app(): FirebaseApp | null {
		if (!this._isBrowser) {
			return null;
		}

		if (!this._app) {
			this._app = initializeApp(environment.firebase);
		}

		return this._app;
	}

	get firestore(): Firestore | null {
		if (!this._firestore) {
			const app = this.app;

			// Optional domain fields are modelled as `undefined`; Firestore would reject them otherwise.
			this._firestore = app
				? initializeFirestore(app, { ignoreUndefinedProperties: true })
				: null;
		}

		return this._firestore;
	}

	get auth(): Auth | null {
		if (!this._auth) {
			const app = this.app;

			// getAuth() defaults to browserLocalPersistence on the web; don't call setPersistence() again.
			this._auth = app ? getAuth(app) : null;
		}

		return this._auth;
	}
}
