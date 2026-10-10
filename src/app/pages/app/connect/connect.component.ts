import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import {
	AiConnectionService,
	OAuthRequest,
} from '../../../feature/ai-connection/ai-connection.service';

/**
 * Consent screen for an AI assistant that started OAuth at the WAW API. The assistant's name comes
 * from the server's registration record; the host it will return to is shown so a lookalike name
 * cannot pass for the real one.
 */
@Component({
	imports: [TranslateDirective],
	template: `
		<main class="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-4">
			@if (state() === 'loading') {
				<p class="text-center text-[var(--c-text-muted)]" role="status" translate>Завантаження…</p>
			} @else if (state() === 'invalid') {
				<section class="surface p-5" role="alert">
					<h1 class="font-display text-xl text-[var(--c-text-strong)]" translate>
						Запит на підключення недійсний
					</h1>
					<p class="mt-2 text-sm leading-6 text-[var(--c-text)]" translate>
						Поверніться до асистента й почніть підключення ще раз.
					</p>
				</section>
			} @else {
				<section class="surface-raised p-5" aria-labelledby="connect-title">
					<h1 id="connect-title" class="font-display text-xl text-[var(--c-text-strong)]">
						<span translate>Дозволити доступ до TrainUp?</span>
					</h1>
					<p class="mt-3 text-base font-semibold text-[var(--c-text-strong)]">
						{{ client()?.name }}
					</p>
					<p class="text-xs text-[var(--c-text-muted)]">
						<span translate>Повернення на:</span> {{ client()?.redirectHost }}
					</p>
					<p class="mt-3 text-sm leading-6 text-[var(--c-text)]" translate>Асистент зможе:</p>
					<ul class="mt-3 list-disc pl-5 text-sm leading-6 text-[var(--c-text)]">
						<li translate>бачити ваш профіль, план, історію й вправи;</li>
						<li translate>змінювати майбутні тренування та створювати власні вправи.</li>
					</ul>
					<p class="mt-3 text-sm leading-6 text-[var(--c-text-muted)]" translate>
						Обмеження, обладнання, простір і час тренування асистент обійти не зможе. Доступ можна відкликати в налаштуваннях ШІ.
					</p>

					@if (error()) {
						<p class="mt-3 text-sm text-[var(--c-danger,#b3261e)]" role="alert" translate>
							Не вдалося підключити. Спробуйте ще раз.
						</p>
					}

					<div class="mt-5 flex flex-wrap gap-3">
						<button
							type="button"
							class="btn btn-primary"
							[disabled]="busy()"
							(click)="allow()"
							translate
						>
							Дозволити
						</button>
						<button type="button" class="btn" [disabled]="busy()" (click)="cancel()" translate>
							Скасувати
						</button>
					</div>
				</section>
			}
		</main>
	`,
})
export class ConnectComponent implements OnInit {
	private readonly _service = inject(AiConnectionService);
	private readonly _router = inject(Router);
	private readonly _request = this._readRequest();

	protected readonly state = signal<'loading' | 'ready' | 'invalid'>('loading');
	protected readonly client = signal<{ name: string; redirectHost: string } | null>(null);
	protected readonly busy = signal(false);
	protected readonly error = signal(false);

	ngOnInit() {
		const request = this._request;

		if (!request) {
			this.state.set('invalid');

			return;
		}

		this._service.describeClient(request).then(
			(client) => {
				this.client.set(client);
				this.state.set('ready');
			},
			() => this.state.set('invalid'),
		);
	}

	protected async allow() {
		const request = this._request;

		if (!request) {
			return;
		}

		this.busy.set(true);
		this.error.set(false);

		try {
			// Back to the assistant, which finishes the exchange with the server.
			window.location.assign(await this._service.approve(request));
		} catch (error) {
			console.error(error);
			this.error.set(true);
			this.busy.set(false);
		}
	}

	protected cancel() {
		const request = this._request;

		// Tell the assistant it was declined, so it does not wait; without a request just leave.
		if (request) {
			const url = new URL(request.redirect_uri);

			url.searchParams.set('error', 'access_denied');
			if (request.state) {
				url.searchParams.set('state', request.state);
			}

			window.location.assign(url.toString());
		} else {
			void this._router.navigateByUrl('/app/today');
		}
	}

	private _readRequest(): OAuthRequest | null {
		const params = inject(ActivatedRoute).snapshot.queryParamMap;
		const client_id = params.get('client_id');
		const redirect_uri = params.get('redirect_uri');
		const code_challenge = params.get('code_challenge');

		return client_id && redirect_uri && code_challenge
			? { client_id, redirect_uri, code_challenge, state: params.get('state') }
			: null;
	}
}
