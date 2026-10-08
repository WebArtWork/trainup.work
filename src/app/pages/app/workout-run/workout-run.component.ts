import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { PlanDay, PlannedExercise } from '@trainup/planner';
import { StoreService } from '@wawjs/ngx-core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ExerciseCatalogService } from '../../../feature/exercise/exercise-catalog.service';
import { ExerciseTargetComponent } from '../../../feature/plan/components/exercise-target/exercise-target.component';
import { PlanService } from '../../../feature/plan/plan.service';
import { SessionSet, WorkoutSession } from '../../../feature/workout-session/workout-session.interface';
import { WorkoutSessionService } from '../../../feature/workout-session/workout-session.service';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

type Phase = 'loading' | 'error' | 'missing' | 'run' | 'summary' | 'saved' | 'done-before';

type RunSetStatus = 'pending' | 'done' | 'skipped';

interface RunSet {
	status: RunSetStatus;
	reps: number | null;
	durationSeconds: number | null;
}

interface RunDraft {
	startedAt: string;
	current: number;
	sets: RunSet[][];
}

interface Hold {
	exercise: number;
	set: number;
	remaining: number;
}

@Component({
	imports: [ExerciseTargetComponent, RouterLink, StateMessageComponent, TranslateDirective],
	templateUrl: './workout-run.component.html',
})
export class WorkoutRunComponent {
	private readonly _planService = inject(PlanService);
	private readonly _sessionService = inject(WorkoutSessionService);
	private readonly _storeService = inject(StoreService);
	private readonly _catalog = inject(ExerciseCatalogService);
	private readonly _dayIndex = Number(inject(ActivatedRoute).snapshot.paramMap.get('day'));

	protected readonly phase = signal<Phase>('loading');
	protected readonly day = signal<PlanDay | null>(null);
	protected readonly current = signal(0);
	protected readonly sets = signal<RunSet[][]>([]);
	protected readonly restRemaining = signal(0);
	protected readonly hold = signal<Hold | null>(null);
	protected readonly saving = signal(false);
	protected readonly saveError = signal(false);
	protected readonly savedSession = signal<WorkoutSession | null>(null);

	private _startedAt = new Date();
	private _planId = '';

	protected readonly planned = computed<PlannedExercise | null>(
		() => this.day()?.exercises[this.current()] ?? null,
	);
	protected readonly exercise = computed(() => {
		const planned = this.planned();

		return planned ? (this._catalog.byId().get(planned.exerciseId) ?? null) : null;
	});
	protected readonly currentSets = computed(() => this.sets()[this.current()] ?? []);
	protected readonly isLast = computed(
		() => this.current() === (this.day()?.exercises.length ?? 0) - 1,
	);
	protected readonly totals = computed(() => {
		const all = this.sets().flat();

		return {
			done: all.filter((set) => set.status === 'done').length,
			total: all.length,
		};
	});
	protected readonly elapsedMinutes = signal(0);

	constructor() {
		void this._load();

		const timer = setInterval(() => this._tick(), 1000);

		inject(DestroyRef).onDestroy(() => clearInterval(timer));

		effect(() => {
			const draft: RunDraft = {
				startedAt: this._startedAt.toISOString(),
				current: this.current(),
				sets: this.sets(),
			};

			if (this.phase() === 'run' || this.phase() === 'summary') {
				void this._storeService.setJson(this._draftKey(), draft);
			}
		});
	}

	protected formatSeconds(seconds: number): string {
		return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
	}

	protected doneSets(exerciseIndex: number): number {
		return (this.sets()[exerciseIndex] ?? []).filter((set) => set.status === 'done').length;
	}

	protected adjustReps(setIndex: number, delta: number) {
		this._patchSet(setIndex, (set) => ({ ...set, reps: Math.max(0, (set.reps ?? 0) + delta) }));
	}

	protected completeSet(setIndex: number) {
		const planned = this.planned()!;

		this._patchSet(setIndex, (set) => ({
			...set,
			status: 'done',
			durationSeconds: planned.durationSeconds !== null ? (set.durationSeconds ?? planned.durationSeconds) : null,
		}));
		this.hold.set(null);
		this.restRemaining.set(planned.restSeconds);
	}

	protected skipSet(setIndex: number) {
		this._patchSet(setIndex, (set) => ({ ...set, status: 'skipped' }));
		this.hold.set(null);
	}

