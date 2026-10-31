import { computed, inject, Service, signal } from '@angular/core';
import type { ExerciseCategory, WorkoutLocation } from '@trainup/planner';
import { ModalService } from '@wawjs/ngx-ui';
import { TrainerChoice } from '../trainer/trainer.interface';
import { TrainerService } from '../trainer/trainer.service';

export type CategoryFilter = ExerciseCategory | 'all';
export type LocationFilter = WorkoutLocation | 'all';

export interface ExploreFilters {
	search: string;
	category: CategoryFilter;
	trainer: TrainerChoice;
	location: LocationFilter;
	suitableOnly: boolean;
}

export const DEFAULT_EXPLORE_FILTERS: ExploreFilters = {
	search: '',
	category: 'all',
	trainer: 'all',
	location: 'all',
	suitableOnly: true,
};

/**
 * The exercise filters applied on Explore. The topbar button opens the modal; Apply and Clear both
 * write here and close it, and the Explore list reads the result.
 */
@Service()
export class ExploreFilterService {
	private readonly _modal = inject(ModalService);
	private readonly _trainer = inject(TrainerService);

	readonly search = signal(DEFAULT_EXPLORE_FILTERS.search);
	readonly category = signal(DEFAULT_EXPLORE_FILTERS.category);
	readonly location = signal(DEFAULT_EXPLORE_FILTERS.location);
	readonly suitableOnly = signal(DEFAULT_EXPLORE_FILTERS.suitableOnly);
	readonly trainer = this._trainer.choice;

	/** How many filters differ from the defaults; shown as a badge on the topbar button. */
	readonly activeCount = computed(
		() =>
			[
				this.search().trim() !== DEFAULT_EXPLORE_FILTERS.search,
				this.category() !== DEFAULT_EXPLORE_FILTERS.category,
				this.trainer() !== DEFAULT_EXPLORE_FILTERS.trainer,
				this.location() !== DEFAULT_EXPLORE_FILTERS.location,
				this.suitableOnly() !== DEFAULT_EXPLORE_FILTERS.suitableOnly,
			].filter(Boolean).length,
	);

	current(): ExploreFilters {
		return {
			search: this.search(),
			category: this.category(),
			trainer: this.trainer(),
			location: this.location(),
			suitableOnly: this.suitableOnly(),
		};
	}

	apply(filters: ExploreFilters) {
		this.search.set(filters.search.trim());
		this.category.set(filters.category);
		this.location.set(filters.location);
		this.suitableOnly.set(filters.suitableOnly);
		this._trainer.select(filters.trainer);
	}

	async open() {
		const { ExploreFiltersModalComponent } = await import(
			'../../pages/app/explore/explore-filters-modal.component'
		);

		this._modal.show({
			component: ExploreFiltersModalComponent,
			size: 'small',
			ariaLabelledBy: 'explore-filters-title',
		});
	}
}
