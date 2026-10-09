import { Routes } from '@angular/router';
import { buildRouteMeta } from '@wawjs/ngx-default';
import { companyProfile } from './feature/company/company.data';
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
		],
	},
	{
		// Signed-in app: lazy (keeps Firebase out of the landing bundle), client-rendered, never indexed.
		path: 'app',
		data: {
			meta: {
				title: 'TrainUp',
				titleSuffix: '',
				robots: 'noindex, nofollow',
			},
		},
		loadChildren: () => import('./pages/app/app-area.routes').then((m) => m.APP_AREA_ROUTES),
	},
	{
		path: '**',
		redirectTo: '',
	},
];
