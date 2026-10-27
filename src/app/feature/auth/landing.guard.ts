import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Landing page: prerendered for everyone; signed-in users in the browser go straight to Today.
 * Firebase is imported lazily so it stays out of the landing bundle.
 */
export const landingGuard: CanActivateFn = async () => {
	if (!isPlatformBrowser(inject(PLATFORM_ID))) {
		return true;
	}

	const router = inject(Router);
	const { AuthService } = await import('./auth.service');
	const user = await inject(AuthService).whenReady();

	return user ? router.parseUrl('/today') : true;
};
