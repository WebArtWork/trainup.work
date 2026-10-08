import { Component, input } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';

/** Large tap target for visual single/multi choice. Apply to a native `<button type="button">`. */
@Component({
	selector: 'button[appOptionCard]',
	imports: [TranslateDirective],
	host: {
		class: 'theme-focus flex w-full min-h-16 items-start gap-3 rounded-[calc(var(--radius-card)*1.6)] border-2 p-4 text-left transition-colors duration-150',
		'[class]': `selected()
			? 'border-[var(--c-primary)] bg-[color:color-mix(in_srgb,var(--c-primary)_8%,var(--c-bg-secondary))]'
			: 'border-[var(--c-border)] bg-[var(--c-bg-secondary)] hover:border-[color:color-mix(in_srgb,var(--c-primary)_45%,var(--c-border))]'`,
		'[attr.aria-pressed]': 'selected()',
	},
	template: `
		@if (icon()) {
			<span
				class="material-symbols-outlined mt-0.5 text-[28px]"
				[class]="selected() ? 'text-[var(--c-primary)]' : 'text-[var(--c-text-muted)]'"
				aria-hidden="true"
			>
				{{ icon() }}
			</span>
		}
		<span class="flex min-w-0 flex-1 flex-col">
			<span class="text-base font-semibold text-[var(--c-text-strong)]" [translate]="label()">
				{{ label() }}
			</span>
			@if (description()) {
				<span
					class="mt-1 text-sm leading-6 text-[var(--c-text)]"
					[translate]="description()!"
				>
					{{ description() }}
				</span>
			}
		</span>
		<span
			class="material-symbols-outlined text-[22px]"
			[class]="selected() ? 'text-[var(--c-primary)]' : 'text-[var(--c-border)]'"
			aria-hidden="true"
		>
			{{ selected() ? 'check_circle' : 'radio_button_unchecked' }}
		</span>
	`,
})
export class OptionCardComponent {
	readonly label = input.required<string>();
	readonly description = input<string>();
	readonly icon = input<string>();
	readonly selected = input(false);
}
