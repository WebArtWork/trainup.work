import { Component, model } from '@angular/core';
import { OptionCardComponent } from '../../../../ui/option-card/option-card.component';
import { GOAL_OPTIONS } from '../../profile.const';
import { Goal, ProfileInput } from '../../profile.interface';

@Component({
	selector: 'app-goal-editor',
	imports: [OptionCardComponent],
	template: `
		<div class="grid gap-3" role="group">
			@for (option of goalOptions; track option.value) {
				<button
					type="button"
					appOptionCard
					[label]="option.label"
					[description]="option.description"
					[icon]="option.icon"
					[selected]="profile().goal === option.value"
					(click)="select(option.value)"
				></button>
			}
		</div>
	`,
})
export class GoalEditorComponent {
	readonly profile = model.required<ProfileInput>();

	protected readonly goalOptions = GOAL_OPTIONS;

	protected select(goal: Goal) {
		this.profile.update((profile) => ({ ...profile, goal }));
	}
}
