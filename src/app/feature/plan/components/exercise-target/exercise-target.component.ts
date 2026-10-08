import { Component, input } from '@angular/core';
import type { PlannedExercise } from '@trainup/planner';
import { TranslateDirective } from '@wawjs/ngx-translate';

/** "3 × 8–10 повт." or "3 × 30 с". */
@Component({
	selector: 'app-exercise-target',
	imports: [TranslateDirective],
	template: `
		@let item = planned();
		<span class="whitespace-nowrap">
			{{ item.sets }} ×
			@if (item.durationSeconds !== null) {
				{{ item.durationSeconds }} <span translate>с</span>
			} @else {
				{{ item.repsMin }}{{ item.repsMax !== item.repsMin ? '–' + item.repsMax : '' }}
				<span translate>повт.</span>
			}
		</span>
	`,
})
export class ExerciseTargetComponent {
	readonly planned = input.required<PlannedExercise>();
}
