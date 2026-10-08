import { Component, computed, model, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { OptionCardComponent } from '../../../../ui/option-card/option-card.component';
import { OptionPillComponent } from '../../../../ui/option-pill/option-pill.component';
import { BAND_RESISTANCE_OPTIONS, EQUIPMENT_OPTIONS } from '../../training-setup.const';
import {
	BandResistance,
	EquipmentItem,
	EquipmentType,
	TrainingSetupInput,
} from '../../training-setup.interface';

const CUSTOM_ITEM_MAX_LENGTH = 60;
const CUSTOM_ITEMS_MAX = 10;

@Component({
	selector: 'app-equipment-editor',
	imports: [OptionCardComponent, OptionPillComponent, TranslateDirective],
	templateUrl: './equipment-editor.component.html',
})
export class EquipmentEditorComponent {
	readonly setup = model.required<TrainingSetupInput>();

	protected readonly equipmentOptions = EQUIPMENT_OPTIONS;
	protected readonly resistanceOptions = BAND_RESISTANCE_OPTIONS;
	protected readonly customItemMaxLength = CUSTOM_ITEM_MAX_LENGTH;
	protected readonly customDraft = signal('');

	protected readonly selectedTypes = computed(
		() => new Set(this.setup().equipment.map((item) => item.type)),
	);
	/** Selected items that need extra detail, in catalog order. */
	protected readonly detailItems = computed(() =>
		this.equipmentOptions
			.filter((option) => option.detail && this.selectedTypes().has(option.value))
			.map((option) => ({ option, item: this._item(option.value)! })),
	);
	protected readonly canAddCustom = computed(() => {
		const draft = this.customDraft().trim();

		return (
			draft.length > 0 &&
			this.setup().customEquipment.length < CUSTOM_ITEMS_MAX &&
			!this.setup().customEquipment.includes(draft)
		);
	});

	protected toggleNoEquipment() {
		this.setup.update((setup) => ({
			...setup,
			noEquipment: !setup.noEquipment,
			equipment: setup.noEquipment ? setup.equipment : [],
		}));
	}

	protected toggle(type: EquipmentType) {
		this.setup.update((setup) => ({
			...setup,
			noEquipment: false,
			equipment: this.selectedTypes().has(type)
				? setup.equipment.filter((item) => item.type !== type)
				: [...setup.equipment, _newItem(type)],
		}));
	}

	protected toggleWeight(type: EquipmentType, kg: number) {
		this._patchItem(type, (item) => {
			const weights = item.weightsKg ?? [];

			return {
				weightsKg: weights.includes(kg)
					? weights.filter((weight) => weight !== kg)
					: [...weights, kg].sort((a, b) => a - b),
			};
		});
	}

	protected toggleResistance(type: EquipmentType, resistance: BandResistance) {
		this._patchItem(type, (item) => {
			const resistances = item.resistances ?? [];

			return {
				resistances: resistances.includes(resistance)
					? resistances.filter((value) => value !== resistance)
					: [...resistances, resistance],
			};
		});
	}

	protected setFlag(type: EquipmentType, flag: 'adjustable' | 'safelyInstalled', value: boolean) {
		this._patchItem(type, () => ({ [flag]: value }));
	}

	protected addCustom() {
		if (!this.canAddCustom()) {
			return;
		}

		const item = this.customDraft().trim().slice(0, CUSTOM_ITEM_MAX_LENGTH);

		this.setup.update((setup) => ({
			...setup,
			customEquipment: [...setup.customEquipment, item],
		}));
		this.customDraft.set('');
	}

	protected removeCustom(item: string) {
		this.setup.update((setup) => ({
			...setup,
			customEquipment: setup.customEquipment.filter((value) => value !== item),
		}));
	}

	private _item(type: EquipmentType): EquipmentItem | undefined {
		return this.setup().equipment.find((item) => item.type === type);
	}

	private _patchItem(
		type: EquipmentType,
		patch: (item: EquipmentItem) => Partial<EquipmentItem>,
	) {
		this.setup.update((setup) => ({
			...setup,
			equipment: setup.equipment.map((item) =>
				item.type === type ? { ...item, ...patch(item) } : item,
			),
		}));
	}
}

function _newItem(type: EquipmentType): EquipmentItem {
	const detail = EQUIPMENT_OPTIONS.find((option) => option.value === type)?.detail;

	switch (detail) {
		case 'weights':
			return { type, weightsKg: [] };
		case 'resistances':
			return { type, resistances: [] };
		case 'adjustable':
			return { type, adjustable: false };
		// Not usable until the user confirms a safe installation (README §4.1).
		case 'safely-installed':
			return { type, safelyInstalled: false };
		case undefined:
			return { type };
	}
}
