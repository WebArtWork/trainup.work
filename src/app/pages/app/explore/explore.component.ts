import { Component } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [StateMessageComponent, TranslateDirective],
	template: `
		<h1
			class="text-2xl font-semibold tracking-[-0.02em] text-[var(--c-text-strong)] sm:text-3xl"
			translate
		>
			Вправи
		</h1>
		<app-state-message
			class="mt-6"
			icon="menu_book"
			title="Каталог вправ готується"
			text="Скоро тут можна буде шукати вправи за ціллю, частиною тіла, обладнанням і потрібним простором."
		/>
	`,
})
export class ExploreComponent {}
