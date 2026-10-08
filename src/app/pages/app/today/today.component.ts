import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Infeasibility } from '@trainup/planner';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountService } from '../../../feature/account/account.service';
import { ExerciseCatalogService } from '../../../feature/exercise/exercise-catalog.service';
import { PlanInfeasibilityComponent } from '../../../feature/plan/components/plan-infeasibility/plan-infeasibility.component';
import { SessionCardComponent } from '../../../feature/plan/components/session-card/session-card.component';
import { PlanService } from '../../../feature/plan/plan.service';
import { localToday } from '../../../feature/plan/plan.util';
import { WorkoutSessionService } from '../../../feature/workout-session/workout-session.service';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
	imports: [
		PlanInfeasibilityComponent,
		RouterLink,
		SessionCardComponent,
		StateMessageComponent,
		TranslateDirective,
	],
	templateUrl: './today.component.html',
})
export class TodayComponent {
	private readonly _accountService = inject(AccountService);
	private readonly _sessionService = inject(WorkoutSessionService);

	protected readonly planService = inject(PlanService);
	protected readonly catalog = inject(ExerciseCatalogService);
	protected readonly state = signal<LoadState>('loading');
	protected readonly generating = signal(false);
	protected readonly generateError = signal(false);
	protected readonly infeasibility = signal<Infeasibility | null>(null);

	protected readonly firstName = computed(
		() => this._accountService.profile()?.displayName.split(' ')[0] ?? '',
	);
	protected readonly plan = this.planService.activePlan;
	protected readonly completed = this._sessionService.planSessions;
	protected readonly todayDay = computed(
		() => this.plan()?.days.find((day) => day.date === localToday()) ?? null,
	);
	/** The first planned day from today on that hasn't been completed yet. */
	protected readonly nextDay = computed(() => {
		const today = localToday();

		return (
			this.plan()?.days.find((day) => day.date >= today && !this.completed().has(day.index)) ?? null
		);
	});

	constructor() {
		void this.load();
	}

	protected async load() {
		this.state.set('loading');

		try {
			await Promise.all([this.catalog.ensureLoaded(), this.planService.ensureLoaded()]);

			const plan = this.plan();

			if (plan) {
				await this._sessionService.loadForPlan(plan.id);
			}

			this.state.set('ready');
		} catch (error) {
			console.error(error);
			this.state.set('error');
		}
	}

	protected async generate() {
		this.generating.set(true);
		this.generateError.set(false);
		this.infeasibility.set(null);

		try {
			const result = await this.planService.generateAndSave();

			if (result.ok) {
				await this._sessionService.loadForPlan(this.plan()!.id);
			} else {
				this.infeasibility.set(result.infeasibility);
			}
		} catch (error) {
			console.error(error);
			this.generateError.set(true);
		} finally {
			this.generating.set(false);
		}
	}
}
