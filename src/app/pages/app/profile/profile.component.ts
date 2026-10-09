import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountSummaryComponent } from '../../../feature/account/components/account-summary/account-summary.component';
import { PreferencesControlsComponent } from '../../../ui/preferences-controls/preferences-controls.component';
import { AccountSection } from '../../../feature/account/account.interface';
import { AppSessionService } from '../../../feature/auth/app-session.service';
import { AccountService } from '../../../feature/account/account.service';
import { EMPTY_TRAINING_SETUP_INPUT } from '../../../feature/training-setup/training-setup.const';
import { ExerciseCatalogService } from '../../../feature/exercise/exercise-catalog.service';
import { ExerciseFlagService } from '../../../feature/exercise-flag/exercise-flag.service';

@Component({
	imports: [AccountSummaryComponent, PreferencesControlsComponent, RouterLink, TranslateDirective],
	template: `
		@if (profile(); as profile) {
			<header class="relative flex items-center gap-4">
				<div
					class="pointer-events-none absolute -left-6 -top-8 hidden h-36 w-64 rounded-full bg-[var(--c-primary)] opacity-20 blur-3xl dark:block"
					aria-hidden="true"
				></div>
				@if (profile.photoUrl) {
					<img
						class="relative h-16 w-16 rounded-full border-2 border-[var(--c-border-strong)] object-cover dark:border-0"
						[src]="profile.photoUrl"
						alt=""
						width="64"
						height="64"
						referrerpolicy="no-referrer"
					/>
				} @else {
					<span
						class="material-symbols-outlined relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--c-bg-tertiary)] text-[34px] text-[var(--c-text-muted)]"
						aria-hidden="true"
					>
						person
					</span>
				}
				<div class="relative min-w-0">
					<h1 class="font-display truncate text-3xl text-[var(--c-text-strong)]">
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

			<h2 class="font-display mt-8 text-xl text-[var(--c-text-strong)]" translate>
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

			<nav class="mt-8" [translate]="{ ariaLabel: 'Інші налаштування' }">
				<ul class="surface divide-y divide-[var(--c-border)] overflow-hidden">
					@for (link of links; track link.path) {
						<li>
							<a
								class="theme-focus flex min-h-14 items-center gap-3 px-4 hover:bg-[var(--c-bg-tertiary)]"
								[routerLink]="link.path"
							>
								<span
									class="material-symbols-outlined text-[22px] text-[var(--c-primary-text)]"
									aria-hidden="true"
								>
									{{ link.icon }}
								</span>
								<span
									class="flex-1 text-base font-semibold text-[var(--c-text-strong)]"
									[translate]="link.label"
								>
									{{ link.label }}
								</span>
								<span
									class="material-symbols-outlined text-[20px] text-[var(--c-text-muted)]"
									aria-hidden="true"
								>
									chevron_right
								</span>
							</a>
						</li>
					}
				</ul>
			</nav>

			@if (pausedExercises().length) {
				<section class="mt-8" aria-labelledby="paused-title">
					<h2 id="paused-title" class="font-display text-xl text-[var(--c-text-strong)]" translate>
						Вправи на паузі
					</h2>
					<p class="mt-1 text-sm leading-6 text-[var(--c-text)]" translate>
						Під час цих вправ був біль, тож TrainUp їх не пропонує. Повертайте вправу, лише коли біль минув; за потреби порадьтеся з лікарем.
					</p>
					<ul class="surface mt-3 divide-y divide-[var(--c-border)]">
						@for (item of pausedExercises(); track item.id) {
							<li class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
								<span class="text-sm text-[var(--c-text-strong)]">
									{{ item.name }}
									<span class="block text-xs text-[var(--c-text-muted)]">{{ item.date }}</span>
								</span>
								<button
									class="btn btn-ghost btn-sm"
									type="button"
									[disabled]="resuming() === item.id"
									(click)="resume(item.id)"
									translate
								>
									Повернути
								</button>
							</li>
						}
					</ul>
				</section>
			}

			<section class="surface mt-8 flex items-center justify-between gap-3 p-4">
					<span class="text-base font-semibold text-[var(--c-text-strong)]" translate>
						Мова та тема
					</span>
					<app-preferences-controls dropUp />
				</section>

			<button
				class="btn btn-outline btn-block mt-4"
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
	private readonly _appSession = inject(AppSessionService);
	private readonly _router = inject(Router);

	protected readonly profile = this._accountService.profile;
	protected readonly setup = computed(
		() => this._accountService.setup() ?? EMPTY_TRAINING_SETUP_INPUT,
	);
	protected readonly limitations = this._accountService.activeLimitations;
	protected readonly signingOut = signal(false);
	protected readonly resuming = signal<string | null>(null);
	protected readonly links = [
		{ path: '/app/reminders', label: 'Нагадування', icon: 'notifications' },
		{ path: '/app/todos', label: 'Справи', icon: 'checklist' },
		{ path: '/app/history', label: 'Історія тренувань', icon: 'history' },
		{ path: '/app/settings', label: 'Налаштування', icon: 'settings' },
		{ path: '/app/data', label: 'Дані та приватність', icon: 'shield_lock' },
	];

	private readonly _flags = inject(ExerciseFlagService);
	private readonly _catalog = inject(ExerciseCatalogService);

	protected readonly pausedExercises = computed(() =>
		this._flags.activeFlags().map((flag) => ({
			id: flag.exerciseId,
			name: this._catalog.byId().get(flag.exerciseId)?.name ?? flag.exerciseId,
			date: flag.sessionDate,
		})),
	);

	constructor() {
		void Promise.all([this._flags.ensureLoaded(), this._catalog.ensureLoaded()]).catch(
			(error: unknown) => console.error(error),
		);
	}

	protected async resume(exerciseId: string) {
		this.resuming.set(exerciseId);

		try {
			await this._flags.resume(exerciseId);
		} catch (error) {
			console.error(error);
		} finally {
			this.resuming.set(null);
		}
	}

	protected edit(section: AccountSection) {
		void this._router.navigate(['/app/profile', section]);
	}

	protected async signOut() {
		this.signingOut.set(true);

		try {
			await this._appSession.signOut();
		} finally {
			this.signingOut.set(false);
		}
	}
}
