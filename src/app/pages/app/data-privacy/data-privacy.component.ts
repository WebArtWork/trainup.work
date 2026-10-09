import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { FirebaseError } from 'firebase/app';
import { AppSessionService } from '../../../feature/auth/app-session.service';
import { PrivacyService } from '../../../feature/privacy/privacy.service';

type Task = 'export' | 'delete';

const CANCELLED_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

@Component({
	imports: [RouterLink, TranslateDirective],
	template: `
		<header>
			<a
				class="theme-focus inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-[var(--c-primary)]"
				routerLink="/app/profile"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
				<span translate>Профіль</span>
			</a>
			<h1
				class="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[var(--c-text-strong)] sm:text-3xl"
				translate
			>
				Дані та приватність
			</h1>
			<p class="mt-2 text-sm leading-6 text-[var(--c-text)]" translate>
				Ваші дані належать вам: їх можна завантажити або видалити будь-коли.
			</p>
		</header>

		<section
			class="mt-6 rounded-[calc(var(--radius-card)*1.4)] border border-[var(--c-border)] bg-[var(--c-bg-secondary)] p-5"
			aria-labelledby="export-title"
		>
			<h2 id="export-title" class="text-lg font-semibold text-[var(--c-text-strong)]" translate>
				Завантажити мої дані
			</h2>
			<p class="mt-2 text-sm leading-6 text-[var(--c-text)]" translate>
				Файл JSON із профілем, обладнанням, обмеженнями, планами, тренуваннями, справами та нагадуваннями.
			</p>
			<button
				class="theme-focus mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-btn)] border-2 border-[var(--c-primary)] px-5 text-base font-semibold text-[var(--c-primary)] disabled:opacity-60"
				type="button"
				[disabled]="busy() !== null"
				[attr.aria-busy]="busy() === 'export'"
				(click)="exportData()"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">download</span>
				<span translate>Завантажити мої дані</span>
			</button>
			@if (exported()) {
				<p class="mt-3 text-sm text-[var(--c-text)]" role="status" translate>
					Файл завантажено.
				</p>
			}
			@if (exportError()) {
				<p class="mt-3 text-sm text-[var(--c-error)]" role="alert" translate>
					Не вдалося підготувати файл. Спробуйте ще раз.
				</p>
			}
		</section>

		<section
			class="mt-6 rounded-[calc(var(--radius-card)*1.4)] border border-[var(--c-error)] bg-[var(--c-bg-secondary)] p-5"
			aria-labelledby="delete-title"
		>
			<h2 id="delete-title" class="text-lg font-semibold text-[var(--c-error)]" translate>
				Видалити акаунт
			</h2>
			<p class="mt-2 text-sm leading-6 text-[var(--c-text)]" translate>
				Буде безповоротно видалено ваш профіль, плани, історію тренувань, справи та нагадування. Перед цим вам потрібно ще раз підтвердити вхід.
			</p>

			<label class="mt-4 flex min-h-11 items-start gap-3 text-sm text-[var(--c-text-strong)]">
				<input
					class="theme-focus mt-1 h-5 w-5 shrink-0"
					type="checkbox"
					[checked]="confirmed()"
					[disabled]="busy() !== null"
					(change)="confirmed.set(!confirmed())"
				/>
				<span translate>Я розумію, що видалення не можна скасувати.</span>
			</label>

			<button
				class="theme-focus mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-[var(--c-error)] px-5 text-base font-semibold text-white disabled:opacity-50"
				type="button"
				[disabled]="!confirmed() || busy() !== null"
				[attr.aria-busy]="busy() === 'delete'"
				(click)="deleteAccount()"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">delete_forever</span>
				<span translate>Видалити акаунт і дані</span>
			</button>
			@if (deleteError(); as message) {
				<p class="mt-3 text-sm text-[var(--c-error)]" role="alert" [translate]="message">
					{{ message }}
				</p>
			}
		</section>

		<nav
			class="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold"
			[translate]="{ ariaLabel: 'Юридична інформація' }"
		>
			<a class="theme-focus rounded-md text-[var(--c-primary)]" href="/privacy" target="_blank" rel="noopener" translate>
				Політика конфіденційності
			</a>
			<a class="theme-focus rounded-md text-[var(--c-primary)]" href="/terms" target="_blank" rel="noopener" translate>
				Умови користування
			</a>
		</nav>
	`,
})
export class DataPrivacyComponent {
	private readonly _privacy = inject(PrivacyService);
	private readonly _appSession = inject(AppSessionService);

	protected readonly busy = signal<Task | null>(null);
	protected readonly confirmed = signal(false);
	protected readonly exported = signal(false);
	protected readonly exportError = signal(false);
	protected readonly deleteError = signal<string | null>(null);

	protected async exportData() {
		this.busy.set('export');
		this.exported.set(false);
		this.exportError.set(false);

		try {
			await this._privacy.exportData();
			this.exported.set(true);
		} catch (error) {
			console.error(error);
			this.exportError.set(true);
		} finally {
			this.busy.set(null);
		}
	}

	protected async deleteAccount() {
		this.busy.set('delete');
		this.deleteError.set(null);

		try {
			await this._privacy.deleteAccount();
			await this._appSession.leave();
		} catch (error) {
			const code = error instanceof FirebaseError ? error.code : '';

			if (!CANCELLED_CODES.has(code)) {
				console.error(error);
				this.deleteError.set(
					'Не вдалося видалити акаунт. Деякі дані могли бути видалені; спробуйте ще раз.',
				);
			}
		} finally {
			this.busy.set(null);
		}
	}
}
