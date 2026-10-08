import { computed, inject } from '@angular/core';
import { ExclusionReason, Exercise, exclusionReasons } from '@trainup/planner';
import { AccountService } from '../account/account.service';
import { pickSetupInput } from '../account/account.util';
import { ExerciseCatalogService } from './exercise-catalog.service';

/**
 * Reasons an exercise doesn't suit the signed-in user, using the planner's own rules so the
 * catalog and the plans never disagree. Call in an injection context.
 */
export function injectSuitability() {
	const account = inject(AccountService);
	const catalog = inject(ExerciseCatalogService);
	const context = computed(() => {
		const profile = account.profile();
		const setup = account.setup();

		return profile && setup
			? {
					profile: { fitnessLevel: profile.fitnessLevel },
					setup: pickSetupInput(setup),
					limitations: account.activeLimitations().map((limitation) => limitation.area),
					allowedStatuses: catalog.allowedStatuses,
				}
			: null;
	});

	return (exercise: Exercise): ExclusionReason[] => {
		const current = context();

		return current ? exclusionReasons(exercise, current) : [];
	};
}
