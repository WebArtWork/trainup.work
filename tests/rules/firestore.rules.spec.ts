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

describe('Phase 3: feedback, pauses, todos, reminders', () => {
	beforeEach(async () => {
		await env.withSecurityRulesDisabled(async (context) => {
			await setDoc(doc(context.firestore() as unknown as Firestore, 'users/alice/plans/plan1'), {
				status: 'active',
			});
		});
	});

	const feedbackSession = (changes: Record<string, unknown> = {}) => ({
		schemaVersion: 2,
		planId: 'plan1',
		dayIndex: 1,
		date: '2026-10-07',
		status: 'partial',
		durationSeconds: 1200,
		exercises: [
			{
				exerciseId: 'push-up',
				exerciseVersion: 1,
				name: 'Віджимання',
				sets: [{ status: 'skipped', reps: null, durationSeconds: null }],
			},
		],
		rpe: 8,
		pain: { areas: ['wrists'], exerciseIds: ['push-up'] },
		notes: 'Боліло зап’ястя',
		startedAt: new Date('2026-10-07T07:00:00Z'),
		completedAt: serverTimestamp(),
		...changes,
	});

	const flag = (changes: Record<string, unknown> = {}) => ({
		schemaVersion: 1,
		exerciseId: 'push-up',
		reason: 'pain',
		areas: ['wrists'],
		planId: 'plan1',
		sessionDate: '2026-10-07',
		active: true,
		createdAt: serverTimestamp(),
		resolvedAt: null,
		...changes,
	});

	it('accepts session feedback and rejects invalid RPE, pain, or notes', async () => {
		const ref = (day: number) => doc(db('alice'), `users/alice/sessions/plan1_${day}`);

		await assertSucceeds(setDoc(ref(1), feedbackSession()));
		await assertSucceeds(setDoc(ref(2), feedbackSession({ dayIndex: 2, rpe: null, pain: null, notes: '' })));
		await assertFails(setDoc(ref(3), feedbackSession({ dayIndex: 3, rpe: 11 })));
		await assertFails(setDoc(ref(4), feedbackSession({ dayIndex: 4, pain: { areas: [], exerciseIds: [] } })));
		await assertFails(
			setDoc(ref(5), feedbackSession({ dayIndex: 5, pain: { areas: ['heart'], exerciseIds: [] } })),
		);
		await assertFails(setDoc(ref(6), feedbackSession({ dayIndex: 6, notes: 'x'.repeat(501) })));
	});

	it('pauses an exercise after pain; only the user can resume it, and it is never deleted', async () => {
		const ref = doc(db('alice'), 'users/alice/exerciseFlags/push-up');

		await assertSucceeds(setDoc(ref, flag()));
		await assertFails(setDoc(doc(db('alice'), 'users/alice/exerciseFlags/squat'), flag()));
		await assertFails(updateDoc(ref, { areas: ['knees'] }));
		await assertSucceeds(updateDoc(ref, { active: false, resolvedAt: serverTimestamp() }));
		await assertFails(updateDoc(ref, { active: false, resolvedAt: serverTimestamp() }));
		await assertSucceeds(setDoc(ref, flag()));
		await assertFails(deleteDoc(ref));
		await assertFails(getDoc(doc(db('bob'), 'users/alice/exerciseFlags/push-up')));
	});

	it('validates todos and lets the owner edit and delete them', async () => {
		const ref = doc(db('alice'), 'users/alice/todos/t1');
		const todo = {
			schemaVersion: 1,
			title: 'Купити килимок',
			dueDate: '2026-10-09',
			done: false,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			completedAt: null,
		};

		await assertSucceeds(setDoc(ref, todo));
		await assertFails(setDoc(doc(db('alice'), 'users/alice/todos/t2'), { ...todo, title: '' }));
		await assertFails(setDoc(doc(db('alice'), 'users/alice/todos/t3'), { ...todo, dueDate: 'tomorrow' }));
		await assertSucceeds(
			updateDoc(ref, { done: true, completedAt: serverTimestamp(), updatedAt: serverTimestamp() }),
		);
		await assertFails(updateDoc(ref, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
		await assertFails(deleteDoc(doc(db('bob'), 'users/alice/todos/t1')));
		await assertSucceeds(deleteDoc(ref));
	});

	it('stores one workout reminder with a valid local time and days (acceptance 13)', async () => {
		const reminder = {
			schemaVersion: 1,
			type: 'workout',
			enabled: true,
			time: '18:30',
			days: ['mon', 'wed', 'fri'],
			timeZone: 'Europe/Kyiv',
			updatedAt: serverTimestamp(),
		};

		await assertSucceeds(setDoc(doc(db('alice'), 'users/alice/reminders/workout'), reminder));
		await assertSucceeds(
			setDoc(doc(db('alice'), 'users/alice/reminders/workout'), { ...reminder, enabled: false }),
		);
		await assertFails(setDoc(doc(db('alice'), 'users/alice/reminders/other'), reminder));
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice/reminders/workout'), { ...reminder, time: '25:00' }),
		);
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice/reminders/workout'), { ...reminder, days: ['someday'] }),
		);
	});
});

