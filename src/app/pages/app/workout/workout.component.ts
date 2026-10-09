import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { SessionCardComponent } from '../../../feature/plan/components/session-card/session-card.component';
import { PlanService } from '../../../feature/plan/plan.service';
import { localToday } from '../../../feature/plan/plan.util';
import { WorkoutSessionService } from '../../../feature/workout-session/workout-session.service';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [RouterLink, SessionCardComponent, StateMessageComponent, TranslateDirective],
	template: `
		<div class="mt-6">
			@let stateValue = state();
			@switch (stateValue) {
				@case ('loading') {
					<app-state-message tone="loading" title="Завантажуємо ваш план" />
				}
				@case ('error') {
					<app-state-message
						tone="error"
						icon="cloud_off"
						title="Не вдалося завантажити план"
						text="Перевірте з’єднання з інтернетом і спробуйте ще раз."
					/>
				}
				@case ('ready') {
					@if (nextDay(); as day) {
						<app-session-card [day]="day" [limit]="20">
							<a
								class="btn btn-primary btn-lg btn-block"
								[routerLink]="['/app/workout', day.index]"
							>
								<span class="material-symbols-outlined text-[24px]" aria-hidden="true">
									play_arrow
								</span>
								<span translate>Почати тренування</span>
							</a>
						</app-session-card>
					} @else {
						<app-state-message
							icon="exercise"
							title="Немає запланованого тренування"
							text="Складіть або оновіть план на сторінці «Сьогодні»."
						>
							<a
								class="btn btn-outline"
								routerLink="/app/today"
								translate
							>
								До сторінки «Сьогодні»
							</a>
						</app-state-message>
					}
				}
				@default never;
			}
		</div>
	`,
})
export class WorkoutComponent {
	private readonly _planService = inject(PlanService);
	private readonly _sessionService = inject(WorkoutSessionService);

	protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly nextDay = computed(() => {
		const today = localToday();
		const completed = this._sessionService.planSessions();

		return (
			this._planService
				.activePlan()
				?.days.find((day) => day.date >= today && !completed.has(day.index)) ?? null
		);
	});

	constructor() {
		void this._load();
	}

	private async _load() {
		try {
			await this._planService.ensureLoaded();

			const plan = this._planService.activePlan();

			if (plan) {
				await this._sessionService.loadForPlan(plan.id);
			}

			this.state.set('ready');
		} catch (error) {
			console.error(error);
			this.state.set('error');
		}
	}
}
