/** Collections under `users/{uid}` that the user owns and can export or delete. */
export const USER_DATA_COLLECTIONS = [
	'trainingSetups',
	'limitations',
	'plans',
	'sessions',
	'exerciseFlags',
	'todos',
	'reminders',
] as const;

export type UserDataCollection = (typeof USER_DATA_COLLECTIONS)[number];

export const EXPORT_SCHEMA_VERSION = 1;

export interface UserDataExport {
	app: 'TrainUp';
	schemaVersion: number;
	exportedAt: string;
	profile: Record<string, unknown>;
	collections: Record<UserDataCollection, Record<string, unknown>[]>;
}

interface TimestampLike {
	toDate(): Date;
}

function _isTimestampLike(value: unknown): value is TimestampLike {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as TimestampLike).toDate === 'function'
	);
}

/** Converts Firestore timestamps to ISO strings so the export is plain, portable JSON. */
export function toPlainJson(value: unknown): unknown {
	if (_isTimestampLike(value)) {
		return value.toDate().toISOString();
	}

	if (Array.isArray(value)) {
		return value.map((item) => toPlainJson(item));
	}

	if (typeof value === 'object' && value !== null) {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, toPlainJson(item)]),
		);
	}

	return value;
}

export function buildUserDataExport(
	profile: Record<string, unknown>,
	collections: Partial<
		Record<UserDataCollection, { id: string; data: Record<string, unknown> }[]>
	>,
	now = new Date(),
): UserDataExport {
	return {
		app: 'TrainUp',
		schemaVersion: EXPORT_SCHEMA_VERSION,
		exportedAt: now.toISOString(),
		profile: toPlainJson(profile) as Record<string, unknown>,
		collections: Object.fromEntries(
			USER_DATA_COLLECTIONS.map((name) => [
				name,
				(collections[name] ?? []).map((item) => ({
					id: item.id,
					...(toPlainJson(item.data) as Record<string, unknown>),
				})),
			]),
		) as unknown as UserDataExport['collections'],
	};
}

export function exportFileName(now = new Date()): string {
	return `trainup-data-${now.toISOString().slice(0, 10)}.json`;
}

/** Splits `items` into groups of at most `size` (Firestore batches allow 500 writes). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
	const groups: T[][] = [];

	for (let index = 0; index < items.length; index += size) {
		groups.push(items.slice(index, index + size));
	}

	return groups;
}
