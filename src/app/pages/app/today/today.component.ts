import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountService } from '../../../feature/account/account.service';
import { GOAL_OPTIONS } from '../../../feature/profile/profile.const';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [RouterLink, StateMessageComponent, TranslateDirective],
	template: `
		<header>
			<h1
				class="text-2xl font-semibold tracking-[-0.02em] text-[var(--c-text-strong)] sm:text-3xl"
			>
				<span translate>Сьогодні</span>
			</h1>
			@if (firstName(); as name) {
				<p class="mt-1 text-base text-[var(--c-text)]">
					<span translate>Привіт</span>, {{ name }}!
				</p>
			}
		</header>

		@if (goalLabel(); as goal) {
			<p
				class="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--c-bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--c-text-strong)]"
			>
				<span
					class="material-symbols-outlined text-[18px] text-[var(--c-primary)]"
					aria-hidden="true"
				>
					flag
				</span>
				<span [translate]="goal">{{ goal }}</span>
			</p>
		}

		<app-state-message
			class="mt-6"
			icon="event_upcoming"
			title="План тренувань з’явиться тут"
			text="Генератор планів ще в розробці. Ваші ціль, графік, обладнання та простір уже збережено — план їх врахує."
		>
			<a
				class="theme-focus inline-flex min-h-12 items-center gap-2 rounded-[var(--radius-btn)] border-2 border-[var(--c-border)] px-5 text-sm font-semibold text-[var(--c-text-strong)]"
				routerLink="/app/profile"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">tune</span>
				<span translate>Переглянути налаштування</span>
			</a>
		</app-state-message>
	`,
})
export class TodayComponent {
	private readonly _accountService = inject(AccountService);

	protected readonly firstName = computed(
		() => this._accountService.profile()?.displayName.split(' ')[0] ?? '',
	);
	protected readonly goalLabel = computed(
		() =>
			GOAL_OPTIONS.find((option) => option.value === this._accountService.profile()?.goal)
				?.label,
	);
}
