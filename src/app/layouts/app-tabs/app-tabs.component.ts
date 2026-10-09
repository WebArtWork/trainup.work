import { Component, DestroyRef, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { OfflineBannerComponent } from '../../ui/offline-banner/offline-banner.component';
import { ReminderService } from '../../feature/reminder/reminder.service';

interface AppTab {
	path: string;
	label: string;
	icon: string;
}

/** Bottom navigation for the main app pages (README §7). */
@Component({
	imports: [OfflineBannerComponent, RouterLink, RouterLinkActive, RouterOutlet, TranslateDirective],
	template: `
		<app-offline-banner />
		<div class="pb-24">
			<router-outlet />
		</div>

		<nav
			class="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--c-border)] bg-[var(--c-bg-secondary)] pb-[env(safe-area-inset-bottom)]"
			[translate]="{ ariaLabel: 'Основна навігація' }"
		>
			<ul class="mx-auto grid max-w-2xl grid-cols-4">
				@for (tab of tabs; track tab.path) {
					<li>
						<a
							class="theme-focus flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold text-[var(--c-text-muted)]"
							[routerLink]="tab.path"
							routerLinkActive="!text-[var(--c-primary)]"
							ariaCurrentWhenActive="page"
						>
							<span class="material-symbols-outlined text-[24px]" aria-hidden="true">
								{{ tab.icon }}
							</span>
							<span [translate]="tab.label">{{ tab.label }}</span>
						</a>
					</li>
				}
			</ul>
		</nav>
	`,
})
export class AppTabsComponent {
	protected readonly tabs: AppTab[] = [
		{ path: '/app/today', label: 'Сьогодні', icon: 'today' },
		{ path: '/app/workout', label: 'Тренування', icon: 'exercise' },
		{ path: '/app/explore', label: 'Вправи', icon: 'search' },
		{ path: '/app/profile', label: 'Профіль', icon: 'person' },
	];

	constructor() {
		// In-browser workout reminders run while the signed-in app is open.
		const reminders = inject(ReminderService);

		reminders.ensureLoaded().catch((error: unknown) => console.error(error));
		inject(DestroyRef).onDestroy(() => reminders.stop());
	}
}