	protected undoSet(setIndex: number) {
		this._patchSet(setIndex, (set) => ({ ...set, status: 'pending' }));
	}

	protected startHold(setIndex: number) {
		const planned = this.planned()!;

		this.restRemaining.set(0);
		this.hold.set({ exercise: this.current(), set: setIndex, remaining: planned.durationSeconds ?? 30 });
	}

	protected skipRest() {
		this.restRemaining.set(0);
	}

	protected goTo(index: number) {
		this.hold.set(null);
		this.current.set(index);
		globalThis.scrollTo?.({ top: 0 });
	}

	protected finish() {
		this.hold.set(null);
		this.restRemaining.set(0);
		this.elapsedMinutes.set(Math.max(1, Math.round((Date.now() - this._startedAt.getTime()) / 60000)));
		this.phase.set('summary');
		globalThis.scrollTo?.({ top: 0 });
	}

	protected backToWorkout() {
		this.phase.set('run');
	}

	protected async save() {
		const day = this.day();

		if (!day || this.saving()) {
			return;
		}

		this.saving.set(true);
		this.saveError.set(false);

		try {
			await this._sessionService.save({
				planId: this._planId,
				dayIndex: day.index,
				date: day.date,
				startedAt: this._startedAt,
				exercises: day.exercises.map((planned, i) => ({
					exerciseId: planned.exerciseId,
					exerciseVersion: planned.exerciseVersion,
					name: planned.name,
					sets: (this.sets()[i] ?? []).map(
						(set): SessionSet => ({
							// Sets never marked count as skipped; nothing is assumed done.
							status: set.status === 'done' ? 'done' : 'skipped',
							reps: set.status === 'done' ? set.reps : null,
							durationSeconds: set.status === 'done' ? set.durationSeconds : null,
						}),
					),
				})),
			});
			await this._storeService.remove(this._draftKey());
			this.phase.set('saved');
		} catch (error) {
			console.error(error);
			this.saveError.set(true);
		} finally {
			this.saving.set(false);
		}
	}

	private async _load() {
		try {
			await Promise.all([this._catalog.ensureLoaded(), this._planService.ensureLoaded()]);

			const plan = this._planService.activePlan();
			const day = plan?.days.find((item) => item.index === this._dayIndex) ?? null;

			if (!plan || !day) {
				this.phase.set('missing');
				return;
			}

			this._planId = plan.id;
			this.day.set(day);
			await this._sessionService.loadForPlan(plan.id);

			const saved = this._sessionService.planSessions().get(day.index);

			if (saved) {
				this.savedSession.set(saved);
				this.phase.set('done-before');
				return;
			}

			const draft = await this._storeService.getJson<RunDraft>(this._draftKey());

			if (draft && draft.sets.length === day.exercises.length) {
				this._startedAt = new Date(draft.startedAt);
				this.sets.set(draft.sets);
				this.current.set(Math.min(draft.current, day.exercises.length - 1));
			} else {
				this.sets.set(
					day.exercises.map((planned) =>
						Array.from({ length: planned.sets }, () => ({
							status: 'pending' as const,
							reps: planned.repsMax,
							durationSeconds: null,
						})),
					),
				);
			}

			this.phase.set('run');
		} catch (error) {
			console.error(error);
			this.phase.set('error');
		}
	}

	private _tick() {
		if (this.restRemaining() > 0) {
			this.restRemaining.update((seconds) => seconds - 1);
		}

		const hold = this.hold();

		if (hold) {
			if (hold.remaining <= 1) {
				const planned = this.day()?.exercises[hold.exercise];

				this._patchSet(
					hold.set,
					(set) => ({ ...set, status: 'done', durationSeconds: planned?.durationSeconds ?? null }),
					hold.exercise,
				);
				this.hold.set(null);
				this.restRemaining.set(planned?.restSeconds ?? 0);
			} else {
				this.hold.set({ ...hold, remaining: hold.remaining - 1 });
			}
		}
	}

	private _patchSet(setIndex: number, patch: (set: RunSet) => RunSet, exercise = this.current()) {
		this.sets.update((all) =>
			all.map((sets, i) =>
				i === exercise ? sets.map((set, j) => (j === setIndex ? patch(set) : set)) : sets,
			),
		);
	}

	private _draftKey(): string {
		return `workout-draft-${this._planId}-${this._dayIndex}`;
	}
}
