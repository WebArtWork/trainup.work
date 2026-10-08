import type { Exercise } from '@trainup/planner';

/** Development only: the src/data catalog including drafts. Replaced in production builds. */
export async function loadBundledCatalog(): Promise<Exercise[]> {
	return (await import('../../../data/exercise/exercises.json')).default as Exercise[];
}
