import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FirebaseError } from 'firebase/app';
import { environment } from '../../../../environments/environment';
import {
	CatalogDiff,
	ExercisePublisherService,
} from '../../../feature/admin/exercise-publisher.service';
import { AuthService } from '../../../feature/auth/auth.service';

type Task = 'sign-in' | 'reset' | 'compare' | 'publish';

/**
 * Catalog admin: signs in with an email/password account listed in environment.adminUids (and in
 * isAdmin() in firestore.rules), then publishes src/data/exercise/exercises.json to Firestore.
 * Ukrainian only: it is an internal tool, not part of the user-facing app.
 */
@Component({
	imports: [FormsModule],
	template: `
		<section class="mx-auto flex max-w-xl flex-col gap-6 py-6 sm:py-10">
			<header>
				<h1 class="font-display text-3xl text-[var(--c-text-strong)]">Адміністрування</h1>
				<p class="mt-2 text-sm leading-6 text-[var(--c-text)]">
					Публікація каталогу вправ із src/data/exercise/exercises.json у базу Firestore.
				</p>
			</header>

			@if (user() === undefined) {
				<p class="text-sm text-[var(--c-text-muted)]">Завантаження…</p>
			} @else if (!user()) {
				<form class="surface-raised flex flex-col gap-4 p-5 sm:p-6" (ngSubmit)="signIn()">
					<label class="flex flex-col gap-1.5">
						<span class="text-sm font-semibold text-[var(--c-text-strong)]">Email</span>
						<input
							class="field"
							name="email"
							type="email"
							required
							autocomplete="username"
							[(ngModel)]="email"
						/>
					</label>
					<label class="flex flex-col gap-1.5">
						<span class="text-sm font-semibold text-[var(--c-text-strong)]"
							>Пароль</span
						>
						<input
							class="field"
							name="password"
							type="password"
							required
							autocomplete="current-password"
							[(ngModel)]="password"
						/>
					</label>
					<button
						class="btn btn-primary"
						type="submit"
						[disabled]="busy() !== null"
						[attr.aria-busy]="busy() === 'sign-in'"
					>
						Увійти
					</button>
					<button
						class="link self-center text-sm font-semibold"
						type="button"
						[disabled]="busy() !== null"
						[attr.aria-busy]="busy() === 'reset'"
						(click)="resetPassword()"
					>
						Забули пароль?
					</button>
					@if (message(); as text) {
						<p class="text-sm leading-6 text-[var(--c-success)]" role="status">
							{{ text }}
						</p>
					}
				</form>
			} @else if (!isAdmin()) {
				<div class="surface-raised p-5 sm:p-6">
					<p class="text-sm leading-6 text-[var(--c-text)]">
						Акаунт {{ user()?.email ?? user()?.uid }} не має прав адміністратора.
					</p>
					<button class="btn btn-outline mt-4" type="button" (click)="signOut()">
						Вийти
					</button>
				</div>
			} @else {
				<div class="surface-raised flex flex-col gap-4 p-5 sm:p-6">
					<div class="flex items-center justify-between gap-3">
						<p class="text-sm text-[var(--c-text)]">
							Ви увійшли як
							<b class="text-[var(--c-text-strong)]">{{ user()?.email }}</b>
						</p>
						<button class="btn btn-outline btn-sm" type="button" (click)="signOut()">
							Вийти
						</button>
					</div>

					<div class="flex flex-wrap gap-3">
						<button
							class="btn btn-outline"
							type="button"
							[disabled]="busy() !== null"
							[attr.aria-busy]="busy() === 'compare'"
							(click)="compare()"
						>
							Перевірити зміни
						</button>
						<button
							class="btn btn-primary"
							type="button"
							[disabled]="busy() !== null || !canPublish()"
							[attr.aria-busy]="busy() === 'publish'"
							(click)="publish()"
						>
							Опублікувати вправи
						</button>
					</div>

					@if (diff(); as d) {
						<dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
							<dt class="text-[var(--c-text-muted)]">Вправ у файлі</dt>
							<dd class="text-[var(--c-text-strong)]">
								{{ d.total }} (опубліковано: {{ d.published }})
							</dd>
							<dt class="text-[var(--c-text-muted)]">Нові</dt>
							<dd class="text-[var(--c-text-strong)]">{{ d.toCreate.length }}</dd>
							<dt class="text-[var(--c-text-muted)]">Змінені</dt>
							<dd class="text-[var(--c-text-strong)]">{{ d.toUpdate.length }}</dd>
							<dt class="text-[var(--c-text-muted)]">Без змін</dt>
							<dd class="text-[var(--c-text-strong)]">{{ d.unchanged }}</dd>
							<dt class="text-[var(--c-text-muted)]">Лише в базі</dt>
							<dd class="text-[var(--c-text-strong)]">
								{{ d.onlyInFirestore.length }}
							</dd>
						</dl>

						@if (d.issues.length) {
							<div
								class="surface border-[var(--c-error)] p-4 text-sm text-[var(--c-error)]"
								role="alert"
							>
								<p class="font-semibold">
									Помилки в каталозі, публікацію заблоковано:
								</p>
								<ul class="mt-2 list-disc space-y-1 pl-5">
									@for (issue of d.issues; track issue.id) {
										<li>{{ issue.id }}: {{ issue.problems.join('; ') }}</li>
									}
								</ul>
							</div>
						}
					}

					@if (message(); as text) {
						<p class="text-sm text-[var(--c-success)]" role="status">{{ text }}</p>
					}
				</div>
			}

			@if (error(); as text) {
				<p
					class="surface border-[var(--c-error)] p-4 text-sm text-[var(--c-error)]"
					role="alert"
				>
					{{ text }}
				</p>
			}
		</section>
	`,
})
export class AdminComponent implements OnInit {
	private readonly _authService = inject(AuthService);
	private readonly _publisher = inject(ExercisePublisherService);

