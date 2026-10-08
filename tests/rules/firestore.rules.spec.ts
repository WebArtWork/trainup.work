import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
	RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import {
	deleteDoc,
	doc,
	Firestore,
	getDoc,
	serverTimestamp,
	setDoc,
	updateDoc,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { Exercise, generatePlan } from '../../planner/src/index';
import catalog from '../../src/data/exercise/exercises.json';
import { pickProfileInput, pickSetupInput } from '../../src/app/feature/account/account.util';
import { LIMITATION_SCHEMA_VERSION } from '../../src/app/feature/limitation/limitation.interface';
import { EMPTY_PROFILE_INPUT } from '../../src/app/feature/profile/profile.const';
import { PROFILE_SCHEMA_VERSION } from '../../src/app/feature/profile/profile.interface';
import { EMPTY_TRAINING_SETUP_INPUT } from '../../src/app/feature/training-setup/training-setup.const';
import { TRAINING_SETUP_SCHEMA_VERSION } from '../../src/app/feature/training-setup/training-setup.interface';

let env: RulesTestEnvironment;

const db = (uid: string | null, claims: Record<string, unknown> = {}): Firestore =>
	(uid
		? env.authenticatedContext(uid, claims).firestore()
		: env.unauthenticatedContext().firestore()) as unknown as Firestore;

// Payloads are built from the app's own defaults and pick helpers, so rules and app stay in sync.
const newProfile = () => ({
	...pickProfileInput(EMPTY_PROFILE_INPUT),
	schemaVersion: PROFILE_SCHEMA_VERSION,
	displayName: 'Alice',
	email: 'alice@example.com',
	photoUrl: '',
	timeZone: 'Europe/Kyiv',
	language: 'ua',
	onboardingCompletedAt: null,
	createdAt: serverTimestamp(),
	updatedAt: serverTimestamp(),
});

const setup = () => ({
	...pickSetupInput({
		...EMPTY_TRAINING_SETUP_INPUT,
		equipment: [{ type: 'dumbbells', weightsKg: [4, 8] }],
		location: 'home',
		floor: { preset: 'medium', lengthM: null, widthM: null },
	}),
	schemaVersion: TRAINING_SETUP_SCHEMA_VERSION,
	active: true,
	updatedAt: serverTimestamp(),
});

const limitation = (area = 'knees') => ({
	schemaVersion: LIMITATION_SCHEMA_VERSION,
	area,
	note: '',
	active: true,
	updatedAt: serverTimestamp(),
});

/** A real plan from the shared planner, exactly as the app saves it. */
function generatedPlan() {
	const result = generatePlan({
		profile: {
			goal: 'general-fitness',
			fitnessLevel: 'beginner',
			daysPerWeek: 3,
			sessionMinutes: 30,
			preferredDays: [],
		},
		setup: setup(),
		limitations: [],
		catalog: catalog as Exercise[],
		startDate: '2026-10-05',
		allowedStatuses: ['draft', 'published'],
	});

	if (!result.ok) {
		throw new Error(`fixture plan is infeasible: ${result.infeasibility.code}`);
	}

	return result.plan;
}

async function seedAlice() {
	await assertSucceeds(setDoc(doc(db('alice'), 'users/alice'), newProfile()));
}

beforeAll(async () => {
	env = await initializeTestEnvironment({
		projectId: 'demo-trainup',
		firestore: {
			rules: readFileSync('firestore.rules', 'utf8'),
			host: '127.0.0.1',
			port: 8080,
		},
	});
});

beforeEach(async () => {
	await env.clearFirestore();
});

afterAll(async () => {
	await env.cleanup();
});

describe('users/{uid}', () => {
	it('lets a user create and read their own profile', async () => {
		await seedAlice();
		await assertSucceeds(getDoc(doc(db('alice'), 'users/alice')));
	});

	it('isolates users from each other (acceptance test 12)', async () => {
		await seedAlice();

		await assertFails(getDoc(doc(db('bob'), 'users/alice')));
		await assertFails(updateDoc(doc(db('bob'), 'users/alice'), { goal: 'build-strength' }));
		await assertFails(setDoc(doc(db('bob'), 'users/alice/trainingSetups/primary'), setup()));
		await assertFails(setDoc(doc(db('bob'), 'users/alice/limitations/knees'), limitation()));
		await assertFails(getDoc(doc(db(null), 'users/alice')));
	});

	it('rejects unknown fields and out-of-range values', async () => {
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice'), { ...newProfile(), isAdmin: true }),
		);
		await assertFails(setDoc(doc(db('alice'), 'users/alice'), { ...newProfile(), age: 5 }));
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice'), { ...newProfile(), goal: 'bulk' }),
		);
	});

	it('does not allow skipping onboarding at creation', async () => {
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice'), {
				...newProfile(),
				onboardingCompletedAt: serverTimestamp(),
			}),
		);
	});

	it('allows profile edits but keeps createdAt immutable', async () => {
		await seedAlice();
		const ref = doc(db('alice'), 'users/alice');

		await assertSucceeds(
			updateDoc(ref, { goal: 'build-strength', age: 30, updatedAt: serverTimestamp() }),
		);
		await assertFails(
			updateDoc(ref, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
		);
		await assertFails(updateDoc(ref, { goal: 'general-fitness' }));
	});

	it('sets onboardingCompletedAt once, to the server time', async () => {
		await seedAlice();
		const ref = doc(db('alice'), 'users/alice');

		await assertFails(
			updateDoc(ref, { onboardingCompletedAt: new Date(0), updatedAt: serverTimestamp() }),
		);
		await assertSucceeds(
			updateDoc(ref, {
				onboardingCompletedAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			}),
		);
		await assertFails(
			updateDoc(ref, { onboardingCompletedAt: null, updatedAt: serverTimestamp() }),
		);
	});

	it('does not let clients delete their profile', async () => {
		await seedAlice();
		await assertFails(deleteDoc(doc(db('alice'), 'users/alice')));
	});
});

