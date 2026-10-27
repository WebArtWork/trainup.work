import type { Exercise } from '@trainup/planner';

/** The src/data catalog; the expert's edits land there through git. */
export async function loadBundledCatalog(): Promise<Exercise[]> {
	return (await import('../../../data/exercise/exercises.json')).default as Exercise[];
}
