import { Routes } from '@angular/router';
import { buildAbsoluteUrl, buildRouteMeta } from '@wawjs/ngx-default';
// Prerendered pages use the default language (ua) for their titles and descriptions.
import defaultTexts from '../../../data/theory/i18n/ua.json';
import { companyProfile } from '../../feature/company/company.data';
import { THEORY_CATALOG } from '../../feature/theory/theory.data';

const texts = defaultTexts as {
	ui: Record<string, string>;
	theories: Record<string, { title: string; short: string }>;
};

/** One prerendered page per theory: /theory/<slug>. A bare /theory goes to the library. */
export const THEORY_ROUTES: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: '/theories' },
	...THEORY_CATALOG.map((theory) => ({
	path: theory.slug,
	data: {
		theory: theory.slug,
		meta: {
			...buildRouteMeta(companyProfile, `/theory/${theory.slug}`),
			image: buildAbsoluteUrl(companyProfile.siteUrl, `/seo/theory/${theory.slug}.jpg`),
			title: texts.theories[theory.n].title,
			description: shorten(texts.theories[theory.n].short),
		},
	},
	loadComponent: () => import('./theory-page.component').then((m) => m.TheoryPageComponent),
	})),
];

/** The library page: /theories. */
export const THEORIES_ROUTES: Routes = [
	{
		path: '',
		pathMatch: 'full',
		data: {
			meta: {
				...buildRouteMeta(companyProfile, '/theories'),
				image: buildAbsoluteUrl(companyProfile.siteUrl, '/seo/theories.jpg'),
				title: texts.ui['title'],
				description: shorten(texts.ui['intro']),
			},
		},
		loadComponent: () => import('./theories.component').then((m) => m.TheoriesComponent),
	},
];

function shorten(text: string): string {
	if (text.length <= 160) {
		return text;
	}
	const cut = text.slice(0, 157);
	return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}
