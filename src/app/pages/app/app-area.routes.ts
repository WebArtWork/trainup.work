import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { isAccountSection } from '../../feature/account/account.interface';
import {
	authGuard,
	guestGuard,
	needsOnboardingGuard,
	onboardedGuard,
} from '../../feature/auth/auth.guard';

/** `/app/**` routes, lazy-loaded from app.routes.ts. */
export const APP_AREA_ROUTES: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('../../layouts/app-shell/app-shell.component').then((m) => m.AppShellComponent),
		children: [
			{
				path: 'sign-in',
				canActivate: [guestGuard],
				loadComponent: () =>
					import('./sign-in/sign-in.component').then((m) => m.SignInComponent),
			},
			{
				// Parent guard finishes loading the account before child guards check onboarding.
				path: '',
				canActivate: [authGuard],
				children: [
					{
						path: 'onboarding',
						canActivate: [needsOnboardingGuard],
						loadComponent: () =>
							import('./onboarding/onboarding.component').then(
								(m) => m.OnboardingComponent,
							),
					},
					{
						path: '',
						canActivate: [onboardedGuard],
						loadComponent: () =>
							import('../../layouts/app-tabs/app-tabs.component').then(
								(m) => m.AppTabsComponent,
							),
						children: [
							{ path: '', pathMatch: 'full', redirectTo: 'today' },
							{
								path: 'today',
								loadComponent: () =>
									import('./today/today.component').then((m) => m.TodayComponent),
							},
							{
								path: 'workout',
								loadComponent: () =>
									import('./workout/workout.component').then(
										(m) => m.WorkoutComponent,
									),
							},
							{
								path: 'explore',
								loadComponent: () =>
									import('./explore/explore.component').then(
										(m) => m.ExploreComponent,
									),
							},
							{
								path: 'profile',
								loadComponent: () =>
									import('./profile/profile.component').then(
										(m) => m.ProfileComponent,
									),
							},
							{
								path: 'profile/:section',
								canActivate: [
									(route) =>
										isAccountSection(route.paramMap.get('section')) ||
										inject(Router).parseUrl('/app/profile'),
								],
								loadComponent: () =>
									import('./profile-edit/profile-edit.component').then(
										(m) => m.ProfileEditComponent,
									),
							},
						],
					},
				],
			},
		],
	},
];
