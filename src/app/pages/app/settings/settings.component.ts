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
				class="theme-focus inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-semibold text-[var(--c-primary)]"
				routerLink="/app/profile"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
				<span translate>Профіль</span>
			</a>
			<h1
				class="mt-3 text-2xl font-semibold tracking-[-0.02em] text-[var(--c-text-strong)] sm:text-3xl"
				translate
			>
				Налаштування
			</h1>
		</header>

		<section class="mt-6" aria-labelledby="language-title">
			<h2 id="language-title" class="text-lg font-semibold text-[var(--c-text-strong)]" translate>
				Мова
			</h2>
			<div class="mt-3 flex flex-wrap gap-2" role="group" [translate]="{ ariaLabel: 'Мова' }">
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
		</section>

		<section class="mt-8" aria-labelledby="theme-title">
			<h2 id="theme-title" class="text-lg font-semibold text-[var(--c-text-strong)]" translate>
				Тема
			</h2>
			<div class="mt-3 flex flex-wrap gap-2" role="group" [translate]="{ ariaLabel: 'Тема' }">
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
		</section>

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

		<p class="mt-8 text-center text-xs text-[var(--c-text-muted)]">
			TrainUp {{ version }}
		</p>
	`,
})
export class SettingsComponent {
	private readonly _languageService = inject(LanguageService);
	private readonly _translateService = inject(TranslateService);
	private readonly _themeService = inject(ThemeService);

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
