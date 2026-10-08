import { FitnessLevel, Goal, ProfileInput, Weekday } from './profile.interface';

export interface ChoiceOption<T extends string> {
	value: T;
	label: string;
	description?: string;
	icon?: string;
}

export const GOAL_OPTIONS: ChoiceOption<Goal>[] = [
	{
		value: 'general-fitness',
		label: 'Загальна фізична форма',
		description: 'Більше енергії, рухливості та сили для щоденного життя.',
		icon: 'favorite',
	},
	{
		value: 'build-strength',
		label: 'Стати сильнішим',
		description: 'Поступово збільшувати силу основних груп м’язів.',
		icon: 'fitness_center',
	},
	{
		value: 'improve-conditioning',
		label: 'Покращити витривалість',
		description: 'Довше тренуватися без втоми та легше відновлюватися.',
		icon: 'directions_run',
	},
];

export const FITNESS_LEVEL_OPTIONS: ChoiceOption<FitnessLevel>[] = [
	{
		value: 'beginner',
		label: 'Початківець',
		description: 'Тренуюся нерегулярно або тільки починаю.',
	},
	{
		value: 'intermediate',
		label: 'Середній рівень',
		description: 'Тренуюся регулярно кілька місяців.',
	},
	{
		value: 'advanced',
		label: 'Досвідчений',
		description: 'Впевнено виконую більшість вправ із правильною технікою.',
	},
];

export const WEEKDAY_OPTIONS: ChoiceOption<Weekday>[] = [
	{ value: 'mon', label: 'Пн' },
	{ value: 'tue', label: 'Вт' },
	{ value: 'wed', label: 'Ср' },
	{ value: 'thu', label: 'Чт' },
	{ value: 'fri', label: 'Пт' },
	{ value: 'sat', label: 'Сб' },
	{ value: 'sun', label: 'Нд' },
];

export const DAYS_PER_WEEK_OPTIONS = [2, 3, 4, 5, 6];

export const SESSION_MINUTES_OPTIONS = [15, 20, 30, 45, 60];

export const PROFILE_LIMITS = {
	age: { min: 16, max: 100 },
	heightCm: { min: 120, max: 230 },
	weightKg: { min: 35, max: 250 },
};

export const EMPTY_PROFILE_INPUT: ProfileInput = {
	goal: null,
	fitnessLevel: null,
	age: null,
	heightCm: null,
	weightKg: null,
	daysPerWeek: 3,
	sessionMinutes: 30,
	preferredDays: [],
};
