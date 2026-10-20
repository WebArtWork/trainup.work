import { FirebaseError } from 'firebase/app';
import { environment } from '../../../environments/environment';

const APPLE_JS_URL =
	'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

interface AppleIdAuth {
	init(config: {
		clientId: string;
		scope: string;
		redirectURI: string;
		nonce: string;
		usePopup: boolean;
	}): void;
	signIn(): Promise<{ authorization: { id_token: string } }>;
}

declare global {
	interface Window {
		AppleID?: { auth: AppleIdAuth };
	}
}

export interface AppleIdToken {
	idToken: string;
	rawNonce: string;
}

/** True when the web build has a Services ID for Apple's JS SDK. */
export function hasAppleWebSignIn(): boolean {
	return !!environment.appleSignIn.servicesId;
}

/**
 * Signs in with Apple's JS SDK in a popup and returns the ID token for
 * `OAuthProvider('apple.com').credential(...)`. Firebase's own popup is not used because Apple's
 * form_post back to firebaseapp.com loses the initial state in iOS Safari.
 */
export async function signInWithAppleWeb(): Promise<AppleIdToken> {
	const auth = await _loadAppleId();
	const rawNonce = _randomNonce();

	auth.init({
		clientId: environment.appleSignIn.servicesId,
		scope: 'name email',
		redirectURI: environment.appleSignIn.redirectUri,
		nonce: await _sha256(rawNonce),
		usePopup: true,
	});

	try {
		const response = await auth.signIn();

		return { idToken: response.authorization.id_token, rawNonce };
	} catch (error) {
		// Apple rejects with `{ error: 'popup_closed_by_user' | 'user_cancelled_authorize' }`.
		const reason = (error as { error?: string } | null)?.error ?? '';

		if (reason === 'popup_closed_by_user' || reason === 'user_cancelled_authorize') {
			throw new FirebaseError('auth/popup-closed-by-user', reason);
		}

		if (reason === 'popup_blocked_by_browser') {
			throw new FirebaseError('auth/popup-blocked', reason);
		}

		throw error;
	}
}

let _script: Promise<AppleIdAuth> | null = null;

function _loadAppleId(): Promise<AppleIdAuth> {
	if (window.AppleID) {
		return Promise.resolve(window.AppleID.auth);
	}

	_script ??= new Promise<AppleIdAuth>((resolve, reject) => {
		const script = document.createElement('script');

		script.src = APPLE_JS_URL;
		script.async = true;
		script.onload = () =>
			window.AppleID
				? resolve(window.AppleID.auth)
				: reject(new FirebaseError('auth/internal-error', 'AppleID JS did not load.'));
		script.onerror = () => {
			_script = null;
			script.remove();
			reject(new FirebaseError('auth/network-request-failed', 'AppleID JS did not load.'));
		};

		document.head.appendChild(script);
	});

	return _script;
}

function _randomNonce(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));

	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function _sha256(value: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));

	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
		'',
	);
}
