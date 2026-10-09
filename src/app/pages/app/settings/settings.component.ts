import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService, TranslateDirective, TranslateService } from '@wawjs/ngx-translate';
import { ThemeService } from '@wawjs/ngx-ui';
import { environment } from '../../../../environments/environment';
import { OptionPillComponent } from '../../../ui/option-pill/option-pill.component';

interface SettingsLink {
	path: string;
	label: string;
	icon: string;
}

@Component({
	imports: [OptionPillComponent, RouterLink, TranslateDirective],
	template: `
		<header>
			<a
				class="link inline-flex min-h-11 items-center gap-1 text-sm font-semibold"
				routerLink="/app/profile"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
				<span translate>Профіль</span>
			</a>
			<h1 class="font-display mt-2 text-3xl text-[var(--c-text-strong)] sm:text-4xl" translate>
				Налаштування
			</h1>
		</header>

		<div class="mt-6 flex flex-col gap-5 pb-28">
			<section class="surface divide-y divide-[var(--c-border)]">
				<div class="flex flex-col gap-3 p-4 sm:p-5" role="group" aria-labelledby="theme-title">
					<div class="flex items-center gap-3">
						<span [class]="iconDisc" aria-hidden="true">
							<span class="material-symbols-outlined text-[22px]">contrast</span>
						</span>
						<h2 id="theme-title" class="font-display text-lg text-[var(--c-text-strong)]" translate>
							Тема
						</h2>
					</div>
					<div class="flex flex-wrap gap-2" role="group" [translate]="{ ariaLabel: 'Тема' }">
						<button
							appOptionPill
							label="Світла"
							[selected]="mode() === 'light'"
							(click)="setMode('light')"
						></button>
						<button
							appOptionPill
							label="Темна"
							[selected]="mode() === 'dark'"
							(click)="setMode('dark')"
						></button>
					</div>
				</div>

				<div class="flex flex-col gap-3 p-4 sm:p-5" role="group" aria-labelledby="language-title">
					<div class="flex items-center gap-3">
						<span [class]="iconDisc" aria-hidden="true">
							<span class="material-symbols-outlined text-[22px]">translate</span>
						</span>
						<h2 id="language-title" class="font-display text-lg text-[var(--c-text-strong)]" translate>
							Мова
						</h2>
					</div>
					<div class="flex flex-wrap gap-2" role="group" [translate]="{ ariaLabel: 'Мова' }">
						@for (language of languages(); track language.code) {
							<button
								appOptionPill
								[label]="language.nativeName"
								[translateLabel]="false"
								[selected]="language.code === activeLanguage()"
								(click)="setLanguage(language.code)"
							></button>
						}
					</div>
				</div>
			</section>

			<nav
				class="surface divide-y divide-[var(--c-border)] overflow-hidden"
				[translate]="{ ariaLabel: 'Інші налаштування' }"
			>
				@for (link of links; track link.path) {
					<a
						class="theme-focus flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-[var(--c-bg-tertiary)] sm:px-5"
						[routerLink]="link.path"
					>
						<span [class]="iconDisc" aria-hidden="true">
							<span class="material-symbols-outlined text-[22px]">{{ link.icon }}</span>
						</span>
						<span class="flex-1 text-base font-semibold text-[var(--c-text-strong)]" [translate]="link.label">
							{{ link.label }}
						</span>
						<span class="material-symbols-outlined text-[22px] text-[var(--c-text-muted)]" aria-hidden="true">
							chevron_right
						</span>
					</a>
				}
			</nav>

			<p class="text-center text-xs text-[var(--c-text-muted)]">TrainUp {{ version }}</p>
		</div>

	`,
})
export class SettingsComponent {
	private readonly _languageService = inject(LanguageService);
	private readonly _translateService = inject(TranslateService);
	private readonly _themeService = inject(ThemeService);

	/** Light: sun-yellow disc. Dark: violet tint. */
	protected readonly iconDisc =
		"flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--c-sun)] text-[var(--c-sun-ink)] dark:bg-[color:color-mix(in_srgb,var(--c-primary)_18%,transparent)] dark:text-[var(--c-primary-text)]";
	protected readonly version = environment.appVersion;
	protected readonly activeLanguage = this._languageService.language;
	protected readonly languages = computed(() =>
		this._languageService
			.languages()
			.map((language) => ({
				code: language.code,
				nativeName: (language as { nativeName?: string }).nativeName ?? language.code,
			})),
	);
	protected readonly mode = computed(() => this._themeService.mode() ?? 'light');
	protected readonly links: SettingsLink[] = [
		{ path: '/app/settings/ai', label: 'Штучний інтелект', icon: 'auto_awesome' },
		{ path: '/app/data', label: 'Дані та приватність', icon: 'shield_lock' },
	];

	protected async setLanguage(code: string) {
		await this._translateService.setLanguage(code);
	}

	protected setMode(mode: 'light' | 'dark') {
		this._themeService.setMode(mode);
	}
}
