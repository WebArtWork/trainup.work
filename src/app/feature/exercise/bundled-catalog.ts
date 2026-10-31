import type { Exercise } from '@trainup/planner';

/** The src/data catalog; the expert's edits land there through git. */
export async function loadBundledCatalog(): Promise<Exercise[]> {
	return (await import('../../../data/exercise/exercises.json')).default as Exercise[];
}

/** Translated text of one exercise; the Ukrainian catalog is the source. */
export type ExerciseTranslation = Partial<
	Pick<Exercise, 'name' | 'description' | 'steps' | 'warnings' | 'techniqueNotes'>
>;

/** One file per language in src/data/exercise/i18n, keyed by exercise id. */
const TRANSLATION_LOADERS: Record<
	string,
	() => Promise<{ default: Record<string, ExerciseTranslation> }>
> = {
	cs: () => import('../../../data/exercise/i18n/cs.json'),
	de: () => import('../../../data/exercise/i18n/de.json'),
	el: () => import('../../../data/exercise/i18n/el.json'),
	en: () => import('../../../data/exercise/i18n/en.json'),
	es: () => import('../../../data/exercise/i18n/es.json'),
	fr: () => import('../../../data/exercise/i18n/fr.json'),
	hu: () => import('../../../data/exercise/i18n/hu.json'),
	it: () => import('../../../data/exercise/i18n/it.json'),
	nl: () => import('../../../data/exercise/i18n/nl.json'),
	pl: () => import('../../../data/exercise/i18n/pl.json'),
	pt: () => import('../../../data/exercise/i18n/pt.json'),
	ro: () => import('../../../data/exercise/i18n/ro.json'),
	sv: () => import('../../../data/exercise/i18n/sv.json'),
};

/** Translations for a language; Ukrainian (and any language without a file) returns none. */
export async function loadExerciseTranslations(
	language: string,
): Promise<Record<string, ExerciseTranslation>> {
	const load = TRANSLATION_LOADERS[language];

	return load ? (await load()).default : {};
}