	protected readonly user = this._authService.user;
	protected readonly isAdmin = computed(() => {
		const uid = this.user()?.uid;

		return !!uid && environment.adminUids.includes(uid);
	});
	protected readonly busy = signal<Task | null>(null);
	protected readonly diff = signal<CatalogDiff | null>(null);
	protected readonly canPublish = computed(() => {
		const diff = this.diff();

		return !!diff && !diff.issues.length && diff.toCreate.length + diff.toUpdate.length > 0;
	});
	protected readonly message = signal<string | null>(null);
	protected readonly error = signal<string | null>(null);

	protected email = '';
	protected password = '';

	ngOnInit() {
		void this._authService.whenReady();
	}

	protected async signIn() {
		await this._run('sign-in', async () => {
			await this._authService.signInWithEmail(this.email.trim(), this.password);
			this.password = '';
		});
	}

	protected async resetPassword() {
		const email = this.email.trim();

		if (!email) {
			this.error.set('Введіть email, і ми надішлемо на нього посилання для зміни пароля.');
			return;
		}

		await this._run('reset', async () => {
			await this._authService.sendPasswordReset(email);
			// Firebase doesn't reveal whether the account exists, so the message can't either.
			this.message.set(
				`Якщо акаунт ${email} існує, на нього надіслано лист із посиланням для зміни пароля. Перевірте також «Спам».`,
			);
		});
	}

	protected async signOut() {
		this.diff.set(null);
		this.message.set(null);
		await this._authService.signOut();
	}

	protected async compare() {
		await this._run('compare', async () => {
			this.diff.set(await this._publisher.compare());
		});
	}

	protected async publish() {
		await this._run('publish', async () => {
			const written = await this._publisher.publish();
			const count = written.toCreate.length + written.toUpdate.length;

			this.diff.set(await this._publisher.compare());
			this.message.set(`Готово: записано вправ — ${count}.`);
		});
	}

	private async _run(task: Task, action: () => Promise<void>) {
		this.busy.set(task);
		this.error.set(null);
		this.message.set(null);

		try {
			await action();
		} catch (error) {
			console.error(error);
			this.error.set(_errorMessage(error));
		} finally {
			this.busy.set(null);
		}
	}
}

function _errorMessage(error: unknown): string {
	const code = error instanceof FirebaseError ? error.code : '';

	switch (code) {
		case 'auth/invalid-credential':
		case 'auth/wrong-password':
		case 'auth/user-not-found':
			return 'Невірний email або пароль.';
		case 'auth/invalid-email':
			return 'Перевірте email: схоже, в ньому помилка.';
		case 'auth/too-many-requests':
			return 'Забагато спроб. Спробуйте трохи пізніше.';
		case 'permission-denied':
			return 'База відмовила в доступі. Перевірте, що правила Firestore з вашим UID опубліковані.';
		case 'auth/network-request-failed':
		case 'unavailable':
			return 'Немає з’єднання з інтернетом.';
		default:
			return error instanceof Error ? error.message : 'Щось пішло не так.';
	}
}
