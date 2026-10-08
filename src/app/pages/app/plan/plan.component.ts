import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Infeasibility, PlanDay } from '@trainup/planner';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ExerciseTargetComponent } from '../../../feature/plan/components/exercise-target/exercise-target.component';
import { PlanInfeasibilityComponent } from '../../../feature/plan/components/plan-infeasibility/plan-infeasibility.component';
import { injectLocale } from '../../../feature/plan/locale';
import { PlanService } from '../../../feature/plan/plan.service';
import { formatPlanDate, localToday } from '../../../feature/plan/plan.util';
import { WorkoutSessionService } from '../../../feature/workout-session/workout-session.service';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

interface PlanWeek {
	week: number;
	days: PlanDay[];
}

@Component({
	imports: [
		ExerciseTargetComponent,
		PlanInfeasibilityComponent,
		RouterLink,
		StateMessageComponent,
		TranslateDirective,
	],
	templateUrl: './plan.component.html',
})
export class PlanComponent {
	private readonly _planService = inject(PlanService);
	private readonly _sessionService = inject(WorkoutSessionService);
	private readonly _locale = injectLocale();

	protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly generating = signal(false);
	protected readonly generateError = signal(false);
	protected readonly infeasibility = signal<Infeasibility | null>(null);
	protected readonly plan = this._planService.activePlan;
	protected readonly isOutdated = this._planService.isOutdated;
	protected readonly completed = this._sessionService.planSessions;
	protected readonly today = localToday();
	protected readonly weeks = computed<PlanWeek[]>(() => {
		const weeks = new Map<number, PlanDay[]>();

		for (const day of this.plan()?.days ?? []) {
			weeks.set(day.week, [...(weeks.get(day.week) ?? []), day]);
		}

		return [...weeks].map(([week, days]) => ({ week, days }));
	});

	constructor() {
		void this._load();
	}

	protected dateLabel(day: PlanDay): string {
		return formatPlanDate(day.date, this._locale());
	}

	protected async regenerate() {
		this.generating.set(true);
		this.generateError.set(false);
		this.infeasibility.set(null);

		try {
			const result = await this._planService.generateAndSave();

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

	private async _load() {
		try {
			await this._planService.ensureLoaded();

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
}
