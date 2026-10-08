import { Component, input } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';

/** Compact toggle chip. Apply to a native `<button type="button">`. */
@Component({
	selector: 'button[appOptionPill]',
	imports: [TranslateDirective],
	host: {
		class: 'theme-focus inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 px-4 text-sm font-semibold transition-colors duration-150',
		'[class]': `selected()
			? 'border-[var(--c-primary)] bg-[var(--c-primary)] text-white'
			: 'border-[var(--c-border)] bg-[var(--c-bg-secondary)] text-[var(--c-text-strong)] hover:border-[color:color-mix(in_srgb,var(--c-primary)_45%,var(--c-border))]'`,
		'[attr.aria-pressed]': 'selected()',
	},
	template: `
		@if (translateLabel()) {
			<span [translate]="label()">{{ label() }}</span>
		} @else {
			{{ label() }}
		}
	`,
})
export class OptionPillComponent {
	readonly label = input.required<string>();
	readonly selected = input(false);
	/** Numbers and units such as "30 хв" are formatted by the caller, not translated. */
	readonly translateLabel = input(true);
}
