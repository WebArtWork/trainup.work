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
			Тренування
		</h1>
		<app-state-message
			class="mt-6"
			icon="exercise"
			title="Немає запланованого тренування"
			text="Коли план буде готовий, тут з’являться вправи із зображеннями, таймер відпочинку та відмітки підходів."
		/>
	`,
})
export class WorkoutComponent {}
