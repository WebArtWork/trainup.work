import { Component, computed, inject, signal } from '@angular/core';
import { addDays, WEEKDAYS, weekdayOf } from '@trainup/planner';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { injectLocale } from '../../../feature/plan/locale';
import { formatPlanDate, localToday } from '../../../feature/plan/plan.util';
import {
	SessionExercise,
	WorkoutSession,
} from '../../../feature/workout-session/workout-session.interface';
import { WorkoutSessionService } from '../../../feature/workout-session/workout-session.service';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [StateMessageComponent, TranslateDirective],
	template: `
			<div class="mt-6 pb-28">
				@let stateValue = state();
				@switch (stateValue) {
					@case ('loading') {
						<app-state-message tone="loading" title="Завантажуємо історію" />
					}
					@case ('error') {
						<app-state-message
							tone="error"
							icon="cloud_off"
							title="Не вдалося завантажити історію"
							text="Перевірте з’єднання з інтернетом і спробуйте ще раз."
						/>
					}
					@case ('ready') {
						@if (sessions().length) {
							@let stats = progress();
							<section class="mb-6" aria-labelledby="progress-title">
								<h2 id="progress-title" class="sr-only" translate>Прогрес</h2>
								<dl class="grid grid-cols-3 gap-3">
									<div class="accent-block flex flex-col justify-between p-4">
										<dt class="text-xs font-semibold" translate>Цього тижня</dt>
										<dd class="font-display mt-2 text-4xl leading-none">{{ stats.thisWeek }}</dd>
									</div>
									<div class="surface flex flex-col justify-between p-4">
										<dt class="text-xs text-[var(--c-text-muted)]" translate>Усього</dt>
										<dd class="font-display mt-2 text-3xl leading-none text-[var(--c-text-strong)]">
											{{ stats.total }}
										</dd>
									</div>
									<div class="surface flex flex-col justify-between p-4">
										<dt class="text-xs text-[var(--c-text-muted)]" translate>Середнє зусилля</dt>
										<dd class="font-display mt-2 text-3xl leading-none text-[var(--c-text-strong)]">
											{{ stats.averageRpe ?? '—' }}<span class="font-sans text-sm font-normal text-[var(--c-text-muted)]">/10</span>
										</dd>
									</div>
								</dl>
								<details class="surface-inset group mt-3">
									<summary
										class="theme-focus flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-[var(--radius-card)] px-4 py-2"
									>
										<span class="flex-1 text-sm font-semibold text-[var(--c-text-strong)]" translate>
											Тренувань за тиждень
										</span>
										<span
											class="material-symbols-outlined text-[20px] text-[var(--c-text-muted)] transition-transform group-open:rotate-180"
											aria-hidden="true"
										>
											expand_more
										</span>
									</summary>
									<ol class="flex h-24 items-end gap-3 px-4 pb-4" role="list">
										@for (week of stats.weeks; track week.start) {
											<li class="flex flex-1 flex-col items-center gap-1">
												<span class="text-xs font-semibold tabular-nums text-[var(--c-text-strong)]">{{ week.count }}</span>
												<span
													class="w-full rounded-t-md bg-[var(--c-primary)]"
													[style.height.px]="4 + week.count * 12"
													aria-hidden="true"
												></span>
												<span class="text-[11px] text-[var(--c-text-muted)]">{{ week.label }}</span>
											</li>
										}
									</ol>
								</details>
							</section>

							<ul class="flex flex-col gap-3">
								@for (session of sessions(); track session.planId + session.dayIndex) {
									<li>
										<details class="surface group">
											<summary
												class="theme-focus flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-[var(--radius-card)] px-4 py-3"
											>
												<span
													class="material-symbols-outlined text-[26px]"
													[class]="
														session.status === 'completed'
															? 'text-[var(--c-success)]'
															: 'text-[var(--c-warning)]'
													"
													aria-hidden="true"
												>
													{{ session.status === 'completed' ? 'task_alt' : 'timelapse' }}
												</span>
												<span class="flex-1">
													<span
														class="block text-base font-bold text-[var(--c-text-strong)] first-letter:uppercase"
													>
														{{ dateLabel(session.date) }}
													</span>
													<span class="text-sm text-[var(--c-text-muted)]">
														@if (session.status === 'completed') {
															<span translate>Виконано повністю</span>
														} @else {
															<span translate>Виконано частково</span>
														}
														· {{ doneSets(session) }} / {{ totalSets(session) }}
														<span translate>підходів</span> ·
														{{ minutes(session) }} <span translate>хв</span>
														@if (session.rpe) {
															· <span translate>зусилля</span> {{ session.rpe }}/10
														}
													</span>
													@if (session.pain) {
														<span class="mt-1 flex items-center gap-1 text-sm font-semibold text-[var(--c-error)]">
															<span class="material-symbols-outlined text-[16px]" aria-hidden="true">healing</span>
															<span translate>був біль</span>
														</span>
													}
												</span>
												<span
													class="material-symbols-outlined text-[20px] text-[var(--c-text-muted)] transition-transform group-open:rotate-180"
													aria-hidden="true"
												>
													expand_more
												</span>
											</summary>
											<ul class="mx-4 mb-3 divide-y divide-[var(--c-border)] border-t border-[var(--c-border)]">
												@for (exercise of session.exercises; track exercise.exerciseId) {
													<li class="flex justify-between gap-3 py-2.5 text-sm">
														<span class="text-[var(--c-text-strong)]">{{ exercise.name }}</span>
														<span class="tabular-nums text-[var(--c-text-muted)]">
															{{ exerciseDone(exercise) }} / {{ exercise.sets.length }}
														</span>
													</li>
												}
											</ul>
										</details>
									</li>
								}
							</ul>
						} @else {
							<app-state-message
								icon="history"
								title="Поки що порожньо"
								text="Тут з’являться завершені тренування."
							/>
						}
					}
					@default never;
				}
			</div>
	`,
})
export class HistoryComponent {
	private readonly _sessionService = inject(WorkoutSessionService);
	private readonly _locale = injectLocale();

	protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly sessions = this._sessionService.history;

	/** Basic progress from loaded history (README §6.4, Milestone 3). */
	protected readonly progress = computed(() => {
		const sessions = this.sessions();
		const today = localToday();
		const monday = addDays(today, -WEEKDAYS.indexOf(weekdayOf(today)));
		const weeks = [3, 2, 1, 0].map((ago) => {
			const start = addDays(monday, -7 * ago);
			const end = addDays(start, 7);

			return {
				start,
				label: formatPlanDate(start, this._locale()).split(',').pop()!.trim(),
				count: sessions.filter((session) => session.date >= start && session.date < end).length,
			};
		});
		const rated = sessions.filter((session) => session.rpe).slice(0, 5);

		return {
			thisWeek: weeks[3]!.count,
			total: sessions.length,
			averageRpe: rated.length
				? Math.round((rated.reduce((sum, session) => sum + session.rpe!, 0) / rated.length) * 10) / 10
				: null,
			weeks,
		};
	});

	constructor() {
		void this._load();
	}

	protected dateLabel(date: string): string {
		return formatPlanDate(date, this._locale());
	}

	protected exerciseDone(exercise: SessionExercise): number {
		return exercise.sets.filter((set) => set.status === 'done').length;
	}

	protected doneSets(session: WorkoutSession): number {
		return session.exercises.reduce((total, exercise) => total + this.exerciseDone(exercise), 0);
	}

	protected totalSets(session: WorkoutSession): number {
		return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
	}

	protected minutes(session: WorkoutSession): number {
		return Math.max(1, Math.round(session.durationSeconds / 60));
	}

	private async _load() {
		try {
			await this._sessionService.loadHistory();
			this.state.set('ready');
		} catch (error) {
			console.error(error);
			this.state.set('error');
		}
	}
}
