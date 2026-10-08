import { inject, Service, signal } from '@angular/core';
import {
	collection,
	doc,
	Firestore,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	Timestamp,
	where,
} from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import {
	SESSION_SCHEMA_VERSION,
	SessionExercise,
	sessionId,
	WorkoutSession,
} from './workout-session.interface';

export interface FinishedWorkout {
	planId: string;
	dayIndex: number;
	date: string;
	startedAt: Date;
	exercises: SessionExercise[];
}

const HISTORY_LIMIT = 50;

@Service()
export class WorkoutSessionService {
	private readonly _firebase = inject(FirebaseService);

	/** Completed sessions of the active plan, by plan day index. */
	readonly planSessions = signal<Map<number, WorkoutSession>>(new Map());
	readonly history = signal<WorkoutSession[]>([]);

	async loadForPlan(planId: string): Promise<void> {
		const { db, uid } = this._context();
		const snapshot = await getDocs(
			query(collection(db, 'users', uid, 'sessions'), where('planId', '==', planId)),
		);

		this.planSessions.set(
			new Map(
				snapshot.docs.map((item) => {
					const session = item.data() as WorkoutSession;

					return [session.dayIndex, session] as const;
				}),
			),
		);
	}

	async loadHistory(): Promise<void> {
		const { db, uid } = this._context();
		const snapshot = await getDocs(
			query(
				collection(db, 'users', uid, 'sessions'),
				orderBy('completedAt', 'desc'),
				limit(HISTORY_LIMIT),
			),
		);

		this.history.set(snapshot.docs.map((item) => item.data() as WorkoutSession));
	}

	async save(workout: FinishedWorkout): Promise<void> {
		const { db, uid } = this._context();
		const sets = workout.exercises.flatMap((exercise) => exercise.sets);
		const session: Omit<WorkoutSession, 'completedAt'> = {
			schemaVersion: SESSION_SCHEMA_VERSION,
			planId: workout.planId,
			dayIndex: workout.dayIndex,
			date: workout.date,
			status: sets.every((set) => set.status === 'done') ? 'completed' : 'partial',
			durationSeconds: Math.max(0, Math.round((Date.now() - workout.startedAt.getTime()) / 1000)),
			exercises: workout.exercises,
			startedAt: Timestamp.fromDate(workout.startedAt),
		};

		await setDoc(doc(db, 'users', uid, 'sessions', sessionId(workout.planId, workout.dayIndex)), {
			...session,
			completedAt: serverTimestamp(),
		});

		const saved = { ...session, completedAt: Timestamp.now() };

		this.planSessions.update((sessions) => new Map(sessions).set(workout.dayIndex, saved));
	}

	reset() {
		this.planSessions.set(new Map());
		this.history.set([]);
	}

	private _context(): { db: Firestore; uid: string } {
		const db = this._firebase.firestore;
		const uid = this._firebase.auth?.currentUser?.uid;

		if (!db || !uid) {
			throw new Error('No signed-in user.');
		}

		return { db, uid };
	}
}
