import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
	// Public marketing and legal pages are prerendered.
	{ path: '', renderMode: RenderMode.Prerender },
	{ path: 'privacy', renderMode: RenderMode.Prerender },
	{ path: 'terms', renderMode: RenderMode.Prerender },
	{ path: 'delete-account', renderMode: RenderMode.Prerender },
	{ path: 'support', renderMode: RenderMode.Prerender },
	{
		// Signed-in app: rendered in the browser only (auth state and Firestore are client-side).
		path: '**',
		renderMode: RenderMode.Client,
	},
];
