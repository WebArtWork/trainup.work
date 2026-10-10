import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, Routes } from '@angular/router';
import { isAccountSection } from '../../feature/account/account.interface';
import { appPageMeta, exercisePageMeta } from './app-page-meta';
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
				data: { meta: appPageMeta('sign-in') },
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
						// Consent screen for an AI assistant that started OAuth at the WAW API.
						path: 'connect',
						data: { meta: appPageMeta('connect') },
						loadComponent: () =>
							import('./connect/connect.component').then((m) => m.ConnectComponent),
					},
					{
						path: 'onboarding',
						data: { meta: appPageMeta('onboarding') },
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
								data: { meta: appPageMeta('today'), barTitle: true },
								loadComponent: () =>
									import('./today/today.component').then((m) => m.TodayComponent),
							},
							{
								path: 'workout',
								data: { meta: appPageMeta('workout'), barTitle: true },
								loadComponent: () =>
									import('./workout/workout.component').then(
										(m) => m.WorkoutComponent,
									),
							},
							{
								path: 'workout/:day',
								data: { meta: appPageMeta('workout-run') },
								loadComponent: () =>
									import('./workout-run/workout-run.component').then(
										(m) => m.WorkoutRunComponent,
									),
							},
							{
								path: 'plan',
								data: { meta: appPageMeta('plan'), barTitle: true },
								loadComponent: () =>
									import('./plan/plan.component').then((m) => m.PlanComponent),
							},
							{
								path: 'history',
								data: { meta: appPageMeta('history'), barTitle: true },
								loadComponent: () =>
									import('./history/history.component').then(
										(m) => m.HistoryComponent,
									),
							},
							{
								path: 'todos',
								data: { meta: appPageMeta('todos'), barTitle: true },
								loadComponent: () =>
									import('./todos/todos.component').then((m) => m.TodosComponent),
							},
							{
								path: 'reminders',
								data: { meta: appPageMeta('reminders'), barTitle: true },
								loadComponent: () =>
									import('./reminders/reminders.component').then(
										(m) => m.RemindersComponent,
									),
							},
							{
								path: 'explore',
								data: { meta: appPageMeta('explore'), barTitle: true },
								loadComponent: () =>
									import('./explore/explore.component').then(
										(m) => m.ExploreComponent,
									),
							},
							{
								path: 'explore/:id',
								resolve: {
									meta: (route: ActivatedRouteSnapshot) =>
										exercisePageMeta(route.paramMap.get('id')),
								},
								loadComponent: () =>
									import('./exercise-detail/exercise-detail.component').then(
										(m) => m.ExerciseDetailComponent,
									),
							},
							{
								path: 'profile',
								data: { meta: appPageMeta('profile') },
								loadComponent: () =>
									import('./profile/profile.component').then(
										(m) => m.ProfileComponent,
									),
							},
							{
								path: 'settings',
								data: { meta: appPageMeta('settings'), barTitle: true },
								loadComponent: () =>
									import('./settings/settings.component').then(
										(m) => m.SettingsComponent,
									),
							},
							{
								path: 'settings/ai',
								data: { meta: appPageMeta('ai-settings'), barTitle: true },
								loadComponent: () =>
									import('./ai-settings/ai-settings.component').then(
										(m) => m.AiSettingsComponent,
									),
							},
							{
								path: 'data',
								data: { meta: appPageMeta('data'), barTitle: true },
								loadComponent: () =>
									import('./data-privacy/data-privacy.component').then(
										(m) => m.DataPrivacyComponent,
									),
							},
							{
								path: 'profile/:section',
								data: { barTitle: true },
								resolve: {
									meta: (route: ActivatedRouteSnapshot) => {
										const section = route.paramMap.get('section');
										return isAccountSection(section)
											? appPageMeta(`profile-${section}`)
											: appPageMeta('profile');
									},
								},
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
							{
								path: '**',
								data: { meta: appPageMeta('not-found'), barTitle: true },
								loadComponent: () =>
									import('./not-found/not-found.component').then(
										(m) => m.NotFoundComponent,
									),
							},
						],
					},
				],
			},
		],
	},
];
