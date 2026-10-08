import { Component, computed, input, output } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { BODY_AREA_OPTIONS, LimitationInput } from '../../../limitation/limitation.interface';
import {
	ChoiceOption,
	FITNESS_LEVEL_OPTIONS,
	GOAL_OPTIONS,
	WEEKDAY_OPTIONS,
} from '../../../profile/profile.const';
import { ProfileInput } from '../../../profile/profile.interface';
import {
	BAND_RESISTANCE_OPTIONS,
	CEILING_OPTIONS,
	EQUIPMENT_OPTIONS,
	FLOOR_PRESET_OPTIONS,
	LOCATION_OPTIONS,
	SURFACE_OPTIONS,
	YES_NO_UNKNOWN_OPTIONS,
} from '../../../training-setup/training-setup.const';
import {
	EquipmentItem,
	TrainingSetupInput,
} from '../../../training-setup/training-setup.interface';
import { ACCOUNT_SECTIONS, AccountSection } from '../../account.interface';

interface SummaryValue {
	text: string;
	translate: boolean;
	/** Translatable unit shown after the value, such as "кг". */
	unit?: string;
}

interface SummaryLine {
	label: string;
	values: SummaryValue[];
}

interface SummarySection {
	id: AccountSection;
	title: string;
	lines: SummaryLine[];
}

const NOT_SET: SummaryValue = { text: 'Не вказано', translate: true };

@Component({
	selector: 'app-account-summary',
	imports: [TranslateDirective],
	templateUrl: './account-summary.component.html',
})
export class AccountSummaryComponent {
	readonly profile = input.required<ProfileInput>();
	readonly setup = input.required<TrainingSetupInput>();
	readonly limitations = input.required<LimitationInput[]>();
	readonly edit = output<AccountSection>();

	protected readonly sections = computed<SummarySection[]>(() => {
		const lines: Record<AccountSection, SummaryLine[]> = {
			goal: this._goalLines(),
			schedule: this._scheduleLines(),
			equipment: this._equipmentLines(),
			space: this._spaceLines(),
			limitations: this._limitationLines(),
		};

		return ACCOUNT_SECTIONS.map((section) => ({
			id: section.id,
			title: section.title,
			lines: lines[section.id],
		}));
	});

	private _goalLines(): SummaryLine[] {
		return [{ label: 'Ціль', values: [_option(GOAL_OPTIONS, this.profile().goal)] }];
	}

	private _scheduleLines(): SummaryLine[] {
		const profile = this.profile();

		return [
			{ label: 'Рівень', values: [_option(FITNESS_LEVEL_OPTIONS, profile.fitnessLevel)] },
			{ label: 'Тренувань на тиждень', values: [_plain(profile.daysPerWeek)] },
			{ label: 'Тривалість заняття', values: [_plain(profile.sessionMinutes, 'хв')] },
			{
				label: 'Бажані дні',
				values: profile.preferredDays.length
					? profile.preferredDays.map((day) => _option(WEEKDAY_OPTIONS, day))
					: [{ text: 'Будь-які', translate: true }],
			},
			{ label: 'Вік', values: [_plainOrNotSet(profile.age, 'років')] },
			{ label: 'Зріст', values: [_plainOrNotSet(profile.heightCm, 'см')] },
			{ label: 'Вага', values: [_plainOrNotSet(profile.weightKg, 'кг')] },
		];
	}

	private _equipmentLines(): SummaryLine[] {
		const setup = this.setup();
		const lines: SummaryLine[] = setup.noEquipment
			? [{ label: 'Обладнання', values: [{ text: 'Без обладнання', translate: true }] }]
			: setup.equipment.map((item) => ({
					label:
						EQUIPMENT_OPTIONS.find((option) => option.value === item.type)?.label ??
						item.type,
					values: _equipmentDetails(item),
				}));

		if (setup.customEquipment.length) {
			lines.push({
				label: 'Інше обладнання',
				values: setup.customEquipment.map((item) => ({ text: item, translate: false })),
			});
		}

		return lines.length ? lines : [{ label: 'Обладнання', values: [NOT_SET] }];
	}

	private _spaceLines(): SummaryLine[] {
		const setup = this.setup();
		const { lengthM, widthM } = setup.floor;

		return [
			{ label: 'Місце', values: [_option(LOCATION_OPTIONS, setup.location)] },
			{
				label: 'Вільна площа',
				values: [
					lengthM !== null && widthM !== null
						? _plain(`${lengthM} × ${widthM}`, 'м')
						: _option(FLOOR_PRESET_OPTIONS, setup.floor.preset),
				],
			},
			{
				label: 'Висота стелі',
				values: [
					setup.ceiling.heightM !== null
						? _plain(setup.ceiling.heightM, 'м')
						: _option(CEILING_OPTIONS, setup.ceiling.preset),
				],
			},
			{ label: 'Покриття', values: [_option(SURFACE_OPTIONS, setup.surface)] },
			{
				label: 'Тиша',
				values: [
					{
						text: setup.quietOnly ? 'Лише тихі вправи' : 'Шум не проблема',
						translate: true,
					},
				],
			},
			{
				label: 'Лягти на підлогу',
				values: [_option(YES_NO_UNKNOWN_OPTIONS, setup.canLieDown)],
			},
			{ label: 'Стрибки', values: [_option(YES_NO_UNKNOWN_OPTIONS, setup.jumpingAllowed)] },
			{
				label: 'Точка кріплення',
				values: [_option(YES_NO_UNKNOWN_OPTIONS, setup.safeAnchor)],
			},
		];
	}

	private _limitationLines(): SummaryLine[] {
		const limitations = this.limitations();

		if (!limitations.length) {
			return [{ label: 'Обмеження', values: [{ text: 'Немає', translate: true }] }];
		}

		return limitations.map((limitation) => ({
			label:
				BODY_AREA_OPTIONS.find((option) => option.value === limitation.area)?.label ?? '',
			values: limitation.note.trim()
				? [{ text: limitation.note.trim(), translate: false }]
				: [],
		}));
	}
}

function _option<T extends string>(options: ChoiceOption<T>[], value: T | null): SummaryValue {
	const option = options.find((item) => item.value === value);

	return option ? { text: option.label, translate: true } : NOT_SET;
}

function _plain(value: number | string, unit?: string): SummaryValue {
	return { text: String(value), translate: false, unit };
}

function _plainOrNotSet(value: number | null, unit: string): SummaryValue {
	return value === null ? NOT_SET : _plain(value, unit);
}

function _equipmentDetails(item: EquipmentItem): SummaryValue[] {
	if (item.weightsKg) {
		return item.weightsKg.length
			? [_plain(item.weightsKg.join(', '), 'кг')]
			: [{ text: 'Ваги не вказано', translate: true }];
	}

	if (item.resistances) {
		return item.resistances.length
			? item.resistances.map((resistance) => _option(BAND_RESISTANCE_OPTIONS, resistance))
			: [{ text: 'Опір не вказано', translate: true }];
	}

	if (item.adjustable !== undefined) {
		return [{ text: item.adjustable ? 'Регульована' : 'Пряма', translate: true }];
	}

	if (item.safelyInstalled !== undefined) {
		return [
			{
				text: item.safelyInstalled ? 'Надійно закріплений' : 'Не закріплений надійно',
				translate: true,
			},
		];
	}

	return [];
}
