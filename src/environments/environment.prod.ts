export const environment: {
	apiUrl: string;
	appVersion: string;
	production: boolean;
	companyId: string;
	defaultLanguage: string;
	languages: AppLanguage[];
	firebase: FirebaseConfig;
	/**
	 * `firestore`: published exercises only (production).
	 * `bundled`: src/data/exercise/exercises.json including drafts, for development before review.
	 */
	exerciseSource: 'firestore' | 'bundled';
	/** Feature flags: expose only what actually works (README §9). */
	features: FeatureFlags;
} = {
	apiUrl: 'https://it.webart.work',
	appVersion: '1.0.0',
	production: true,
	companyId: '',
	defaultLanguage: 'ua',
	languages: [
		{
			code: 'ua',
			name: 'Ukrainian',
			nativeName: 'Українська',
			flagSrc: 'flags/ukraine.svg',
			htmlLang: 'uk',
			population: 35,
		},
		{
			code: 'en',
			name: 'English',
			nativeName: 'English',
			flagSrc: 'flags/united-kingdom.svg',
			htmlLang: 'en',
			population: 280,
		},
		{
			code: 'de',
			name: 'German',
			nativeName: 'Deutsch',
			flagSrc: 'flags/germany.svg',
			htmlLang: 'de',
			population: 130,
		},
		{
			code: 'fr',
			name: 'French',
			nativeName: 'Français',
			flagSrc: 'flags/france.svg',
			htmlLang: 'fr',
			population: 110,
		},
		{
			code: 'pl',
			name: 'Polish',
			nativeName: 'Polski',
			flagSrc: 'flags/poland.svg',
			htmlLang: 'pl',
			population: 45,
		},
		{
			code: 'ro',
			name: 'Romanian',
			nativeName: 'Română',
			flagSrc: 'flags/romania.svg',
			htmlLang: 'ro',
			population: 28,
		},
		{
			code: 'hu',
			name: 'Hungarian',
			nativeName: 'Magyar',
			flagSrc: 'flags/hungary.svg',
			htmlLang: 'hu',
			population: 13,
		},
		{
			code: 'el',
			name: 'Greek',
			nativeName: 'Ελληνικά',
			flagSrc: 'flags/greece.svg',
			htmlLang: 'el',
			population: 13,
		},
		{
			code: 'cs',
			name: 'Czech',
			nativeName: 'Čeština',
			flagSrc: 'flags/czechia.svg',
			htmlLang: 'cs',
			population: 12,
		},
		{
			code: 'it',
			name: 'Italian',
			nativeName: 'Italiano',
			flagSrc: 'flags/italy.svg',
			htmlLang: 'it',
			population: 70,
		},
		{
			code: 'es',
			name: 'Spanish',
			nativeName: 'Español',
			flagSrc: 'flags/spain.svg',
			htmlLang: 'es',
			population: 75,
		},
		{
			code: 'nl',
			name: 'Dutch',
			nativeName: 'Nederlands',
			flagSrc: 'flags/netherlands.svg',
			htmlLang: 'nl',
			population: 25,
		},
		{
			code: 'pt',
			name: 'Portuguese',
			nativeName: 'Português',
			flagSrc: 'flags/portugal.svg',
			htmlLang: 'pt',
			population: 15,
		},
		{
			code: 'sv',
			name: 'Swedish',
			nativeName: 'Svenska',
			flagSrc: 'flags/sweden.svg',
			htmlLang: 'sv',
			population: 12,
		},
	],
	firebase: {
		apiKey: 'AIzaSyBwh-2OzfgRkfmikdyEN8drN7Cbs-cIGL4',
		authDomain: 'train-up-work.firebaseapp.com',
		projectId: 'train-up-work',
		storageBucket: 'train-up-work.firebasestorage.app',
		messagingSenderId: '663824678144',
		appId: '1:663824678144:web:b22a21e128645d8dda47e5',
		measurementId: 'G-CHM8EMF4KJ',
	},
	exerciseSource: 'firestore',
	features: {
		ai: false,
		aiAppProvided: false,
		aiApiKey: false,
	},
};

export interface FeatureFlags {
	/** Shows the AI section with its connection methods; off keeps the settings screen rule-based only. */
	ai: boolean;
	/** TrainUp's own server-side provider credential (needs a working WAW API endpoint). */
	aiAppProvided: boolean;
	/** The user's own provider API key (needs a working WAW API endpoint). */
	aiApiKey: boolean;
}

export interface FirebaseConfig {
	apiKey: string;
	authDomain: string;
	projectId: string;
	storageBucket: string;
	messagingSenderId: string;
	appId: string;
	measurementId: string;
}

export interface AppLanguage {
	code: string;
	name: string;
	nativeName: string;
	flagSrc: string;
	htmlLang: string;
	population: number;
}
