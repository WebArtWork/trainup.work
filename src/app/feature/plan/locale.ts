import { computed, inject } from '@angular/core';
import { LanguageService } from '@wawjs/ngx-translate';
import { environment } from '../../../environments/environment';

/** BCP 47 locale of the active UI language, for `Intl` formatting. Call in an injection context. */
export function injectLocale() {
	const language = inject(LanguageService).language;

	return computed(
		() => environment.languages.find((item) => item.code === language())?.htmlLang ?? 'uk',
	);
}
