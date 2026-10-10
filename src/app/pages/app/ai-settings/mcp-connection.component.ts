import { Component, inject, OnInit, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AiConnectionService } from '../../../feature/ai-connection/ai-connection.service';

/** Connect or disconnect an AI assistant that edits the user's workouts through MCP. */
@Component({
	selector: 'app-mcp-connection',
	imports: [TranslateDirective],
	template: `
		<section class="surface mt-4 p-4 sm:p-5" aria-labelledby="mcp-title">
			<div class="flex gap-4">
				<span
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--c-sun)] text-[var(--c-sun-ink)] dark:bg-[color:color-mix(in_srgb,var(--c-primary)_18%,transparent)] dark:text-[var(--c-primary-text)]"
					aria-hidden="true"
				>
					<span class="material-symbols-outlined text-[26px]">hub</span>
				</span>
				<div class="min-w-0 flex-1">
					<h2
						id="mcp-title"
						class="font-display text-lg text-[var(--c-text-strong)]"
						translate
					>
						ШІ-асистент (MCP)
					</h2>
					<p class="mt-1 text-sm leading-6 text-[var(--c-text)]" translate>
						Підключіть ChatGPT, Claude чи іншого асистента: він бачитиме ваш план і вправи, зможе змінювати майбутні тренування та створювати власні вправи. Обмеження, обладнання, простір і час тренування він обійти не зможе.
					</p>
					<p class="mt-3 text-sm leading-6 text-[var(--c-text)]" translate>
						У ChatGPT чи Claude додайте MCP-сервер за цією адресою — асистент попросить дозвіл на цій сторінці, токен вставляти не треба.
					</p>
					<code class="mt-2 block break-all rounded-lg bg-[var(--c-bg-secondary)] p-3 text-sm">{{ service.mcpUrl }}</code>
					@if (service.status() === 'active') {
						<p class="mt-3"><span class="chip chip-success" translate>Підключено токеном</span></p>
					}
				</div>
			</div>

			@if (service.connections().length) {
				<ul class="mt-4 flex flex-col gap-2" [translate]="{ ariaLabel: 'Підключені асистенти' }">
					@for (item of service.connections(); track item.id) {
						<li class="flex items-center justify-between gap-3 rounded-lg bg-[var(--c-bg-secondary)] p-3">
							<span class="min-w-0 truncate text-sm font-semibold text-[var(--c-text-strong)]">
								{{ item.name ?? item.id }}
							</span>
							<button
								type="button"
								class="btn"
								[disabled]="busy()"
								(click)="disconnectOne(item.id)"
								translate
							>
								Відключити
							</button>
						</li>
					}
				</ul>
			}

			@if (token(); as value) {
				<div class="mt-4" role="status">
					<p class="text-sm font-semibold text-[var(--c-text-strong)]" translate>
						Скопіюйте токен зараз — повторно його не показати
					</p>
					<code
						class="mt-2 block break-all rounded-lg bg-[var(--c-bg-secondary)] p-3 text-sm"
						>{{ value }}</code
					>
					<p class="mt-3 text-sm text-[var(--c-text)]" translate>
						Для асистентів без входу через дозвіл: додайте заголовок Authorization: Bearer з цим токеном.
					</p>
					<button type="button" class="btn mt-3" (click)="copy(value)">
						@if (copied()) {
							<span translate>Скопійовано</span>
						} @else {
							<span translate>Копіювати токен</span>
						}
					</button>
				</div>
			}

			@if (error()) {
				<p class="mt-3 text-sm text-[var(--c-danger,#b3261e)]" role="alert" translate>
					Не вдалося виконати дію. Спробуйте ще раз.
				</p>
			}

			<div class="mt-4 flex flex-wrap gap-3">
				<button type="button" class="btn btn-primary" [disabled]="busy()" (click)="connect()">
					@if (service.status() === 'active') {
						<span translate>Створити новий токен</span>
					} @else {
						<span translate>Токен для асистента без дозволу</span>
					}
				</button>
				@if (service.status() === 'active') {
					<button
						type="button"
						class="btn"
						[disabled]="busy()"
						(click)="disconnect()"
						translate
					>
						Відключити
					</button>
				}
			</div>
			@if (service.status() === 'active') {
				<p class="mt-3 text-xs text-[var(--c-text-muted)]" translate>
					Новий токен скасовує попередній. Зміни асистента з’являються в застосунку після оновлення.
				</p>
			}
		</section>
	`,
})
export class McpConnectionComponent implements OnInit {
	protected readonly service = inject(AiConnectionService);
	protected readonly token = signal<string | null>(null);
	protected readonly busy = signal(false);
	protected readonly error = signal(false);
	protected readonly copied = signal(false);

	ngOnInit() {
		this.service.load().catch((error: unknown) => console.error(error));
	}

	protected connect() {
		void this._run(async () => {
			this.copied.set(false);
			this.token.set(await this.service.connect());
		});
	}

	protected disconnect() {
		void this._run(async () => {
			await this.service.disconnect();
			this.token.set(null);
		});
	}

	protected disconnectOne(id: string) {
		void this._run(() => this.service.disconnect(id));
	}

	protected async copy(value: string) {
		await navigator.clipboard?.writeText(value);
		this.copied.set(true);
	}

	private async _run(action: () => Promise<void>) {
		this.busy.set(true);
		this.error.set(false);

		try {
			await action();
		} catch (error) {
			console.error(error);
			this.error.set(true);
		} finally {
			this.busy.set(false);
		}
	}
}