describe('server-owned collections', () => {
	it('keeps AI connections read-only for clients', async () => {
		await assertFails(
			setDoc(doc(db('alice'), 'users/alice/aiConnections/openai'), { secretRef: 'x' }),
		);
	});
});

describe('custom exercises', () => {
	beforeEach(async () => {
		await env.withSecurityRulesDisabled(async (context) => {
			const admin = context.firestore() as unknown as Firestore;

			await setDoc(doc(admin, 'users/alice/customExercises/custom-wall-sit-a1b2c3'), {
				name: 'Wall sit',
			});
		});
	});

	it('lets only the owner read them', async () => {
		const path = 'users/alice/customExercises/custom-wall-sit-a1b2c3';

		await assertSucceeds(getDoc(doc(db('alice'), path)));
		await assertFails(getDoc(doc(db('bob'), path)));
	});

	it('keeps them server-written: clients cannot create, change or delete them', async () => {
		const path = 'users/alice/customExercises/custom-wall-sit-a1b2c3';

		await assertFails(setDoc(doc(db('alice'), 'users/alice/customExercises/custom-x-000000'), { name: 'x' }));
		await assertFails(setDoc(doc(db('alice'), path), { name: 'changed' }));
		await assertFails(deleteDoc(doc(db('alice'), path)));
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

describe('account deletion', () => {
	const planRef = (uid: string) => doc(db(uid), 'users/alice/plans/plan1');
	const savePlan = () =>
		setDoc(planRef('alice'), {
			...generatedPlan(),
			status: 'active',
			createdAt: serverTimestamp(),
		});
	const flag = () => ({
		schemaVersion: 1,
		exerciseId: 'push-up',
		reason: 'pain',
		areas: ['wrists'],
		planId: 'plan1',
		sessionDate: '2026-10-07',
		active: true,
		createdAt: serverTimestamp(),
		resolvedAt: null,
	});

	it('keeps immutable documents undeletable until the user requests deletion', async () => {
		await seedAlice();
		await assertSucceeds(savePlan());
		await assertSucceeds(setDoc(doc(db('alice'), 'users/alice/trainingSetups/primary'), setup()));
		await assertSucceeds(
			setDoc(doc(db('alice'), 'users/alice/exerciseFlags/push-up'), flag()),
		);

		await assertFails(deleteDoc(planRef('alice')));
		await assertFails(deleteDoc(doc(db('alice'), 'users/alice/exerciseFlags/push-up')));
		await assertFails(deleteDoc(doc(db('alice'), 'users/alice')));
	});

	it('lets the owner delete everything once deletion is requested, profile last', async () => {
		await seedAlice();
		await assertSucceeds(savePlan());
		await assertSucceeds(setDoc(doc(db('alice'), 'users/alice/trainingSetups/primary'), setup()));
		await assertSucceeds(
			setDoc(doc(db('alice'), 'users/alice/exerciseFlags/push-up'), flag()),
		);
		await assertSucceeds(
			updateDoc(doc(db('alice'), 'users/alice'), {
				deletionRequestedAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			}),
		);

		await assertSucceeds(deleteDoc(planRef('alice')));
		await assertSucceeds(deleteDoc(doc(db('alice'), 'users/alice/exerciseFlags/push-up')));
		await assertSucceeds(deleteDoc(doc(db('alice'), 'users/alice/trainingSetups/primary')));
		await assertSucceeds(deleteDoc(doc(db('alice'), 'users/alice')));
	});

	it('does not let another user delete or flag someone else for deletion', async () => {
		await seedAlice();
		await assertFails(
			updateDoc(doc(db('bob'), 'users/alice'), {
				deletionRequestedAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			}),
		);
		await assertFails(deleteDoc(doc(db('bob'), 'users/alice')));
	});

	it('rejects a deletion marker that is not a timestamp', async () => {
		await seedAlice();
		await assertFails(
			updateDoc(doc(db('alice'), 'users/alice'), {
				deletionRequestedAt: 'yes',
				updatedAt: serverTimestamp(),
			}),
		);
	});
});
