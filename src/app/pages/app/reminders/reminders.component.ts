import { Component, inject, signal } from '@angular/core';
import { scheduleWeekdays, Weekday } from '@trainup/planner';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountService } from '../../../feature/account/account.service';
import { WEEKDAY_OPTIONS } from '../../../feature/profile/profile.const';
import { ReminderService } from '../../../feature/reminder/reminder.service';
import { OptionPillComponent } from '../../../ui/option-pill/option-pill.component';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [OptionPillComponent, StateMessageComponent, TranslateDirective],
	templateUrl: './reminders.component.html',
})
export class RemindersComponent {
	private readonly _accountService = inject(AccountService);

	protected readonly reminderService = inject(ReminderService);
	protected readonly weekdayOptions = WEEKDAY_OPTIONS;
	protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly enabled = signal(true);
	protected readonly time = signal('18:00');
	protected readonly days = signal<Weekday[]>([]);
	protected readonly saving = signal(false);
	protected readonly saved = signal(false);
	protected readonly saveError = signal(false);

	constructor() {
		void this._load();
	}

	protected toggleDay(day: Weekday) {
		const order = this.weekdayOptions.map((option) => option.value);

		this.days.update((days) =>
			(days.includes(day) ? days.filter((item) => item !== day) : [...days, day]).sort(
				(a, b) => order.indexOf(a) - order.indexOf(b),
			),
		);
		this.saved.set(false);
	}

	protected async save() {
		this.saving.set(true);
		this.saved.set(false);
		this.saveError.set(false);

		try {
			await this.reminderService.save({
				enabled: this.enabled(),
				time: this.time(),
				days: this.days(),
			});
			this.saved.set(true);
		} catch (error) {
			console.error(error);
			this.saveError.set(true);
		} finally {
			this.saving.set(false);
		}
	}

	private async _load() {
		try {
			await this.reminderService.ensureLoaded();

			const reminder = this.reminderService.reminder();
			const profile = this._accountService.profile();

			if (reminder) {
				this.enabled.set(reminder.enabled);
				this.time.set(reminder.time);
				this.days.set(reminder.days);
			} else if (profile) {
				// Default to the workout days the plan uses.
				this.days.set(scheduleWeekdays(profile.daysPerWeek, profile.preferredDays));
			}

			this.state.set('ready');
		} catch (error) {
			console.error(error);
			this.state.set('error');
		}
	}
}
