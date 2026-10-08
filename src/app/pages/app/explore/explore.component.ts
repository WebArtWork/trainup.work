import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ExerciseCategory } from '@trainup/planner';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { ExerciseCatalogService } from '../../../feature/exercise/exercise-catalog.service';
import { injectSuitability } from '../../../feature/exercise/exercise-suitability';
import { CATEGORY_LABELS, MOVEMENT_PATTERN_LABELS } from '../../../feature/plan/plan.const';
import { FITNESS_LEVEL_OPTIONS } from '../../../feature/profile/profile.const';
import { OptionPillComponent } from '../../../ui/option-pill/option-pill.component';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

type CategoryFilter = ExerciseCategory | 'all';

@Component({
	imports: [OptionPillComponent, RouterLink, StateMessageComponent, TranslateDirective],
	templateUrl: './explore.component.html',
})
export class ExploreComponent {
	private readonly _suitability = injectSuitability();

	protected readonly catalog = inject(ExerciseCatalogService);
	protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly search = signal('');
	protected readonly category = signal<CategoryFilter>('all');
	protected readonly suitableOnly = signal(true);
	protected readonly categoryOptions: { value: CategoryFilter; label: string }[] = [
		{ value: 'all', label: 'Усі' },
		{ value: 'strength', label: CATEGORY_LABELS.strength },
		{ value: 'conditioning', label: CATEGORY_LABELS.conditioning },
		{ value: 'mobility', label: CATEGORY_LABELS.mobility },
	];
	protected readonly patternLabels = MOVEMENT_PATTERN_LABELS;

	protected readonly items = computed(() => {
		const search = this.search().trim().toLocaleLowerCase('uk');
		const category = this.category();

		return this.catalog
			.exercises()
			.map((exercise) => ({ exercise, suitable: this._suitability(exercise).length === 0 }))
			.filter(
				({ exercise, suitable }) =>
					(category === 'all' || exercise.category === category) &&
					(!this.suitableOnly() || suitable) &&
					(!search || exercise.name.toLocaleLowerCase('uk').includes(search)),
			);
	});

	constructor() {
		this.catalog.ensureLoaded().then(
			() => this.state.set('ready'),
			() => this.state.set('error'),
		);
	}

	protected levelLabel(level: string): string {
		return FITNESS_LEVEL_OPTIONS.find((option) => option.value === level)?.label ?? level;
	}
}
