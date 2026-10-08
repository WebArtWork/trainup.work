import { Component, computed, model, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { NumberFieldComponent } from '../../../../ui/number-field/number-field.component';
import { OptionCardComponent } from '../../../../ui/option-card/option-card.component';
import { OptionPillComponent } from '../../../../ui/option-pill/option-pill.component';
import {
	CEILING_OPTIONS,
	FLOOR_PRESET_OPTIONS,
	LOCATION_OPTIONS,
	SPACE_LIMITS,
	SURFACE_OPTIONS,
	YES_NO_UNKNOWN_OPTIONS,
} from '../../training-setup.const';
import {
	CeilingClearance,
	FloorSpace,
	TrainingSetupInput,
	YesNoUnknown,
} from '../../training-setup.interface';

type YesNoUnknownField = 'jumpingAllowed' | 'canLieDown' | 'safeAnchor';

interface YesNoUnknownQuestion {
	field: YesNoUnknownField;
	title: string;
	hint: string;
}

@Component({
	selector: 'app-space-editor',
	imports: [NumberFieldComponent, OptionCardComponent, OptionPillComponent, TranslateDirective],
	templateUrl: './space-editor.component.html',
})
export class SpaceEditorComponent {
	readonly setup = model.required<TrainingSetupInput>();

	protected readonly locationOptions = LOCATION_OPTIONS;
	protected readonly floorPresetOptions = FLOOR_PRESET_OPTIONS;
	protected readonly ceilingOptions = CEILING_OPTIONS;
	protected readonly surfaceOptions = SURFACE_OPTIONS;
	protected readonly yesNoUnknownOptions = YES_NO_UNKNOWN_OPTIONS;
	protected readonly limits = SPACE_LIMITS;
	protected readonly questions: YesNoUnknownQuestion[] = [
		{
			field: 'canLieDown',
			title: 'Чи можна лягти на підлогу?',
			hint: 'Потрібно для вправ лежачи: планок, віджимань, скручувань.',
		},
		{
			field: 'jumpingAllowed',
			title: 'Чи можна стрибати?',
			hint: 'Стрибки й ударне навантаження: зважте на сусідів знизу та покриття.',
		},
		{
			field: 'safeAnchor',
			title: 'Чи є надійна точка кріплення?',
			hint: 'Наприклад, для еспандера: дверний анкер або стіна, які витримають натяг.',
		},
	];

	protected readonly showExactFloor = signal(false);
	protected readonly hasExactFloor = computed(
		() => this.setup().floor.lengthM !== null || this.setup().floor.widthM !== null,
	);

	protected patch(changes: Partial<TrainingSetupInput>) {
		this.setup.update((setup) => ({ ...setup, ...changes }));
	}

	protected patchFloor(changes: Partial<FloorSpace>) {
		this.setup.update((setup) => ({ ...setup, floor: { ...setup.floor, ...changes } }));
	}

	protected patchCeiling(changes: Partial<CeilingClearance>) {
		this.setup.update((setup) => ({ ...setup, ceiling: { ...setup.ceiling, ...changes } }));
	}

	protected setAnswer(field: YesNoUnknownField, value: YesNoUnknown) {
		this.patch({ [field]: value });
	}
}
