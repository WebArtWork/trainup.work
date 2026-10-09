import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { PageTitleService } from '../../../layouts/app-shell/page-title.service';
import { ExerciseCatalogService } from '../../../feature/exercise/exercise-catalog.service';
import { injectSuitability } from '../../../feature/exercise/exercise-suitability';
import {
	CATEGORY_LABELS,
	EXCLUSION_REASONS,
	MOVEMENT_PATTERN_LABELS,
	MUSCLE_LABELS,
} from '../../../feature/plan/plan.const';
import { FITNESS_LEVEL_OPTIONS } from '../../../feature/profile/profile.const';
import { EQUIPMENT_OPTIONS } from '../../../feature/training-setup/training-setup.const';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [RouterLink, StateMessageComponent, TranslateDirective],
	templateUrl: './exercise-detail.component.html',
})
export class ExerciseDetailComponent {
	private readonly _catalog = inject(ExerciseCatalogService);
	private readonly _suitability = injectSuitability();
	private readonly _id = inject(ActivatedRoute).snapshot.paramMap.get('id');

	protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly exercise = computed(() => this._catalog.byId().get(this._id ?? '') ?? null);
	protected readonly reasons = computed(() => {
		const exercise = this.exercise();

		return exercise
			? this._suitability(exercise).map((reason) => ({ reason, ...EXCLUSION_REASONS[reason] }))
			: [];
	});
	protected readonly facts = computed(() => {
		const exercise = this.exercise();

		if (!exercise) {
			return null;
		}

		const equipmentLabel = (type: string) =>
			EQUIPMENT_OPTIONS.find((option) => option.value === type)?.label ?? type;

		return {
			category: CATEGORY_LABELS[exercise.category],
			pattern: MOVEMENT_PATTERN_LABELS[exercise.movementPattern],
			level: FITNESS_LEVEL_OPTIONS.find((option) => option.value === exercise.fitnessLevel)!.label,
			muscles: [...new Set([...exercise.primaryMuscles, ...exercise.secondaryMuscles])].map(
				(muscle) => MUSCLE_LABELS[muscle],
			),
			/** Each group is "any of"; groups are all required. */
			equipment: exercise.equipmentRequired.map((group) => group.anyOf.map(equipmentLabel)),
			space: exercise.minimumSpace,
		};
	});

	constructor() {
		const pageTitle = inject(PageTitleService);

		effect(() => pageTitle.set(this.exercise()?.name ?? null));
		inject(DestroyRef).onDestroy(() => pageTitle.set(null));

		this._catalog.ensureLoaded().then(
			() => this.state.set('ready'),
			() => this.state.set('error'),
		);
	}
}
