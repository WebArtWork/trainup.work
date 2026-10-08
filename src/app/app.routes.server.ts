import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
	{
		// Signed-in app: rendered in the browser only (auth state and Firestore are client-side).
		path: 'app/**',
		renderMode: RenderMode.Client,
	},
	{
		path: '**',
		renderMode: RenderMode.Prerender,
	},
];
