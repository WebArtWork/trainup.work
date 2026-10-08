import { ChoiceOption } from '../profile/profile.const';
import {
	BandResistance,
	CeilingPreset,
	EquipmentType,
	FloorPreset,
	Surface,
	TrainingSetupInput,
	WorkoutLocation,
	YesNoUnknown,
} from './training-setup.interface';

export type EquipmentDetail = 'weights' | 'resistances' | 'adjustable' | 'safely-installed';

export interface EquipmentOption extends ChoiceOption<EquipmentType> {
	icon: string;
	detail?: EquipmentDetail;
	weightOptionsKg?: number[];
}

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
	{ value: 'mat', label: 'Килимок', icon: 'self_improvement' },
	{ value: 'yoga-blocks', label: 'Блоки для йоги', icon: 'view_in_ar' },
	{
		value: 'dumbbells',
		label: 'Гантелі',
		icon: 'fitness_center',
		detail: 'weights',
		weightOptionsKg: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25],
	},
	{
		value: 'resistance-bands',
		label: 'Еспандери-стрічки',
		icon: 'gesture',
		detail: 'resistances',
	},
	{
		value: 'kettlebell',
		label: 'Гиря',
		icon: 'exercise',
		detail: 'weights',
		weightOptionsKg: [4, 6, 8, 10, 12, 16, 20, 24, 28, 32],
	},
	{ value: 'bench', label: 'Лава', icon: 'airline_seat_flat', detail: 'adjustable' },
	{
		value: 'pull-up-bar',
		label: 'Турнік',
		icon: 'horizontal_rule',
		detail: 'safely-installed',
	},
	{ value: 'barbell', label: 'Штанга з дисками', icon: 'linear_scale' },
	{ value: 'rack', label: 'Силова рама або стійки', icon: 'view_column' },
	{ value: 'jump-rope', label: 'Скакалка', icon: 'cable' },
	{ value: 'step-platform', label: 'Степ-платформа', icon: 'stairs' },
	{ value: 'cardio-machine', label: 'Кардіотренажер', icon: 'directions_bike' },
];

export const BAND_RESISTANCE_OPTIONS: ChoiceOption<BandResistance>[] = [
	{ value: 'light', label: 'Легкий' },
	{ value: 'medium', label: 'Середній' },
	{ value: 'heavy', label: 'Сильний' },
];

export const LOCATION_OPTIONS: ChoiceOption<WorkoutLocation>[] = [
	{ value: 'home', label: 'Вдома', icon: 'home' },
	{ value: 'gym', label: 'У спортзалі', icon: 'fitness_center' },
	{ value: 'outdoors', label: 'На вулиці', icon: 'park' },
	{ value: 'other', label: 'Інше місце', icon: 'location_on' },
];

export interface FloorPresetOption extends ChoiceOption<FloorPreset> {
	lengthM: number;
	widthM: number;
}

export const FLOOR_PRESET_OPTIONS: FloorPresetOption[] = [
	{
		value: 'small',
		label: 'Мало місця',
		description: 'Близько 1,5 × 1 м: можна стояти й робити кроки на місці.',
		lengthM: 1.5,
		widthM: 1,
	},
	{
		value: 'medium',
		label: 'Середньо',
		description: 'Близько 2 × 1,5 м: можна лягти на підлогу.',
		lengthM: 2,
		widthM: 1.5,
	},
	{
		value: 'large',
		label: 'Багато місця',
		description: 'Близько 3 × 2 м: можна лягти й витягнути руки, робити випади.',
		lengthM: 3,
		widthM: 2,
	},
];

export const CEILING_OPTIONS: ChoiceOption<CeilingPreset>[] = [
	{ value: 'low', label: 'Низька', description: 'Нижче 2,3 м' },
	{ value: 'normal', label: 'Звичайна', description: '2,3–2,7 м' },
	{ value: 'high', label: 'Висока', description: 'Вище 2,7 м' },
	{ value: 'unknown', label: 'Не знаю' },
];

export const SURFACE_OPTIONS: ChoiceOption<Surface>[] = [
	{ value: 'hard-floor', label: 'Тверда підлога' },
	{ value: 'carpet', label: 'Килим' },
	{ value: 'mat', label: 'Спортивне покриття' },
	{ value: 'grass', label: 'Трава' },
	{ value: 'other', label: 'Інше' },
	{ value: 'unknown', label: 'Не знаю' },
];

export const YES_NO_UNKNOWN_OPTIONS: ChoiceOption<YesNoUnknown>[] = [
	{ value: 'yes', label: 'Так' },
	{ value: 'no', label: 'Ні' },
	{ value: 'unknown', label: 'Не впевнений' },
];

export const SPACE_LIMITS = {
	lengthM: { min: 0.5, max: 50 },
	widthM: { min: 0.5, max: 50 },
	heightM: { min: 1.5, max: 10 },
};

export const EMPTY_TRAINING_SETUP_INPUT: TrainingSetupInput = {
	noEquipment: false,
	equipment: [],
	customEquipment: [],
	location: null,
	floor: { preset: null, lengthM: null, widthM: null },
	ceiling: { preset: 'unknown', heightM: null },
	surface: 'unknown',
	jumpingAllowed: 'unknown',
	quietOnly: false,
	canLieDown: 'unknown',
	safeAnchor: 'unknown',
};
