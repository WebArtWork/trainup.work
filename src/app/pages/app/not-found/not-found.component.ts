import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

/** Unknown `/app/**` address, shown inside the tab layout so navigation stays available. */
@Component({
	imports: [RouterLink, StateMessageComponent, TranslateDirective],
	template: `
		<app-state-message
			icon="explore_off"
			title="Сторінку не знайдено"
			text="Можливо, посилання застаріло. Поверніться на головну сторінку застосунку."
		>
			<a
				class="btn btn-primary btn-lg"
				routerLink="/app/today"
				translate
			>
				Перейти на «Сьогодні»
			</a>
		</app-state-message>
	`,
})
export class NotFoundComponent {}
