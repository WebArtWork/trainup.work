import { Component, computed, model } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { OptionPillComponent } from '../../../../ui/option-pill/option-pill.component';
import {
	BODY_AREA_OPTIONS,
	BodyArea,
	LIMITATION_NOTE_MAX_LENGTH,
	LimitationInput,
} from '../../limitation.interface';

@Component({
	selector: 'app-limitations-editor',
	imports: [OptionPillComponent, TranslateDirective],
	template: `
		<div class="flex flex-col gap-6">
			<div
				class="surface-inset flex gap-3 p-4"
			>
				<span
					class="material-symbols-outlined text-[24px] text-[var(--c-primary-text)]"
					aria-hidden="true"
				>
					health_and_safety
				</span>
				<p class="text-sm leading-6 text-[var(--c-text)]" translate>
					TrainUp не ставить діагнозів. Якщо у вас травма, хронічне захворювання,
					вагітність чи біль невідомої причини — порадьтеся з лікарем перед тренуваннями.
				</p>
			</div>

			<fieldset class="surface min-w-0 p-4 sm:p-5 [&>legend]:float-left [&>legend]:w-full [&>legend+*]:clear-both">
				<legend class="font-display mb-1 text-lg text-[var(--c-text-strong)]" translate>
					Що варто берегти
				</legend>
				<p class="mb-3 text-sm text-[var(--c-text)]" translate>
					Позначте ділянки, які турбують. Якщо обмежень немає — просто продовжуйте.
				</p>
				<div class="flex flex-wrap gap-2">
					@for (option of areaOptions; track option.value) {
						<button
							type="button"
							appOptionPill
							[label]="option.label"
							[selected]="selectedAreas().has(option.value)"
							(click)="toggle(option.value)"
						></button>
					}
				</div>
			</fieldset>

			@for (limitation of limitations(); track limitation.area) {
				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-semibold text-[var(--c-text-strong)]">
						<span [translate]="areaLabel(limitation.area)">{{
							areaLabel(limitation.area)
						}}</span>
						<span class="ml-1 font-normal text-[var(--c-text-muted)]" translate>
							(нотатка, необов’язково)
						</span>
					</span>
					<textarea
						class="field min-h-20 py-3"
						rows="2"
						[maxLength]="noteMaxLength"
						[value]="limitation.note"
						[translate]="{ placeholder: 'Наприклад, болить при глибоких присіданнях' }"
						(input)="setNote(limitation.area, $any($event.target).value)"
					></textarea>
				</label>
			}
		</div>
	`,
})
export class LimitationsEditorComponent {
	readonly limitations = model.required<LimitationInput[]>();

	protected readonly areaOptions = BODY_AREA_OPTIONS;
	protected readonly noteMaxLength = LIMITATION_NOTE_MAX_LENGTH;
	protected readonly selectedAreas = computed(
		() => new Set(this.limitations().map((limitation) => limitation.area)),
	);

	protected toggle(area: BodyArea) {
		this.limitations.update((limitations) =>
			this.selectedAreas().has(area)
				? limitations.filter((limitation) => limitation.area !== area)
				: [...limitations, { area, note: '' }],
		);
	}

	protected setNote(area: BodyArea, note: string) {
		this.limitations.update((limitations) =>
			limitations.map((limitation) =>
				limitation.area === area ? { ...limitation, note } : limitation,
			),
		);
	}

	protected areaLabel(area: BodyArea): string {
		return this.areaOptions.find((option) => option.value === area)?.label ?? area;
	}
}
