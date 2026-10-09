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
	host: { class: 'block' },
	template: `
		@let current = day();
		<article
			class="p-5 sm:p-6"
			[class]="done() ? 'surface' : 'accent-block lg:-rotate-1 dark:rotate-0'"
		>
			<div class="flex items-start justify-between gap-4">
				<div class="min-w-0">
					<h2 class="font-display text-3xl leading-tight sm:text-4xl">
						@if (isToday()) {
							<span translate>Сьогодні</span>
						} @else {
							<span class="inline-block first-letter:uppercase">{{ dateLabel() }}</span>
						}
					</h2>
					<p class="mt-1 text-sm">
						<span translate>Тиждень</span> {{ current.week }} · ~{{ current.estimatedMinutes }}
						<span translate>хв</span>
					</p>
					@if (done()) {
						<p class="chip chip-success mt-3">
							<span class="material-symbols-outlined text-[18px]" aria-hidden="true">task_alt</span>
							<span translate>Виконано</span>
						</p>
					}
				</div>
				@if (progress() !== null) {
					<div
						class="progress-ring shrink-0"
						[style]="'--value: ' + progress()"
						role="img"
						[attr.aria-label]="progress() + '%'"
					>
						<span class="font-display text-base tabular-nums">{{ progress() }}%</span>
					</div>
				}
			</div>

			<div class="mt-5 flex flex-wrap gap-3 empty:hidden">
				<ng-content />
			</div>

			<ol class="mt-5 flex flex-col gap-1.5">
				@for (exercise of shown(); track exercise.exerciseId) {
					<li
						class="flex items-baseline justify-between gap-3 rounded-[calc(var(--radius-card)*0.6)] bg-black/5 px-3 py-2.5 text-sm dark:bg-white/5"
					>
						<span class="font-semibold">{{ exercise.name }}</span>
						<app-exercise-target class="shrink-0" [planned]="exercise" />
					</li>
				}
			</ol>
			@if (hidden() > 0) {
				<p class="mt-2 px-3 text-sm">+{{ hidden() }}</p>
			}
		</article>
	`,
})
export class SessionCardComponent {
	readonly day = input.required<PlanDay>();
	readonly done = input(false);
	/** Plan completion, 0-100; shows a progress ring when set. */
	readonly progress = input<number | null>(null);
	/** Max exercises listed before the rest collapse into a "+N" count. */
	readonly limit = input(4);

	private readonly _locale = injectLocale();

	protected readonly isToday = computed(() => this.day().date === localToday());
	protected readonly dateLabel = computed(() => formatPlanDate(this.day().date, this._locale()));
	protected readonly shown = computed(() => this.day().exercises.slice(0, this.limit()));
	protected readonly hidden = computed(() =>
		Math.max(0, this.day().exercises.length - this.limit()),
	);
}
