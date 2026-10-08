import { Component, input } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';

export type StateMessageTone = 'neutral' | 'loading' | 'error';

/** Centered loading / empty / error state. Project action buttons as content. */
@Component({
	selector: 'app-state-message',
	imports: [TranslateDirective],
	host: { class: 'block' },
	template: `
		<div
			class="flex flex-col items-center rounded-[calc(var(--radius-card)*2)] border border-[var(--c-border)] bg-[var(--c-bg-secondary)] px-6 py-10 text-center"
			[attr.role]="tone() === 'error' ? 'alert' : 'status'"
		>
			<span
				class="material-symbols-outlined text-[40px]"
				[class]="
					tone() === 'error'
						? 'text-[var(--c-error)]'
						: tone() === 'loading'
							? 'animate-spin text-[var(--c-primary)]'
							: 'text-[var(--c-primary)]'
				"
				aria-hidden="true"
			>
				{{ tone() === 'loading' ? 'progress_activity' : icon() }}
			</span>
			<h2
				class="mt-3 text-lg font-semibold text-[var(--c-text-strong)]"
				[translate]="title()"
			>
				{{ title() }}
			</h2>
			@if (text()) {
				<p
					class="mt-2 max-w-md text-sm leading-6 text-[var(--c-text)]"
					[translate]="text()!"
				>
					{{ text() }}
				</p>
			}
			<div class="mt-5 flex flex-wrap justify-center gap-3 empty:hidden">
				<ng-content />
			</div>
		</div>
	`,
})
export class StateMessageComponent {
	readonly title = input.required<string>();
	readonly text = input<string>();
	readonly icon = input('info');
	readonly tone = input<StateMessageTone>('neutral');
}
