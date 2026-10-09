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
		<div class="pb-28">
			<router-outlet />
		</div>

		<nav
			class="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
			[translate]="{ ariaLabel: 'Основна навігація' }"
		>
			<ul
				class="surface-raised mx-auto grid max-w-md grid-cols-4 gap-1 p-1.5 dark:bg-[var(--c-bg-secondary)]/85 dark:backdrop-blur-xl"
			>
				@for (tab of tabs; track tab.path) {
					<li>
						<a
							class="theme-interactive theme-focus flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[calc(var(--radius-card)*0.7)] text-[0.7rem] font-semibold text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)]"
							[routerLink]="tab.path"
							routerLinkActive="!bg-[var(--c-sun)] !text-[var(--c-sun-ink)] dark:!bg-[color:color-mix(in_srgb,var(--c-primary)_24%,transparent)] dark:!text-[var(--c-primary-text)]"
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
