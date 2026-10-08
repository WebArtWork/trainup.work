import type { Exercise } from '@trainup/planner';

/** Production: unreviewed drafts never ship; the catalog comes from Firestore (published only). */
export async function loadBundledCatalog(): Promise<Exercise[]> {
	return [];
}