describe('users/{uid}/trainingSetups', () => {
	it('accepts a valid primary setup', async () => {
		await assertSucceeds(
			setDoc(doc(db('alice'), 'users/alice/trainingSetups/primary'), setup()),
		);
		await assertSucceeds(getDoc(doc(db('alice'), 'users/alice/trainingSetups/primary')));
	});

	it('only allows the single primary setup in the MVP', async () => {
		await assertFails(setDoc(doc(db('alice'), 'users/alice/trainingSetups/gym'), setup()));
	});

	it('rejects contradictory and invalid space data', async () => {
		const ref = doc(db('alice'), 'users/alice/trainingSetups/primary');

		await assertFails(setDoc(ref, { ...setup(), noEquipment: true }));
		await assertFails(setDoc(ref, { ...setup(), canLieDown: 'maybe' }));
		await assertFails(
			setDoc(ref, { ...setup(), floor: { preset: 'huge', lengthM: null, widthM: null } }),
		);
		await assertFails(setDoc(ref, { ...setup(), ceiling: { preset: 'normal', heightM: 0.2 } }));
	});
});

describe('users/{uid}/limitations', () => {
	it('accepts a limitation stored under its own area id', async () => {
		await assertSucceeds(
			setDoc(doc(db('alice'), 'users/alice/limitations/knees'), limitation()),
		);
	});

	it('rejects mismatched ids, unknown areas, and long notes', async () => {
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice/limitations/knees'), limitation('shoulders')),
		);
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice/limitations/heart'), limitation('heart')),
		);
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice/limitations/knees'), {
				...limitation(),
				note: 'x'.repeat(301),
			}),
		);
	});

	it('deactivates instead of deleting', async () => {
		const ref = doc(db('alice'), 'users/alice/limitations/knees');

		await assertSucceeds(setDoc(ref, limitation()));
		await assertSucceeds(updateDoc(ref, { active: false, updatedAt: serverTimestamp() }));
		await assertFails(deleteDoc(ref));
	});
});

