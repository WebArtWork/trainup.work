import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Infeasibility } from '@trainup/planner';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { EXCLUSION_REASONS, INFEASIBILITY_MESSAGES } from '../../plan.const';

/** Explains why no plan could be built and links to the setting behind each main reason. */
@Component({
	selector: 'app-plan-infeasibility',
	imports: [RouterLink, TranslateDirective],
	template: `
		<section
			class="surface border-2 border-[var(--c-error)] p-5"
			role="alert"
		>
			<h2 class="font-display text-xl text-[var(--c-text-strong)]" translate>
				Не вдалося скласти план
			</h2>
			<p class="mt-2 text-sm leading-6 text-[var(--c-text)]" [translate]="message()">
				{{ message() }}
			</p>

			@if (reasons().length) {
				<h3 class="mt-4 text-sm font-semibold text-[var(--c-text-strong)]" translate>
					Що найчастіше заважає
				</h3>
				<ul class="mt-2 divide-y divide-[var(--c-border)]">
					@for (reason of reasons(); track reason.label) {
						<li class="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
							<span class="text-[var(--c-text)]">
								<span [translate]="reason.label">{{ reason.label }}</span>
								<span class="text-[var(--c-text-muted)]"> · {{ reason.count }}</span>
							</span>
							@if (reason.section) {
								<a
									class="theme-focus inline-flex min-h-11 items-center gap-1 rounded-full px-3 font-semibold text-[var(--c-primary-text)] hover:bg-[var(--c-bg-tertiary)]"
									[routerLink]="['/app/profile', reason.section]"
								>
									<span class="material-symbols-outlined text-[18px]" aria-hidden="true">tune</span>
									<span translate>Змінити</span>
								</a>
							}
						</li>
					}
				</ul>
				<p class="mt-3 text-xs text-[var(--c-text-muted)]" translate>
					Число — скільки вправ виключено з цієї причини.
				</p>
			}
		</section>
	`,
})
export class PlanInfeasibilityComponent {
	readonly infeasibility = input.required<Infeasibility>();

	protected readonly message = computed(() => INFEASIBILITY_MESSAGES[this.infeasibility().code]);
	protected readonly reasons = computed(() =>
		this.infeasibility()
			.topReasons.filter(({ reason }) => reason !== 'not-published')
			.map(({ reason, count }) => ({ ...EXCLUSION_REASONS[reason], count })),
	);
}
