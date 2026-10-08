import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountSection, getAccountSection } from '../../../feature/account/account.interface';
import { AccountService } from '../../../feature/account/account.service';
import {
	isEquipmentComplete,
	isGoalComplete,
	isLimitationsComplete,
	isScheduleComplete,
	isSpaceComplete,
	pickProfileInput,
	pickSetupInput,
} from '../../../feature/account/account.util';
import { LimitationsEditorComponent } from '../../../feature/limitation/components/limitations-editor/limitations-editor.component';
import { LimitationInput } from '../../../feature/limitation/limitation.interface';
import { GoalEditorComponent } from '../../../feature/profile/components/goal-editor/goal-editor.component';
import { ScheduleEditorComponent } from '../../../feature/profile/components/schedule-editor/schedule-editor.component';
import { EMPTY_PROFILE_INPUT } from '../../../feature/profile/profile.const';
import { ProfileInput } from '../../../feature/profile/profile.interface';
import { EquipmentEditorComponent } from '../../../feature/training-setup/components/equipment-editor/equipment-editor.component';
import { SpaceEditorComponent } from '../../../feature/training-setup/components/space-editor/space-editor.component';
import { EMPTY_TRAINING_SETUP_INPUT } from '../../../feature/training-setup/training-setup.const';
import { TrainingSetupInput } from '../../../feature/training-setup/training-setup.interface';

const PROFILE_PATH = '/app/profile';

@Component({
	imports: [
		EquipmentEditorComponent,
		GoalEditorComponent,
		LimitationsEditorComponent,
		RouterLink,
		ScheduleEditorComponent,
		SpaceEditorComponent,
		TranslateDirective,
	],
	templateUrl: './profile-edit.component.html',
})
export class ProfileEditComponent {
	private readonly _accountService = inject(AccountService);
	private readonly _router = inject(Router);

	/** Validated by the route's `canActivate` guard. */
	protected readonly section = inject(ActivatedRoute).snapshot.paramMap.get(
		'section',
	) as AccountSection;
	protected readonly info = getAccountSection(this.section);
	protected readonly profilePath = PROFILE_PATH;

	protected readonly profile = signal<ProfileInput>(
		pickProfileInput(this._accountService.profile() ?? EMPTY_PROFILE_INPUT),
	);
	protected readonly setup = signal<TrainingSetupInput>(
		pickSetupInput(this._accountService.setup() ?? EMPTY_TRAINING_SETUP_INPUT),
	);
	protected readonly limitations = signal<LimitationInput[]>(
		this._accountService.activeLimitations().map(({ area, note }) => ({ area, note })),
	);
	protected readonly saving = signal(false);
	protected readonly error = signal(false);

	protected readonly canSave = computed(() => {
		switch (this.section) {
			case 'goal':
				return isGoalComplete(this.profile());
			case 'schedule':
				return isScheduleComplete(this.profile());
			case 'equipment':
				return isEquipmentComplete(this.setup());
			case 'space':
				return isSpaceComplete(this.setup());
			case 'limitations':
				return isLimitationsComplete(this.limitations());
		}
	});

	protected async save() {
		if (!this.canSave() || this.saving()) {
			return;
		}

		this.saving.set(true);
		this.error.set(false);

		try {
			switch (this.section) {
				case 'goal':
				case 'schedule':
					await this._accountService.saveProfile(this.profile());
					break;
				case 'equipment':
				case 'space':
					await this._accountService.saveSetup(this.setup());
					break;
				case 'limitations':
					await this._accountService.saveLimitations(this.limitations());
					break;
			}

			await this._router.navigateByUrl(PROFILE_PATH);
		} catch (error) {
			console.error(error);
			this.error.set(true);
		} finally {
			this.saving.set(false);
		}
	}
}
