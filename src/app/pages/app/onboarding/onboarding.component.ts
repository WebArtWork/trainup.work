import { DOCUMENT } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StoreService } from '@wawjs/ngx-core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountSummaryComponent } from '../../../feature/account/components/account-summary/account-summary.component';
import { ACCOUNT_SECTIONS, AccountSection } from '../../../feature/account/account.interface';
import { AccountService } from '../../../feature/account/account.service';
import {
	isEquipmentComplete,
	isGoalComplete,
	isLimitationsComplete,
	isScheduleComplete,
	isSpaceComplete,
	pickProfileInput,
} from '../../../feature/account/account.util';
import { APP_PATHS } from '../../../feature/auth/auth.guard';
import { AuthService } from '../../../feature/auth/auth.service';
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

type OnboardingStep = AccountSection | 'review';

interface OnboardingDraft {
	step: OnboardingStep;
	profile: ProfileInput;
	setup: TrainingSetupInput;
	limitations: LimitationInput[];
}

const STEPS: OnboardingStep[] = [...ACCOUNT_SECTIONS.map((section) => section.id), 'review'];

@Component({
	imports: [
		AccountSummaryComponent,
		EquipmentEditorComponent,
		GoalEditorComponent,
		LimitationsEditorComponent,
		ScheduleEditorComponent,
		SpaceEditorComponent,
		TranslateDirective,
	],
	templateUrl: './onboarding.component.html',
})
export class OnboardingComponent {
	private readonly _accountService = inject(AccountService);
	private readonly _storeService = inject(StoreService);
	private readonly _router = inject(Router);
	private readonly _document = inject(DOCUMENT);
	private readonly _draftKey = `onboarding-draft-${inject(AuthService).user()?.uid ?? ''}`;

	protected readonly step = signal<OnboardingStep>('goal');
	protected readonly profile = signal<ProfileInput>(
		pickProfileInput(this._accountService.profile() ?? EMPTY_PROFILE_INPUT),
	);
	protected readonly setup = signal<TrainingSetupInput>(EMPTY_TRAINING_SETUP_INPUT);
	protected readonly limitations = signal<LimitationInput[]>([]);
	protected readonly saving = signal(false);
	protected readonly error = signal(false);
	protected readonly restored = signal(false);

	protected readonly stepIndex = computed(() => STEPS.indexOf(this.step()));
	protected readonly totalSteps = STEPS.length;
	protected readonly progressLabel = 'Крок {{current}} з {{total}}';
	protected readonly heading = computed(() => {
		const step = this.step();

		return step === 'review'
			? { title: 'Перевірте дані', description: 'Усе можна змінити пізніше в профілі.' }
			: ACCOUNT_SECTIONS.find((section) => section.id === step)!;
	});
	protected readonly canContinue = computed(() => {
		const step = this.step();

		return step === 'review'
			? ACCOUNT_SECTIONS.every((section) => this._isComplete(section.id))
			: this._isComplete(step);
	});

	constructor() {
		void this._restoreDraft();

		effect(() => {
			const draft: OnboardingDraft = {
				step: this.step(),
				profile: this.profile(),
				setup: this.setup(),
				limitations: this.limitations(),
			};

			if (this.restored()) {
				void this._storeService.setJson(this._draftKey, draft);
			}
		});
	}

	protected next() {
		if (this.canContinue() && this.stepIndex() < STEPS.length - 1) {
			this._goTo(STEPS[this.stepIndex() + 1]!);
		}
	}

	protected back() {
		if (this.stepIndex() > 0) {
			this._goTo(STEPS[this.stepIndex() - 1]!);
		}
	}

	protected edit(section: AccountSection) {
		this._goTo(section);
	}

	protected async finish() {
		if (!this.canContinue() || this.saving()) {
			return;
		}

		this.saving.set(true);
		this.error.set(false);

		try {
			await this._accountService.completeOnboarding(
				this.profile(),
				this.setup(),
				this.limitations(),
			);
			await this._storeService.remove(this._draftKey);
			await this._router.navigateByUrl(APP_PATHS.home);
		} catch (error) {
			console.error(error);
			this.error.set(true);
		} finally {
			this.saving.set(false);
		}
	}

	private _goTo(step: OnboardingStep) {
		this.step.set(step);
		this._document.defaultView?.scrollTo({ top: 0 });
	}

	private _isComplete(section: AccountSection): boolean {
		switch (section) {
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
	}

	private async _restoreDraft() {
		const draft = await this._storeService.getJson<OnboardingDraft>(this._draftKey);

		if (draft && STEPS.includes(draft.step)) {
			this.profile.set({ ...EMPTY_PROFILE_INPUT, ...draft.profile });
			this.setup.set({ ...EMPTY_TRAINING_SETUP_INPUT, ...draft.setup });
			this.limitations.set(draft.limitations ?? []);
			this.step.set(draft.step);
		}

		this.restored.set(true);
	}
}
