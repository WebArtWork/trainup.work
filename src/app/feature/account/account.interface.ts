/** Editable account areas, shared by onboarding steps, profile edit routes, and the summary. */
export type AccountSection = 'goal' | 'schedule' | 'equipment' | 'space' | 'limitations';

export interface AccountSectionInfo {
	id: AccountSection;
	title: string;
	description: string;
}

export const ACCOUNT_SECTIONS: AccountSectionInfo[] = [
	{
		id: 'goal',
		title: 'Ваша ціль',
		description: 'Що для вас зараз найважливіше?',
	},
	{
		id: 'schedule',
		title: 'Рівень і графік',
		description: 'Скільки часу ви готові приділяти тренуванням?',
	},
	{
		id: 'equipment',
		title: 'Обладнання',
		description: 'Позначте лише те, що справді є під рукою.',
	},
	{
		id: 'space',
		title: 'Простір для тренувань',
		description: 'Де ви тренуєтеся і скільки там вільного місця?',
	},
	{
		id: 'limitations',
		title: 'Обмеження',
		description: 'Чи є рухи або ділянки тіла, які потрібно берегти?',
	},
];

export function getAccountSection(id: AccountSection): AccountSectionInfo {
	return ACCOUNT_SECTIONS.find((section) => section.id === id)!;
}

export function isAccountSection(value: string | null): value is AccountSection {
	return ACCOUNT_SECTIONS.some((section) => section.id === value);
}
