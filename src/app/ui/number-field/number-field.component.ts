import { booleanAttribute, Component, computed, input, model } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';

let nextId = 0;

/** Labelled numeric input with an optional marker and range validation. Empty means `null`. */
@Component({
	selector: 'app-number-field',
	imports: [TranslateDirective],
	template: `
		<label class="flex flex-col gap-1.5" [for]="id">
			<span class="text-sm font-semibold text-[var(--c-text-strong)]">
				<span [translate]="label()">{{ label() }}</span>
				@if (optional()) {
					<span class="ml-1 font-normal text-[var(--c-text-muted)]" translate
						>(необов’язково)</span
					>
				}
			</span>
			<span class="relative flex items-center">
				<input
					class="theme-focus min-h-12 w-full rounded-[var(--radius-btn)] border-2 bg-[var(--c-bg-secondary)] px-4 pr-14 text-base text-[var(--c-text-strong)]"
					[class]="invalid() ? 'border-[var(--c-error)]' : 'border-[var(--c-border)]'"
					[id]="id"
					type="number"
					inputmode="decimal"
					[min]="min()"
					[max]="max()"
					[step]="step()"
					[value]="value() ?? ''"
					[attr.aria-invalid]="invalid()"
					[attr.aria-describedby]="invalid() ? id + '-error' : null"
					(input)="onInput($any($event.target).value)"
				/>
				@if (unit()) {
					<span
						class="pointer-events-none absolute right-4 text-sm text-[var(--c-text-muted)]"
						[translate]="unit()!"
					>
						{{ unit() }}
					</span>
				}
			</span>
		</label>
		@if (invalid()) {
			<p
				class="mt-1.5 text-sm text-[var(--c-error)]"
				[id]="id + '-error'"
				[translate]="rangeError"
				[vars]="{ min: min(), max: max() }"
			></p>
		}
	`,
})
export class NumberFieldComponent {
	readonly label = input.required<string>();
	readonly unit = input<string>();
	readonly min = input.required<number>();
	readonly max = input.required<number>();
	readonly step = input(1);
	readonly optional = input(false, { transform: booleanAttribute });
	readonly value = model<number | null>(null);

	protected readonly id = `number-field-${nextId++}`;
	protected readonly rangeError = 'Введіть значення від {{min}} до {{max}}';
	protected readonly invalid = computed(() => {
		const value = this.value();

		return value !== null && (value < this.min() || value > this.max());
	});

	protected onInput(raw: string) {
		const parsed = raw.trim() === '' ? null : Number(raw.replace(',', '.'));

		this.value.set(parsed === null || Number.isNaN(parsed) ? null : parsed);
	}
}
