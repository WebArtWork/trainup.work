import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service, signal } from '@angular/core';
import type { Weekday } from '@trainup/planner';
import { TranslateService } from '@wawjs/ngx-translate';
import { doc, Firestore, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { PlanService } from '../plan/plan.service';
import { localToday } from '../plan/plan.util';
import { WorkoutSessionService } from '../workout-session/workout-session.service';
import { REMINDER_SCHEMA_VERSION, WORKOUT_REMINDER_ID, WorkoutReminder } from './reminder.interface';
import { deviceTimeZone, nextReminder } from './reminder.util';

export type NotificationState = NotificationPermission | 'unsupported';

/** Long timers drift or get throttled; re-check at least this often. */
const MAX_TIMER_MS = 60 * 60 * 1000;

/**
 * Workout reminder settings plus delivery while TrainUp is open in the browser.
 * Reminders while the app is closed need push (WAW API) or Capacitor local notifications (Phase 5);
 * both can replace `_deliver()` without changing the settings model.
 */
@Service()
export class ReminderService {
	private readonly _firebase = inject(FirebaseService);
	private readonly _planService = inject(PlanService);
	private readonly _sessionService = inject(WorkoutSessionService);
	private readonly _translateService = inject(TranslateService);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	readonly reminder = signal<WorkoutReminder | null>(null);
	readonly permission = signal<NotificationState>(this._readPermission());

	private _timer: ReturnType<typeof setTimeout> | null = null;
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

	async save(settings: { enabled: boolean; time: string; days: Weekday[] }): Promise<void> {
		const { db, uid } = this._context();
		const reminder: Omit<WorkoutReminder, 'updatedAt'> = {
			schemaVersion: REMINDER_SCHEMA_VERSION,
			type: 'workout',
			enabled: settings.enabled,
			time: settings.time,
			days: settings.days,
			timeZone: deviceTimeZone(),
		};

		await setDoc(doc(db, 'users', uid, 'reminders', WORKOUT_REMINDER_ID), {
			...reminder,
			updatedAt: serverTimestamp(),
		});
		this.reminder.set({ ...reminder, updatedAt: null });
		this.schedule();
	}

	/** Ask for notification permission. Only call from a user action (README §11). */
	async requestPermission(): Promise<NotificationState> {
		if (!this._isBrowser || !('Notification' in globalThis)) {
			return 'unsupported';
		}

		this.permission.set(await Notification.requestPermission());
		this.schedule();

		return this.permission();
	}

	/** Next reminder from now (not a `computed`: it depends on the clock, not only on signals). */
	nextAt(): Date | null {
		const reminder = this.reminder();

		return reminder?.enabled ? nextReminder(new Date(), reminder) : null;
	}

	/** (Re)arms the in-browser timer for the next reminder. Safe to call repeatedly. */
	schedule() {
		this.stop();

		const next = this.nextAt();

		if (!this._isBrowser || !next) {
			return;
		}

		const delay = next.getTime() - Date.now();

		this._timer = setTimeout(
			() => {
				if (delay <= MAX_TIMER_MS) {
					void this._deliver();
				}

				this.schedule();
			},
			Math.max(0, Math.min(delay, MAX_TIMER_MS)),
		);
	}

	stop() {
		if (this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}
	}

	reset() {
		this.stop();
		this._uid = null;
		this._loading = null;
		this.reminder.set(null);
	}

	private async _load() {
		const { db, uid } = this._context();
		const snapshot = await getDoc(doc(db, 'users', uid, 'reminders', WORKOUT_REMINDER_ID));

		this.reminder.set(snapshot.exists() ? (snapshot.data() as WorkoutReminder) : null);
		this.schedule();
	}

	private async _deliver() {
		if (this.permission() !== 'granted') {
			return;
		}

		// Don't nag when today's planned workout is already done.
		const today = localToday();
		const todayDay = this._planService.activePlan()?.days.find((day) => day.date === today);

		if (todayDay && this._sessionService.planSessions().has(todayDay.index)) {
			return;
		}

		new Notification('TrainUp', {
			body: this._translateService.translate('Час для тренування! Ваш план чекає.')(),
			icon: '/favicon.png',
			tag: 'trainup-workout-reminder',
		});
	}

	private _readPermission(): NotificationState {
		return this._isBrowser && 'Notification' in globalThis ? Notification.permission : 'unsupported';
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
