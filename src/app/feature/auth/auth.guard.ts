import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountService } from '../account/account.service';
import { AuthService } from './auth.service';

export const APP_PATHS = {
	signIn: '/app/sign-in',
	onboarding: '/app/onboarding',
	home: '/app/today',
};

/** Signed-in users only; loads the account so later guards can check onboarding. */
export const authGuard: CanActivateFn = async () => {
	const router = inject(Router);
	const accountService = inject(AccountService);
	const user = await inject(AuthService).whenReady();

	if (!user) {
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
