import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';

/** Shown while the browser reports no connection. Saved data syncs when it returns. */
@Component({
	selector: 'app-offline-banner',
	imports: [TranslateDirective],
	template: `
		@if (offline()) {
			<p
				class="flex items-center justify-center gap-2 bg-[var(--c-text-strong)] px-4 py-2 text-center text-sm font-semibold text-[var(--c-bg-primary)]"
				role="status"
			>
				<span class="material-symbols-outlined text-[18px]" aria-hidden="true">cloud_off</span>
				<span translate>Немає з’єднання з інтернетом. Деякі дії можуть не спрацювати.</span>
			</p>
		}
	`,
})
export class OfflineBannerComponent {
	protected readonly offline = signal(typeof navigator !== 'undefined' && navigator.onLine === false);

	constructor() {
		if (typeof window === 'undefined') {
			return;
		}

		const update = () => this.offline.set(!navigator.onLine);

		window.addEventListener('online', update);
		window.addEventListener('offline', update);
		inject(DestroyRef).onDestroy(() => {
			window.removeEventListener('online', update);
			window.removeEventListener('offline', update);
		});
	}
}
