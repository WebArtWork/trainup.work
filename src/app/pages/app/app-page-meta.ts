import { buildAbsoluteUrl } from '@wawjs/ngx-default';
import { companyProfile } from '../../feature/company/company.data';
import { EXERCISE_IMAGES } from '../../feature/exercise/exercise-images';

const PAGE_TITLES = {
	'sign-in': 'Увійти',
	onboarding: 'Початок роботи',
	today: 'Сьогодні',
	workout: 'Тренування',
	'workout-run': 'Виконання тренування',
	plan: 'План тренувань',
	history: 'Історія тренувань',
	todos: 'Список справ',
	reminders: 'Нагадування',
	explore: 'Вправи',
	'exercise-detail': 'Опис вправи',
	profile: 'Профіль',
	settings: 'Налаштування',
	'ai-settings': 'Налаштування ШІ',
	connect: 'Підключення асистента',
	data: 'Ваші дані',
	'profile-goal': 'Ваша ціль',
	'profile-schedule': 'Рівень і графік',
	'profile-equipment': 'Обладнання',
	'profile-space': 'Простір для тренувань',
	'profile-limitations': 'Обмеження',
	'not-found': 'Сторінку не знайдено',
} as const;

export function appPageMeta(page: keyof typeof PAGE_TITLES) {
	return {
		title: PAGE_TITLES[page],
		image: buildAbsoluteUrl(companyProfile.siteUrl, `/seo/${page}.jpg`),
		robots: 'noindex, nofollow',
	};
}

export function exercisePageMeta(id: string | null) {
	const image = id ? EXERCISE_IMAGES[id] : undefined;

	return {
		...appPageMeta('exercise-detail'),
		...(image ? { image: buildAbsoluteUrl(companyProfile.siteUrl, image) } : {}),
	};
}
