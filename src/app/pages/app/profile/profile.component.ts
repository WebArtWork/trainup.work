import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountSummaryComponent } from '../../../feature/account/components/account-summary/account-summary.component';
import { AccountSection } from '../../../feature/account/account.interface';
import { AccountService } from '../../../feature/account/account.service';
import { APP_PATHS } from '../../../feature/auth/auth.guard';
import { AuthService } from '../../../feature/auth/auth.service';
import { EMPTY_TRAINING_SETUP_INPUT } from '../../../feature/training-setup/training-setup.const';

@Component({
	imports: [AccountSummaryComponent, TranslateDirective],
	template: `
		@if (profile(); as profile) {
			<header class="flex items-center gap-4">
				@if (profile.photoUrl) {
					<img
						class="h-14 w-14 rounded-full object-cover"
						[src]="profile.photoUrl"
						alt=""
						width="56"
						height="56"
						referrerpolicy="no-referrer"
					/>
				} @else {
					<span
						class="material-symbols-outlined flex h-14 w-14 items-center justify-center rounded-full bg-[var(--c-bg-tertiary)] text-[32px] text-[var(--c-text-muted)]"
						aria-hidden="true"
					>
						person
					</span>
				}
				<div class="min-w-0">
					<h1
						class="truncate text-2xl font-semibold tracking-[-0.02em] text-[var(--c-text-strong)]"
					>
						@if (profile.displayName) {
							{{ profile.displayName }}
						} @else {
							<span translate>Профіль</span>
						}
					</h1>
					@if (profile.email) {
						<p class="truncate text-sm text-[var(--c-text-muted)]">
							{{ profile.email }}
						</p>
					}
				</div>
			</header>

			<h2 class="mt-8 text-lg font-semibold text-[var(--c-text-strong)]" translate>
				Налаштування тренувань
			</h2>
			<div class="mt-3">
				<app-account-summary
					[profile]="profile"
					[setup]="setup()"
					[limitations]="limitations()"
					(edit)="edit($event)"
				/>
			</div>

			<button
				class="theme-focus mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-btn)] border-2 border-[var(--c-border)] bg-[var(--c-bg-secondary)] px-5 text-base font-semibold text-[var(--c-text-strong)] disabled:opacity-60"
				type="button"
				[disabled]="signingOut()"
				(click)="signOut()"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
				<span translate>Вийти</span>
			</button>
		}
	`,
})
export class ProfileComponent {
	private readonly _accountService = inject(AccountService);
	private readonly _authService = inject(AuthService);
	private readonly _router = inject(Router);

	protected readonly profile = this._accountService.profile;
	protected readonly setup = computed(
		() => this._accountService.setup() ?? EMPTY_TRAINING_SETUP_INPUT,
	);
	protected readonly limitations = this._accountService.activeLimitations;
	protected readonly signingOut = signal(false);

	protected edit(section: AccountSection) {
		void this._router.navigate(['/app/profile', section]);
	}

	protected async signOut() {
		this.signingOut.set(true);

		try {
			await this._authService.signOut();
			this._accountService.reset();
			await this._router.navigateByUrl(APP_PATHS.signIn);
		} finally {
			this.signingOut.set(false);
		}
	}
}
