import { computed, inject, Service, signal } from '@angular/core';
import {
	generatePlan,
	PlannerInput,
	PlanResult,
	PlanViolation,
	validatePlan,
} from '@trainup/planner';
import {
	collection,
	doc,
	Firestore,
	getDocs,
	limit,
	query,
	serverTimestamp,
	where,
	writeBatch,
} from 'firebase/firestore';
import { AccountService } from '../account/account.service';
import { pickSetupInput } from '../account/account.util';
import { ExerciseCatalogService } from '../exercise/exercise-catalog.service';
import { FirebaseService } from '../firebase/firebase.service';
import { StoredPlan } from './plan.interface';
import { localToday, stableStringify } from './plan.util';

export class PlanValidationError extends Error {
	constructor(readonly violations: PlanViolation[]) {
		super(`Generated plan failed validation: ${violations.map((v) => v.code).join(', ')}`);
	}
}

/** The signed-in user's active plan: generate, validate, save (README §6.2). */
@Service()
export class PlanService {
	private readonly _firebase = inject(FirebaseService);
	private readonly _accountService = inject(AccountService);
	private readonly _catalog = inject(ExerciseCatalogService);

	readonly activePlan = signal<StoredPlan | null>(null);
	readonly loaded = signal(false);

	/** The saved setup or profile changed since the plan was built; offer an explicit regenerate. */
	readonly isOutdated = computed(() => {
		const plan = this.activePlan();
		const current = this._snapshot();

		return !!plan && !!current && stableStringify(_inputOf(plan.input)) !== stableStringify(current);
	});

	private _uid: string | null = null;
	private _loading: Promise<void> | null = null;

	ensureLoaded(): Promise<void> {
		const uid = this._firebase.auth?.currentUser?.uid ?? null;

		if (uid !== this._uid || !this._loading) {
			this._uid = uid;
			this._loading = this._load().catch((error: unknown) => {
				this._loading = null;
				throw error;
			});
		}

		return this._loading;
	}

	reset() {
		this._uid = null;
		this._loading = null;
		this.activePlan.set(null);
		this.loaded.set(false);
	}

	/**
	 * Builds a new plan from the saved profile and setup. A feasible plan is validated, saved as the
	 * active plan, and the previous one is kept as `superseded` (completed sessions stay intact).
	 */
	async generateAndSave(): Promise<PlanResult> {
		await this._catalog.ensureLoaded();

		const input = this._plannerInput();
		const result = generatePlan(input);

		if (!result.ok) {
			return result;
		}

		const violations = validatePlan(result.plan, input);

		if (violations.length) {
			throw new PlanValidationError(violations);
		}

		const { db, uid } = this._context();
		const batch = writeBatch(db);
		const ref = doc(collection(db, 'users', uid, 'plans'));
		const previous = this.activePlan();

		batch.set(ref, { ...result.plan, status: 'active', createdAt: serverTimestamp() });

		if (previous) {
			batch.update(doc(db, 'users', uid, 'plans', previous.id), { status: 'superseded' });
		}

		await batch.commit();
		this._loading = this._load();
		await this._loading;

		return result;
	}

	private async _load() {
		const uid = this._uid;

		if (!uid) {
			this.activePlan.set(null);
			this.loaded.set(true);
			return;
		}

		const snapshot = await getDocs(
			query(
				collection(this._db(), 'users', uid, 'plans'),
				where('status', '==', 'active'),
				limit(1),
			),
		);
		const first = snapshot.docs[0];

		this.activePlan.set(first ? ({ ...first.data(), id: first.id } as StoredPlan) : null);
		this.loaded.set(true);
	}

	private _snapshot() {
		const profile = this._accountService.profile();
		const setup = this._accountService.setup();

		if (!profile || !setup) {
			return null;
		}

		return {
			profile: {
				goal: profile.goal,
				fitnessLevel: profile.fitnessLevel,
				daysPerWeek: profile.daysPerWeek,
				sessionMinutes: profile.sessionMinutes,
				preferredDays: profile.preferredDays,
			},
			setup: pickSetupInput(setup),
			limitations: this._accountService
				.activeLimitations()
				.map((limitation) => limitation.area)
				.sort(),
		};
	}

	private _plannerInput(): PlannerInput {
		const snapshot = this._snapshot();

		if (!snapshot) {
			throw new Error('Profile and training setup must be saved before planning.');
		}

		return {
			...snapshot,
			catalog: this._catalog.exercises(),
			allowedStatuses: this._catalog.allowedStatuses,
			startDate: localToday(),
		};
	}

	private _context(): { db: Firestore; uid: string } {
		const uid = this._firebase.auth?.currentUser?.uid;

		if (!uid) {
			throw new Error('No signed-in user.');
		}

		return { db: this._db(), uid };
	}

	private _db(): Firestore {
		const db = this._firebase.firestore;

		if (!db) {
			throw new Error('Firestore is only available in the browser.');
		}

		return db;
	}
}

function _inputOf(input: StoredPlan['input']) {
	return { profile: input.profile, setup: input.setup, limitations: [...input.limitations].sort() };
}
