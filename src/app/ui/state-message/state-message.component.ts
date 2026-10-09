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
			class="surface flex flex-col items-center px-6 py-10 text-center"
			[attr.role]="tone() === 'error' ? 'alert' : 'status'"
		>
			<span
				class="flex h-16 w-16 items-center justify-center rounded-full"
				[class]="
					tone() === 'error'
						? 'bg-[color:color-mix(in_srgb,var(--c-error)_14%,transparent)] text-[var(--c-error)]'
						: 'bg-[var(--c-bg-tertiary)] text-[var(--c-primary-text)]'
				"
			>
				<span
					class="material-symbols-outlined text-[36px]"
					[class.animate-spin]="tone() === 'loading'"
					aria-hidden="true"
				>
					{{ tone() === 'loading' ? 'progress_activity' : icon() }}
				</span>
			</span>
			<h2
				class="font-display mt-4 text-xl text-[var(--c-text-strong)]"
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
