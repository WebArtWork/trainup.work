import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountSummaryComponent } from '../../../feature/account/components/account-summary/account-summary.component';
import { AccountSection } from '../../../feature/account/account.interface';
import { AppSessionService } from '../../../feature/auth/app-session.service';
import { AccountService } from '../../../feature/account/account.service';
import { EMPTY_TRAINING_SETUP_INPUT } from '../../../feature/training-setup/training-setup.const';
import { ExerciseCatalogService } from '../../../feature/exercise/exercise-catalog.service';
import { ExerciseFlagService } from '../../../feature/exercise-flag/exercise-flag.service';

@Component({
	imports: [AccountSummaryComponent, RouterLink, TranslateDirective],
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

			<nav class="mt-8 flex flex-col gap-2" [translate]="{ ariaLabel: 'Інші налаштування' }">
				@for (link of links; track link.path) {
					<a
						class="theme-focus flex min-h-14 items-center gap-3 rounded-[calc(var(--radius-card)*1.4)] border border-[var(--c-border)] bg-[var(--c-bg-secondary)] px-4"
						[routerLink]="link.path"
					>
						<span class="material-symbols-outlined text-[22px] text-[var(--c-primary)]" aria-hidden="true">
							{{ link.icon }}
						</span>
						<span class="flex-1 text-sm font-semibold text-[var(--c-text-strong)]" [translate]="link.label">
							{{ link.label }}
						</span>
						<span class="material-symbols-outlined text-[20px] text-[var(--c-text-muted)]" aria-hidden="true">
							chevron_right
						</span>
					</a>
				}
			</nav>

			@if (pausedExercises().length) {
				<section class="mt-8" aria-labelledby="paused-title">
					<h2 id="paused-title" class="text-lg font-semibold text-[var(--c-text-strong)]" translate>
						Вправи на паузі
					</h2>
					<p class="mt-1 text-sm leading-6 text-[var(--c-text)]" translate>
						Під час цих вправ був біль, тож TrainUp їх не пропонує. Повертайте вправу, лише коли біль минув; за потреби порадьтеся з лікарем.
					</p>
					<ul class="mt-3 divide-y divide-[var(--c-border)] rounded-[calc(var(--radius-card)*1.4)] border border-[var(--c-border)] bg-[var(--c-bg-secondary)]">
						@for (item of pausedExercises(); track item.id) {
							<li class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
								<span class="text-sm text-[var(--c-text-strong)]">
									{{ item.name }}
									<span class="block text-xs text-[var(--c-text-muted)]">{{ item.date }}</span>
								</span>
								<button
									class="theme-focus inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-[var(--c-primary)] hover:bg-[var(--c-bg-tertiary)] disabled:opacity-50"
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