describe('users/{uid}/plans', () => {
	const planRef = (uid: string, id = 'plan1') => doc(db(uid), `users/alice/plans/${id}`);
	const savePlan = (uid = 'alice', id = 'plan1', changes: Record<string, unknown> = {}) =>
		setDoc(planRef(uid, id), {
			...generatedPlan(),
			status: 'active',
			createdAt: serverTimestamp(),
			...changes,
		});

	it('lets the owner save a generated plan and nobody else read or write it', async () => {
		await assertSucceeds(savePlan());
		await assertSucceeds(getDoc(planRef('alice')));
		await assertFails(getDoc(planRef('bob')));
		await assertFails(savePlan('bob', 'plan2'));
	});

	it('only accepts active calculator plans with the expected fields', async () => {
		await assertFails(savePlan('alice', 'p-ai', { provenance: 'openai' }));
		await assertFails(savePlan('alice', 'p-old', { status: 'superseded' }));
		await assertFails(savePlan('alice', 'p-extra', { approvedByServer: true }));
		await assertFails(savePlan('alice', 'p-empty', { days: [] }));
		await assertFails(savePlan('alice', 'p-time', { createdAt: new Date(0) }));
	});

	it('only allows retiring the active plan; plans are otherwise immutable', async () => {
		await assertSucceeds(savePlan());
		await assertFails(updateDoc(planRef('alice'), { sessionMinutes: 5 }));
		await assertFails(updateDoc(planRef('alice'), { status: 'superseded', weeks: 8 }));
		await assertSucceeds(updateDoc(planRef('alice'), { status: 'superseded' }));
		await assertFails(updateDoc(planRef('alice'), { status: 'active' }));
		await assertFails(deleteDoc(planRef('alice')));
	});
});

describe('users/{uid}/sessions', () => {
	const session = (changes: Record<string, unknown> = {}) => ({
		schemaVersion: 1,
		planId: 'plan1',
		dayIndex: 0,
		date: '2026-10-05',
		status: 'partial',
		durationSeconds: 1500,
		exercises: [
			{
				exerciseId: 'glute-bridge',
				exerciseVersion: 1,
				name: 'Сідничний міст',
				sets: [
					{ status: 'done', reps: 12, durationSeconds: null },
					{ status: 'skipped', reps: null, durationSeconds: null },
				],
			},
		],
		startedAt: new Date('2026-10-05T07:00:00Z'),
		completedAt: serverTimestamp(),
		...changes,
	});

	beforeEach(async () => {
		await env.withSecurityRulesDisabled(async (context) => {
			await setDoc(doc(context.firestore() as unknown as Firestore, 'users/alice/plans/plan1'), {
				status: 'active',
			});
		});
	});

	it('records a finished workout for an existing plan day', async () => {
		await assertSucceeds(setDoc(doc(db('alice'), 'users/alice/sessions/plan1_0'), session()));
		await assertFails(getDoc(doc(db('bob'), 'users/alice/sessions/plan1_0')));
	});

	it('rejects mismatched ids, unknown plans, and other users', async () => {
		await assertFails(setDoc(doc(db('alice'), 'users/alice/sessions/plan1_3'), session()));
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice/sessions/ghost_0'), session({ planId: 'ghost' })),
		);
		await assertFails(setDoc(doc(db('bob'), 'users/alice/sessions/plan1_0'), session()));
	});

	it('keeps completed history immutable (acceptance test 10)', async () => {
		const ref = doc(db('alice'), 'users/alice/sessions/plan1_0');

		await assertSucceeds(setDoc(ref, session()));
		await assertFails(setDoc(ref, session({ status: 'completed' })));
		await assertFails(updateDoc(ref, { durationSeconds: 10 }));
		await assertFails(deleteDoc(ref));
	});
});

describe('server-owned collections', () => {
	it('keeps AI connections read-only for clients', async () => {
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice/aiConnections/openai'), { secretRef: 'x' }),
		);
	});
});

describe('exercises', () => {
	beforeEach(async () => {
		await env.withSecurityRulesDisabled(async (context) => {
			const admin = context.firestore() as unknown as Firestore;

			await setDoc(doc(admin, 'exercises/squat'), { status: 'published' });
			await setDoc(doc(admin, 'exercises/draft'), { status: 'draft' });
		});
	});

	it('shows only published exercises to signed-in users', async () => {
		await assertSucceeds(getDoc(doc(db('alice'), 'exercises/squat')));
		await assertFails(getDoc(doc(db('alice'), 'exercises/draft')));
		await assertFails(getDoc(doc(db(null), 'exercises/squat')));
	});

	it('limits catalog writes to admins', async () => {
		await assertFails(setDoc(doc(db('alice'), 'exercises/new'), { status: 'published' }));
		await assertSucceeds(
			setDoc(doc(db('admin', { admin: true }), 'exercises/new'), { status: 'draft' }),
		);
		await assertSucceeds(getDoc(doc(db('admin', { admin: true }), 'exercises/draft')));
	});
});
