import { Routes } from '@angular/router';
import { buildRouteMeta } from '@wawjs/ngx-default';
import { companyProfile } from './feature/company/company.data';
import { landingGuard } from './feature/auth/landing.guard';
import { MarketingLayoutComponent } from './layouts/marketing/marketing-layout.component';

export const routes: Routes = [
	{
		path: '',
		component: MarketingLayoutComponent,
		children: [
			{
				path: '',
				pathMatch: 'full',
				data: {
					meta: {
						...buildRouteMeta(companyProfile, '/'),
						titleSuffix: '',
					},
				},
				canActivate: [landingGuard],
				loadComponent: () =>
					import('./pages/landing/landing.component').then((m) => m.LandingComponent),
			},
			{
				path: 'privacy',
				data: { document: 'privacy', meta: buildRouteMeta(companyProfile, '/privacy') },
				loadComponent: () =>
					import('./pages/legal/legal-page.component').then((m) => m.LegalPageComponent),
			},
			{
				path: 'terms',
				data: { document: 'terms', meta: buildRouteMeta(companyProfile, '/terms') },
				loadComponent: () =>
					import('./pages/legal/legal-page.component').then((m) => m.LegalPageComponent),
			},
			{
				// Public account-deletion instructions; Google Play requires a URL that works signed out.
				path: 'delete-account',
				data: {
					document: 'delete-account',
					meta: buildRouteMeta(companyProfile, '/delete-account'),
				},
				loadComponent: () =>
					import('./pages/legal/legal-page.component').then((m) => m.LegalPageComponent),
			},
			{
				// Public support contacts and FAQ; the App Store requires a Support URL.
				path: 'support',
				data: { document: 'support', meta: buildRouteMeta(companyProfile, '/support') },
				loadComponent: () =>
					import('./pages/legal/legal-page.component').then((m) => m.LegalPageComponent),
			},
		],
	},
	{
		// Signed-in app: lazy (keeps Firebase out of the landing bundle), client-rendered, never indexed.
		// Declared after the marketing pages, so `/`, `/privacy` and friends keep matching first.
		path: '',
		data: {
			meta: {
				title: 'TrainUp',
				titleSuffix: '',
				robots: 'noindex, nofollow',
			},
		},
		loadChildren: () => import('./pages/app/app-area.routes').then((m) => m.APP_AREA_ROUTES),
	},
];
