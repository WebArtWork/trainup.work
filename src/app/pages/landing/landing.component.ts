import { Component } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';

interface LandingStep {
	title: string;
	text: string;
}

interface LandingFeature {
	icon: string;
	title: string;
	text: string;
}

@Component({
	imports: [TranslateDirective],
	templateUrl: './landing.component.html',
	styleUrl: './landing.component.scss',
})
export class LandingComponent {
	protected readonly highlights = [
		'Без промптів і чатів',
		'Працює без ШІ',
		'Враховує ваш простір',
	];

	protected readonly planInputs = [
		'Ціль і рівень підготовки',
		'Обладнання, яке у вас справді є',
		'Вільна площа, висота стелі та покриття',
		'Шум, стрибки та обмеження руху',
		'Дні та хвилини, які ви готові виділити',
	];

	protected readonly steps: LandingStep[] = [
		{
			title: 'Опишіть себе картками',
			text: 'Ціль, рівень, графік, обладнання та простір — мінімум тексту, максимум візуального вибору.',
		},
		{
			title: 'Отримайте досяжну програму',
			text: 'Планувальник відкидає вправи, для яких бракує обладнання, місця чи часу, і складає план на 4 тижні.',
		},
		{
			title: 'Тренуйтеся та відмічайте зусилля',
			text: 'Зображення вправ, таймер відпочинку, відмітки підходів і оцінка навантаження — наступні тренування адаптуються обережно.',
		},
	];

	protected readonly features: LandingFeature[] = [
		{
			icon: 'square_foot',
			title: 'Простір має значення',
			text: '«Тренуюсь удома» — це ще не вся інформація. Вузький коридор чи низька стеля змінюють, які вправи вам підходять. TrainUp не вважає невідомий простір придатним для вправ, яким він потрібен.',
		},
		{
			icon: 'auto_awesome',
			title: 'ШІ — лише за бажанням',
			text: 'Основний план складається без ШІ. Якщо ШІ підключено, він може пояснити програму чи запропонувати зміни, але кожну пропозицію перевіряє той самий валідатор обладнання, простору та часу.',
		},
		{
			icon: 'health_and_safety',
			title: 'Безпека понад усе',
			text: 'TrainUp не ставить діагнозів і не замінює консультацію лікаря. Якщо з’явився біль — зупиніться: застосунок не підвищуватиме навантаження автоматично.',
		},
	];
}
