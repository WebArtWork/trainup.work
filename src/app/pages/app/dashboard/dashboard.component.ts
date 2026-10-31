import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountService } from '../../../feature/account/account.service';
import {
	average,
	inRange,
	periodRanges,
	PeriodKey,
} from '../../../feature/dashboard/dashboard.util';
import { localToday } from '../../../feature/plan/plan.util';
import { WEIGHT_LIMITS } from '../../../feature/weight/weight.interface';
import { WeightService } from '../../../feature/weight/weight.service';
import { WorkoutSessionService } from '../../../feature/workout-session/workout-session.service';
import type { WorkoutSession } from '../../../feature/workout-session/workout-session.interface';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

interface Block {
	key: string;
	label: string;
	value: string;
	unit: string;
	caption: string;
}

/** Row order of the grids: this week, month, year, then last week, month, year. */
const BLOCKS: { period: PeriodKey; which: 'current' | 'previous'; label: string }[] = [
	{ period: 'week', which: 'current', label: 'Цей тиждень' },
	{ period: 'month', which: 'current', label: 'Цей місяць' },
	{ period: 'year', which: 'current', label: 'Цей рік' },
	{ period: 'week', which: 'previous', label: 'Минулий тиждень' },
	{ period: 'month', which: 'previous', label: 'Минулий місяць' },
	{ period: 'year', which: 'previous', label: 'Минулий рік' },
];

/** The landing page of the signed-in app: body weight and finished workouts, by period. */
@Component({
	imports: [FormsModule, StateMessageComponent, TranslateDirective],
	template: `
		@let stateValue = state();
		@switch (stateValue) {
			@case ('loading') {
				<app-state-message tone="loading" title="Завантажуємо показники" />
			}
			@case ('error') {
				<app-state-message
					tone="error"
					icon="cloud_off"
					title="Не вдалося завантажити показники"
					text="Перевірте з’єднання з інтернетом і спробуйте ще раз."
				/>
			}
			@case ('ready') {
				<div class="flex flex-col gap-8">
					<section class="flex flex-col gap-3" aria-labelledby="dashboard-weight">
						<h2 id="dashboard-weight" class="font-display text-xl text-[var(--c-text-strong)]" translate>
							Вага
						</h2>
						<form class="surface flex items-end gap-3 p-4" (ngSubmit)="saveWeight()">
							<label class="flex flex-1 flex-col gap-1.5">
								<span class="text-sm font-semibold text-[var(--c-text-strong)]" translate>
									Вага сьогодні, кг
								</span>
								<input
									class="field"
									name="weight"
									type="number"
									inputmode="decimal"
									step="0.1"
									[min]="limits.min"
									[max]="limits.max"
									[(ngModel)]="weightInput"
								/>
							</label>
							<button class="btn btn-primary" type="submit" [disabled]="!canSave() || saving()" translate>
								Записати
							</button>
						</form>
						@if (saveError()) {
							<p class="text-sm text-[var(--c-error)]" role="alert" translate>
								Не вдалося зберегти вагу. Спробуйте ще раз.
							</p>
						}
						<ul class="grid grid-cols-3 gap-2 sm:gap-3">
							@for (block of weightBlocks(); track block.key) {
								<li class="surface flex min-w-0 flex-col gap-1 p-3">
									<span class="text-xs text-[var(--c-text-muted)]" [translate]="block.label">{{
										block.label
									}}</span>
									<span class="font-display text-xl leading-tight text-[var(--c-text-strong)]">
										{{ block.value }}
										@if (block.unit) {
											<span class="text-xs font-normal text-[var(--c-text-muted)]" [translate]="block.unit">{{
												block.unit
											}}</span>
										}
									</span>
									<span class="text-xs text-[var(--c-text-muted)]">{{ block.caption }}</span>
								</li>
							}
						</ul>
					</section>

					<section class="flex flex-col gap-3" aria-labelledby="dashboard-workouts">
						<h2 id="dashboard-workouts" class="font-display text-xl text-[var(--c-text-strong)]" translate>
							Тренування
						</h2>
						<ul class="grid grid-cols-3 gap-2 sm:gap-3">
							@for (block of workoutBlocks(); track block.key) {
								<li class="surface flex min-w-0 flex-col gap-1 p-3">
									<span class="text-xs text-[var(--c-text-muted)]" [translate]="block.label">{{
										block.label
									}}</span>
									<span class="font-display text-xl leading-tight text-[var(--c-text-strong)]">
										{{ block.value }}
									</span>
									<span class="text-xs text-[var(--c-text-muted)]" [translate]="block.caption">{{
										block.caption
									}}</span>
								</li>
							}
						</ul>
					</section>
				</div>
			}
			@default never;
		}
	`,
})
export class DashboardComponent {
	private readonly _weights = inject(WeightService);
	private readonly _sessions = inject(WorkoutSessionService);
	private readonly _account = inject(AccountService);

	protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly limits = WEIGHT_LIMITS;
	protected readonly saving = signal(false);
	protected readonly saveError = signal(false);
	protected weightInput: number | null = null;

	private readonly _today = localToday();
	private readonly _ranges = periodRanges(this._today);
	private readonly _finished = signal<WorkoutSession[]>([]);

	protected readonly canSave = () =>
		this.weightInput !== null &&
		Number.isFinite(this.weightInput) &&
		this.weightInput >= WEIGHT_LIMITS.min &&
		this.weightInput <= WEIGHT_LIMITS.max;

	protected readonly weightBlocks = computed<Block[]>(() =>
		BLOCKS.map(({ period, which, label }) => {
			const range = this._ranges[period][which];
			const kg = this._weights.entries().filter((entry) => inRange(entry.date, range)).map((entry) => entry.kg);
			const mean = average(kg);

			return {
				key: `${period}-${which}`,
				label,
				value: mean === null ? '—' : mean.toLocaleString('uk', { minimumFractionDigits: 1 }),
				unit: mean === null ? '' : 'кг',
				caption: kg.length ? `${kg.length} ${kg.length === 1 ? 'запис' : 'записів'}` : 'Немає записів',
			};
		}),
	);

	protected readonly workoutBlocks = computed<Block[]>(() =>
		BLOCKS.map(({ period, which, label }) => {
			const range = this._ranges[period][which];
			const done = this._finished().filter((session) => inRange(session.date, range)).length;

			return {
				key: `${period}-${which}`,
				label,
				value: String(done),
				unit: '',
				caption: 'виконано',
			};
		}),
	);

	constructor() {
		void this._load();
	}

	protected async saveWeight() {
		if (!this.canSave() || this.saving()) {
			return;
		}

		this.saving.set(true);
		this.saveError.set(false);

		try {
			await this._weights.save(this._today, this.weightInput!);
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
				this._weights.load(),
				this._sessions.loadSince(this._ranges.year.previous.from).then((sessions) =>
					this._finished.set(sessions.filter((session) => session.status === 'completed')),
				),
			]);

			const latest = this._weights.entries().at(-1)?.kg ?? this._account.profile()?.weightKg ?? null;

			this.weightInput = latest;
			this.state.set('ready');
		} catch (error) {
			console.error(error);
			this.state.set('error');
		}
	}
}
