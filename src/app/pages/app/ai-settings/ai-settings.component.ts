import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { environment } from '../../../../environments/environment';

interface AiMode {
	id: 'rules' | 'app-provided' | 'api-key';
	icon: string;
	title: string;
	text: string;
	show: boolean;
}

/**
 * Profile → AI (README §5.D). Shows only connection methods that actually work: the rule-based
 * planner is always on; AI methods appear once their feature flag is enabled.
 */
@Component({
	imports: [RouterLink, TranslateDirective],
	template: `
		<header>
			<a
				class="theme-focus inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-[var(--c-primary)]"
				routerLink="/app/settings"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
				<span translate>Налаштування</span>
			</a>
			<h1
				class="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[var(--c-text-strong)] sm:text-3xl"
				translate
			>
				Штучний інтелект
			</h1>
			<p class="mt-2 text-sm leading-6 text-[var(--c-text)]" translate>
				ШІ — лише за бажанням. План тренувань складається й без нього; кожну пропозицію ШІ перевіряє той самий валідатор обладнання, простору та часу.
			</p>
		</header>

		<ul class="mt-6 flex flex-col gap-3">
			@for (mode of modes; track mode.id) {
				<li
					class="flex gap-4 rounded-[calc(var(--radius-card)*1.4)] border bg-[var(--c-bg-secondary)] p-4"
					[class]="
						mode.id === 'rules' ? 'border-[var(--c-primary)]' : 'border-[var(--c-border)]'
					"
				>
					<span class="material-symbols-outlined text-[28px] text-[var(--c-primary)]" aria-hidden="true">
						{{ mode.icon }}
					</span>
					<div class="min-w-0 flex-1">
						<h2 class="text-base font-semibold text-[var(--c-text-strong)]" [translate]="mode.title">
							{{ mode.title }}
						</h2>
						<p class="mt-1 text-sm leading-6 text-[var(--c-text)]" [translate]="mode.text">
							{{ mode.text }}
						</p>
						<p class="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--c-text-muted)]">
							@if (mode.id === 'rules') {
								<span class="text-[var(--c-primary)]" translate>Увімкнено</span>
							} @else {
								<span translate>Доступно</span>
							}
						</p>
					</div>
				</li>
			}
		</ul>

		@if (!aiAvailable) {
			<p class="mt-6 text-sm leading-6 text-[var(--c-text-muted)]" translate>
				Підключення ШІ ще не доступне. Коли воно з’явиться, його можна буде ввімкнути тут, а ваше ім’я, email і нотатки до ШІ не надсилатимуться.
			</p>
		}
	`,
})
export class AiSettingsComponent {
	protected readonly aiAvailable = environment.features.ai && (environment.features.aiAppProvided || environment.features.aiApiKey);

	private readonly _flags = environment.features;

	/** The rule-based planner is always listed; AI methods only when their flag is on. */
	protected readonly modes: AiMode[] = (<AiMode[]>[
		{
			id: 'rules',
			icon: 'rule',
			title: 'Правила TrainUp',
			text: 'Детермінований планувальник: враховує обладнання, простір, обмеження та час. Працює завжди.',
			show: true,
		},
		{
			id: 'app-provided',
			icon: 'auto_awesome',
			title: 'ШІ від TrainUp',
			text: 'Пояснення та пропозиції змін до програми через сервіс TrainUp.',
			show: this._flags.ai && this._flags.aiAppProvided,
		},
		{
			id: 'api-key',
			icon: 'key',
			title: 'Власний API-ключ',
			text: 'Підключіть ключ власного провайдера ШІ. Ключ зберігається лише на сервері.',
			show: this._flags.ai && this._flags.aiApiKey,
		},
	]).filter((mode) => mode.show);
}
