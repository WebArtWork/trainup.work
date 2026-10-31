import { environment as environmentProd } from './environment.prod';

/** Capacitor builds (`npm run build`): the same production setup, but the app opens directly, no landing page. */
export const environment: typeof environmentProd = {
	...environmentProd,
	mobile: true,
};
