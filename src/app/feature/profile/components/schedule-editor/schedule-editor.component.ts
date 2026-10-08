import { Component, computed, model } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { NumberFieldComponent } from '../../../../ui/number-field/number-field.component';
import { OptionCardComponent } from '../../../../ui/option-card/option-card.component';
import { OptionPillComponent } from '../../../../ui/option-pill/option-pill.component';
import {
	DAYS_PER_WEEK_OPTIONS,
	FITNESS_LEVEL_OPTIONS,
	PROFILE_LIMITS,
	SESSION_MINUTES_OPTIONS,
	WEEKDAY_OPTIONS,
} from '../../profile.const';
import { ProfileInput, Weekday } from '../../profile.interface';

@Component({
	selector: 'app-schedule-editor',
	imports: [NumberFieldComponent, OptionCardComponent, OptionPillComponent, TranslateDirective],
	templateUrl: './schedule-editor.component.html',
})
export class ScheduleEditorComponent {
	readonly profile = model.required<ProfileInput>();

	protected readonly levelOptions = FITNESS_LEVEL_OPTIONS;
	protected readonly daysPerWeekOptions = DAYS_PER_WEEK_OPTIONS;
	protected readonly sessionMinutesOptions = SESSION_MINUTES_OPTIONS;
	protected readonly weekdayOptions = WEEKDAY_OPTIONS;
	protected readonly limits = PROFILE_LIMITS;
	protected readonly preferredDaysHint =
		'Кількість обраних днів має дорівнювати кількості тренувань на тиждень ({{count}}) — або не обирайте жодного.';

	protected readonly preferredDaysMismatch = computed(() => {
		const profile = this.profile();

		return (
			profile.preferredDays.length > 0 && profile.preferredDays.length !== profile.daysPerWeek
		);
	});

	protected patch(changes: Partial<ProfileInput>) {
		this.profile.update((profile) => ({ ...profile, ...changes }));
	}

	protected toggleDay(day: Weekday) {
		const days = this.profile().preferredDays;
		const next = days.includes(day) ? days.filter((item) => item !== day) : [...days, day];
		const order = this.weekdayOptions.map((option) => option.value);

		this.patch({ preferredDays: next.sort((a, b) => order.indexOf(a) - order.indexOf(b)) });
	}
}
