import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { injectLocale } from '../../../feature/plan/locale';
import { formatPlanDate } from '../../../feature/plan/plan.util';
import {
	SessionExercise,
	WorkoutSession,
} from '../../../feature/workout-session/workout-session.interface';
import { WorkoutSessionService } from '../../../feature/workout-session/workout-session.service';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [RouterLink, StateMessageComponent, TranslateDirective],
	template: `
		<header>
			<a
				class="theme-focus inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-[var(--c-primary)]"
				routerLink="/app/today"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
				<span translate>Сьогодні</span>
			</a>
			<h1
				class="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[var(--c-text-strong)] sm:text-3xl"
				translate
			>
				Історія тренувань
			</h1>
		</header>

		<div class="mt-6">
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
						<ul class="flex flex-col gap-3">
							@for (session of sessions(); track session.planId + session.dayIndex) {
								<li>
									<details
										class="group rounded-[calc(var(--radius-card)*1.4)] border border-[var(--c-border)] bg-[var(--c-bg-secondary)]"
									>
										<summary
											class="theme-focus flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3"
										>
											<span class="flex-1">
												<span
													class="block text-sm font-semibold text-[var(--c-text-strong)] first-letter:uppercase"
												>
													{{ dateLabel(session.date) }}
												</span>
												<span class="text-xs text-[var(--c-text-muted)]">
													@if (session.status === 'completed') {
														<span translate>Виконано повністю</span>
													} @else {
														<span translate>Виконано частково</span>
													}
													· {{ doneSets(session) }} / {{ totalSets(session) }}
													<span translate>підходів</span> ·
													{{ minutes(session) }} <span translate>хв</span>
												</span>
											</span>
											<span
												class="material-symbols-outlined text-[20px] text-[var(--c-text-muted)] transition-transform group-open:rotate-180"
												aria-hidden="true"
											>
												expand_more
											</span>
										</summary>
										<ul class="divide-y divide-[var(--c-border)] border-t border-[var(--c-border)] px-4">
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
