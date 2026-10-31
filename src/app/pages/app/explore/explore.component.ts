import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import type { Exercise } from '@trainup/planner';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ExerciseCatalogService } from '../../../feature/exercise/exercise-catalog.service';
import { assignTrainers, exerciseTrainers, interleaveByTrainer } from '../../../feature/trainer/trainer.interface';
import { ExploreFilterService } from '../../../feature/exercise/explore-filter.service';
import { injectSuitability } from '../../../feature/exercise/exercise-suitability';
import { MOVEMENT_PATTERN_LABELS } from '../../../feature/plan/plan.const';
import { FITNESS_LEVEL_OPTIONS } from '../../../feature/profile/profile.const';
import { ExerciseImageComponent } from '../../../ui/exercise-image/exercise-image.component';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [ExerciseImageComponent, RouterLink, StateMessageComponent, TranslateDirective],
	templateUrl: './explore.component.html',
})
export class ExploreComponent {
	private readonly _suitability = injectSuitability();

	private readonly _equipmentFilter = toSignal(
		inject(ActivatedRoute).queryParamMap.pipe(
			map((params) => (params.get('equipment') ?? '').split(',').filter(Boolean)),
		),
		{ initialValue: [] as string[] },
	);

	protected readonly catalog = inject(ExerciseCatalogService);
	private readonly _filters = inject(ExploreFilterService);
	protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly patternLabels = MOVEMENT_PATTERN_LABELS;

	protected readonly items = computed(() => {
		const search = this._filters.search().trim().toLocaleLowerCase('uk');
		const category = this._filters.category();
		const equipment = this._equipmentFilter();
		const trainer = this._filters.trainer();
		const location = this._filters.location();
		const matches = this.catalog
			.exercises()
			.map((exercise) => ({ exercise, suitable: this._suitability(exercise).length === 0 }))
			.filter(
				({ exercise, suitable }) =>
					(category === 'all' || exercise.category === category) &&
					(trainer === 'all' || exerciseTrainers(exercise).includes(trainer)) &&
					(location === 'all' || exercise.minimumSpace.locations.includes(location)) &&
					(!equipment.length || this._usesEquipment(exercise, equipment)) &&
					(!this._filters.suitableOnly() || suitable) &&
					(!search || exercise.name.toLocaleLowerCase('uk').includes(search)),
			);

		return assignTrainers(trainer === 'all' ? interleaveByTrainer(matches) : matches, trainer);
	});

	constructor() {
		this.catalog.ensureLoaded().then(
			() => this.state.set('ready'),
			() => this.state.set('error'),
		);
	}

	protected readonly equipmentFiltered = computed(() => this._equipmentFilter().length > 0);

	private _usesEquipment(exercise: Exercise, types: string[]): boolean {
		return exercise.equipmentRequired.some((group) =>
			group.anyOf.some((type) => types.includes(type)),
		);
	}

	protected levelLabel(level: string): string {
		return FITNESS_LEVEL_OPTIONS.find((option) => option.value === level)?.label ?? level;
	}
}
