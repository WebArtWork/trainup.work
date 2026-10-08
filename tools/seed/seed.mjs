// Syncs Firestore with the documents kept in src/data (the source of truth, reviewed via git).
//
// Usage:
//   npm run seed                  validate, then upsert every document that changed
//   npm run seed -- --dry-run     show what would change, write nothing
//   npm run seed -- --prune       also delete Firestore documents that are no longer in src/data
//
// Credentials: set GOOGLE_APPLICATION_CREDENTIALS to a service-account key for the project, or put
// the key at ./service-account.json (git-ignored). Never commit the key.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Every Firestore collection that is managed from src/data. Add new seed data here. */
const SOURCES = [
	{ file: 'src/data/exercise/exercises.json', collection: 'exercises', idField: 'id' },
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const prune = args.has('--prune');
const projectId = JSON.parse(readFileSync(path.join(rootDir, '.firebaserc'), 'utf8')).projects.default;

function credentials() {
	const keyFile =
		process.env.GOOGLE_APPLICATION_CREDENTIALS ?? path.join(rootDir, 'service-account.json');

	if (!existsSync(keyFile)) {
		console.error(
			`No service-account key found at ${keyFile}.\n` +
				'Create one in Firebase console → Project settings → Service accounts, then set ' +
				'GOOGLE_APPLICATION_CREDENTIALS or save it as service-account.json (git-ignored).',
		);
		process.exit(1);
	}

	return cert(JSON.parse(readFileSync(keyFile, 'utf8')));
}

/** Firestore rejects arrays nested directly inside arrays; catch it before the write fails midway. */
function findNestedArray(value, trail) {
	if (Array.isArray(value)) {
		for (const [i, item] of value.entries()) {
			if (Array.isArray(item)) return `${trail}[${i}]`;
			const nested = findNestedArray(item, `${trail}[${i}]`);
			if (nested) return nested;
		}
	} else if (value && typeof value === 'object') {
		for (const [key, item] of Object.entries(value)) {
			const nested = findNestedArray(item, `${trail}.${key}`);
			if (nested) return nested;
		}
	}

	return null;
}

function loadSource(source) {
	const docs = JSON.parse(readFileSync(path.join(rootDir, source.file), 'utf8'));
	const ids = new Set();

	if (!Array.isArray(docs)) {
		throw new Error(`${source.file} must contain a JSON array`);
	}

	for (const doc of docs) {
		const id = doc[source.idField];

		if (typeof id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(id)) {
			throw new Error(`${source.file}: invalid ${source.idField} ${JSON.stringify(id)}`);
		}

		if (ids.has(id)) {
			throw new Error(`${source.file}: duplicate ${source.idField} "${id}"`);
		}

		const nested = findNestedArray(doc, id);

		if (nested) {
			throw new Error(`${source.file}: Firestore can't store an array inside an array (${nested})`);
		}

		ids.add(id);
	}

	return docs;
}

async function syncSource(db, source) {
	const docs = loadSource(source);
	const existing = new Map(
		(await db.collection(source.collection).get()).docs.map((snapshot) => [snapshot.id, snapshot.data()]),
	);
	const writes = [];
	const counts = { created: 0, updated: 0, unchanged: 0, deleted: 0, extra: 0 };

	for (const doc of docs) {
		const id = doc[source.idField];
		const current = existing.get(id);

		existing.delete(id);

		if (!current) {
			counts.created++;
			writes.push({ type: 'set', id, doc, label: 'create' });
		} else if (!isDeepStrictEqual(current, doc)) {
			counts.updated++;
			writes.push({ type: 'set', id, doc, label: 'update' });
		} else {
			counts.unchanged++;
		}
	}

	for (const id of existing.keys()) {
		if (prune) {
			counts.deleted++;
			writes.push({ type: 'delete', id, label: 'delete' });
		} else {
			counts.extra++;
			console.log(`  ! ${source.collection}/${id} exists in Firestore but not in ${source.file} (use --prune to delete)`);
		}
	}

	for (const write of writes) {
		console.log(`  ${dryRun ? '(dry run) ' : ''}${write.label} ${source.collection}/${write.id}`);
	}

	if (!dryRun) {
		// Batches are limited to 500 operations.
		for (let start = 0; start < writes.length; start += 400) {
			const batch = db.batch();

			for (const write of writes.slice(start, start + 400)) {
				const ref = db.collection(source.collection).doc(write.id);

				if (write.type === 'set') batch.set(ref, write.doc);
				else batch.delete(ref);
			}

			await batch.commit();
		}
	}

	return counts;
}

// Against the emulator (FIRESTORE_EMULATOR_HOST set) no key is needed; useful for trying a seed.
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const db = getFirestore(
	initializeApp(emulator ? { projectId } : { credential: credentials(), projectId }),
);

console.log(
	`Seeding project ${projectId}${emulator ? ` on emulator ${emulator}` : ''}${dryRun ? ' (dry run)' : ''}`,
);

for (const source of SOURCES) {
	console.log(`\n${source.file} → ${source.collection}`);
	const counts = await syncSource(db, source);
	console.log(
		`  ${counts.created} created, ${counts.updated} updated, ${counts.unchanged} unchanged, ` +
			`${counts.deleted} deleted, ${counts.extra} only in Firestore`,
	);
}
