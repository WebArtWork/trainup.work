import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { PlanDay, PlannedExercise } from '@trainup/planner';
import { StoreService } from '@wawjs/ngx-core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ExerciseCatalogService } from '../../../feature/exercise/exercise-catalog.service';
import { ExerciseFlagService } from '../../../feature/exercise-flag/exercise-flag.service';
import { BODY_AREA_OPTIONS } from '../../../feature/limitation/limitation.interface';
import { ChoiceOption } from '../../../feature/profile/profile.const';
import { ExerciseTargetComponent } from '../../../feature/plan/components/exercise-target/exercise-target.component';
import { PlanService } from '../../../feature/plan/plan.service';
import {
	PainArea,
	SESSION_NOTES_MAX_LENGTH,
	SessionSet,
	WorkoutSession,
} from '../../../feature/workout-session/workout-session.interface';
import { WorkoutSessionService } from '../../../feature/workout-session/workout-session.service';
import { OptionPillComponent } from '../../../ui/option-pill/option-pill.component';
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
	rpe?: number | null;
	painReported?: boolean | null;
	painAreas?: PainArea[];
	painExerciseIds?: string[];
	notes?: string;
}

const PAIN_AREA_OPTIONS: ChoiceOption<PainArea>[] = [
	...BODY_AREA_OPTIONS,
	{ value: 'other', label: 'Інше' },
];

interface Hold {
	exercise: number;
	set: number;
	remaining: number;
}

@Component({
	imports: [
		ExerciseTargetComponent,
		OptionPillComponent,
		RouterLink,
		StateMessageComponent,
		TranslateDirective,
	],
	templateUrl: './workout-run.component.html',
})
export class WorkoutRunComponent {
	private readonly _planService = inject(PlanService);
	private readonly _sessionService = inject(WorkoutSessionService);
	private readonly _storeService = inject(StoreService);
	private readonly _catalog = inject(ExerciseCatalogService);
	private readonly _flags = inject(ExerciseFlagService);
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

	// Feedback (README §3B step 4, §6.4)
	protected readonly painAreaOptions = PAIN_AREA_OPTIONS;
	protected readonly rpeScale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	protected readonly notesMaxLength = SESSION_NOTES_MAX_LENGTH;
	protected readonly rpe = signal<number | null>(null);
	protected readonly painReported = signal<boolean | null>(null);
	protected readonly painAreas = signal<PainArea[]>([]);
	protected readonly painExerciseIds = signal<string[]>([]);
	protected readonly notes = signal('');
	protected readonly painPanelOpen = signal(false);
	protected readonly paused = computed(() => new Set(this._flags.pausedIds()));
	protected readonly feedbackComplete = computed(
		() => this.painReported() !== null && (!this.painReported() || this.painAreas().length > 0),
	);

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
				rpe: this.rpe(),
				painReported: this.painReported(),
				painAreas: this.painAreas(),
				painExerciseIds: this.painExerciseIds(),
				notes: this.notes(),
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

	/** "I feel pain": stop the current exercise now; its remaining sets are skipped. */
	protected openPain() {
		this.hold.set(null);
		this.restRemaining.set(0);
		this.painPanelOpen.set(true);
	}

	protected confirmPain() {
		const planned = this.planned()!;

		this.sets.update((all) =>
			all.map((sets, i) =>
				i === this.current()
					? sets.map((set) => (set.status === 'pending' ? { ...set, status: 'skipped' } : set))
					: sets,
			),
		);
		this.painReported.set(true);
		this.painExerciseIds.update((ids) =>
			ids.includes(planned.exerciseId) ? ids : [...ids, planned.exerciseId],
		);
		this.painPanelOpen.set(false);
	}

	protected togglePainArea(area: PainArea) {
		this.painAreas.update((areas) =>
			areas.includes(area) ? areas.filter((item) => item !== area) : [...areas, area],
		);
	}

	protected togglePainExercise(exerciseId: string) {
		this.painExerciseIds.update((ids) =>
			ids.includes(exerciseId) ? ids.filter((id) => id !== exerciseId) : [...ids, exerciseId],
		);
	}

	protected setPainReported(value: boolean) {
		this.painReported.set(value);

		if (!value) {
			this.painAreas.set([]);
			this.painExerciseIds.set([]);
		}
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

		if (!day || this.saving() || !this.feedbackComplete()) {
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
				rpe: this.rpe(),
				pain: this.painReported()
					? { areas: this.painAreas(), exerciseIds: this.painExerciseIds() }
					: null,
				notes: this.notes(),
			});
			await this._storeService.remove(this._draftKey());
			await this._flags.reload();
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
			await Promise.all([
				this._catalog.ensureLoaded(),
				this._planService.ensureLoaded(),
				this._flags.ensureLoaded(),
			]);

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
				this.rpe.set(draft.rpe ?? null);
				this.painReported.set(draft.painReported ?? null);
				this.painAreas.set(draft.painAreas ?? []);
				this.painExerciseIds.set(draft.painExerciseIds ?? []);
				this.notes.set(draft.notes ?? '');
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
