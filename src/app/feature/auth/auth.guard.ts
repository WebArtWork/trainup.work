import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountService } from '../account/account.service';
import { AuthService } from './auth.service';

export const APP_PATHS = {
	signIn: '/app/sign-in',
	onboarding: '/app/onboarding',
	home: '/app/today',
};

const RETURN_URL_KEY = 'trainup.returnUrl';

/** Where to go after signing in, for flows that start signed out (connecting an AI assistant). */
export function takeReturnUrl(): string | null {
	try {
		const url = sessionStorage.getItem(RETURN_URL_KEY);

		sessionStorage.removeItem(RETURN_URL_KEY);

		return url?.startsWith('/app/connect') ? url : null;
	} catch {
		return null;
	}
}

/** Signed-in users only; loads the account so later guards can check onboarding. */
export const authGuard: CanActivateFn = async (_route, state) => {
	const router = inject(Router);
	const accountService = inject(AccountService);
	const user = await inject(AuthService).whenReady();

	if (!user) {
		if (state.url.startsWith('/app/connect')) {
			try {
				sessionStorage.setItem(RETURN_URL_KEY, state.url);
			} catch {
				// Storage can be blocked; the user then lands on Today and retries from the assistant.
			}
		}

		return router.parseUrl(APP_PATHS.signIn);
	}

	await accountService.ensureLoaded(user);

	return true;
};

/** Sign-in page: signed-in users skip straight into the app. */
export const guestGuard: CanActivateFn = async () => {
	const router = inject(Router);
	const user = await inject(AuthService).whenReady();

	return user ? router.parseUrl(APP_PATHS.home) : true;
};

/** Tabbed app pages: require completed onboarding. Run after `authGuard`. */
export const onboardedGuard: CanActivateFn = () =>
	inject(AccountService).isOnboarded() ? true : inject(Router).parseUrl(APP_PATHS.onboarding);

/** Onboarding wizard: only until it has been completed. Run after `authGuard`. */
export const needsOnboardingGuard: CanActivateFn = () =>
	inject(AccountService).isOnboarded() ? inject(Router).parseUrl(APP_PATHS.home) : true;
