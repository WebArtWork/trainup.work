import { Component, computed, input } from '@angular/core';
import type { PlanDay } from '@trainup/planner';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { injectLocale } from '../../locale';
import { formatPlanDate, localToday } from '../../plan.util';
import { ExerciseTargetComponent } from '../exercise-target/exercise-target.component';

/** One planned workout: date, length, exercises. Project action buttons as content. */
@Component({
	selector: 'app-session-card',
	imports: [ExerciseTargetComponent, TranslateDirective],
	template: `
		@let current = day();
		<article
			class="rounded-[calc(var(--radius-card)*2)] border border-[var(--c-border)] bg-[var(--c-bg-secondary)] p-5 shadow-[var(--shadow-sm)]"
		>
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<h2 class="text-lg font-semibold text-[var(--c-text-strong)]">
					@if (isToday()) {
						<span translate>Сьогодні</span>
					} @else {
						<span class="inline-block first-letter:uppercase">{{ dateLabel() }}</span>
					}
				</h2>
				<p class="text-sm text-[var(--c-text-muted)]">
					<span translate>Тиждень</span> {{ current.week }} · ~{{ current.estimatedMinutes }}
					<span translate>хв</span>
				</p>
			</div>

			@if (done()) {
				<p
					class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--c-bg-tertiary)] px-3 py-1 text-sm font-semibold text-[var(--c-text-strong)]"
				>
					<span class="material-symbols-outlined text-[18px] text-[var(--c-primary)]" aria-hidden="true">
						task_alt
					</span>
					<span translate>Виконано</span>
				</p>
			}

			<ol class="mt-4 divide-y divide-[var(--c-border)]">
				@for (exercise of current.exercises; track exercise.exerciseId) {
					<li class="flex items-baseline justify-between gap-3 py-2.5 text-sm">
						<span class="font-medium text-[var(--c-text-strong)]">{{ exercise.name }}</span>
						<app-exercise-target class="shrink-0 text-[var(--c-text)]" [planned]="exercise" />
					</li>
				}
			</ol>

			<div class="mt-4 flex flex-wrap gap-3 empty:hidden">
				<ng-content />
			</div>
		</article>
	`,
})
export class SessionCardComponent {
	readonly day = input.required<PlanDay>();
	readonly done = input(false);

	private readonly _locale = injectLocale();

	protected readonly isToday = computed(() => this.day().date === localToday());
	protected readonly dateLabel = computed(() => formatPlanDate(this.day().date, this._locale()));
}
