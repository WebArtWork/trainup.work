import { Component, inject, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { CATEGORY_LABELS } from '../../../feature/plan/plan.const';
import {
	CategoryFilter,
	DEFAULT_EXPLORE_FILTERS,
	ExploreFilters,
	ExploreFilterService,
	LocationFilter,
} from '../../../feature/exercise/explore-filter.service';
import { TRAINER_OPTIONS, TrainerChoice } from '../../../feature/trainer/trainer.interface';
import { LOCATION_OPTIONS } from '../../../feature/training-setup/training-setup.const';
import { OptionPillComponent } from '../../../ui/option-pill/option-pill.component';

/** Filter form shown inside the ngx-ui modal. Edits a draft; Apply and Clear both close it. */
@Component({
	imports: [OptionPillComponent, TranslateDirective],
	template: `
		<div class="flex flex-col gap-5 p-1">
			<h2 id="explore-filters-title" class="font-display text-xl text-[var(--c-text-strong)]" translate>
				Фільтри
			</h2>

			<label class="relative block">
				<span class="sr-only" translate>Пошук вправи</span>
				<span
					class="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[var(--c-text-muted)]"
					aria-hidden="true"
				>
					search
				</span>
				<input
					class="field min-h-12 w-full pl-12"
					type="search"
					[value]="draft().search"
					[translate]="{ placeholder: 'Пошук за назвою' }"
					(input)="patch({ search: $any($event.target).value })"
				/>
			</label>

			<div class="flex flex-wrap gap-2" role="group" [translate]="{ ariaLabel: 'Тип вправ' }">
				@for (option of categoryOptions; track option.value) {
					<button
						type="button"
						appOptionPill
						[label]="option.label"
						[selected]="draft().category === option.value"
						(click)="patch({ category: option.value })"
					></button>
				}
			</div>

			<div class="flex flex-wrap gap-2" role="group" [translate]="{ ariaLabel: 'Тренер' }">
				@for (option of trainerOptions; track option.value) {
					<button
						type="button"
						appOptionPill
						[label]="option.label"
						[selected]="draft().trainer === option.value"
						(click)="patch({ trainer: option.value })"
					></button>
				}
			</div>

			<div class="flex flex-wrap gap-2" role="group" [translate]="{ ariaLabel: 'Де тренуватися' }">
				@for (option of locationOptions; track option.value) {
					<button
						type="button"
						appOptionPill
						[label]="option.label"
						[selected]="draft().location === option.value"
						(click)="patch({ location: option.value })"
					></button>
				}
			</div>

			<label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-[var(--c-text-strong)]">
				<input
					class="h-5 w-5 accent-[var(--c-primary)]"
					type="checkbox"
					[checked]="draft().suitableOnly"
					(change)="patch({ suitableOnly: $any($event.target).checked })"
				/>
				<span translate>Лише ті, що підходять мені</span>
			</label>

			<div class="flex gap-3">
				<button class="btn btn-outline flex-1" type="button" (click)="clear()" translate>
					Очистити
				</button>
				<button class="btn btn-primary flex-1" type="button" (click)="apply()" translate>
					Застосувати
				</button>
			</div>
		</div>
	`,
})
export class ExploreFiltersModalComponent {
	private readonly _filters = inject(ExploreFilterService);

	/** Set by ngx-ui's ModalService when this component is opened as a modal. */
	close: () => void = () => undefined;

	protected readonly draft = signal<ExploreFilters>(this._filters.current());
	protected readonly categoryOptions: { value: CategoryFilter; label: string }[] = [
		{ value: 'all', label: 'Усі' },
		{ value: 'strength', label: CATEGORY_LABELS.strength },
		{ value: 'conditioning', label: CATEGORY_LABELS.conditioning },
		{ value: 'mobility', label: CATEGORY_LABELS.mobility },
	];
	protected readonly trainerOptions: { value: TrainerChoice; label: string }[] = TRAINER_OPTIONS;
	protected readonly locationOptions: { value: LocationFilter; label: string }[] = [
		{ value: 'all', label: 'Усі' },
		...LOCATION_OPTIONS.filter((option) => option.value !== 'other'),
	];

	protected patch(change: Partial<ExploreFilters>) {
		this.draft.update((draft) => ({ ...draft, ...change }));
	}

	protected apply() {
		this._filters.apply(this.draft());
		this.close();
	}

	protected clear() {
		this._filters.apply(DEFAULT_EXPLORE_FILTERS);
		this.close();
	}
}
