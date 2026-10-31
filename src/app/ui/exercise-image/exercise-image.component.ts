import { Component, computed, inject, input, signal } from '@angular/core';
import type { Exercise } from '@trainup/planner';
import { exerciseTrainers, shownTrainer, Trainer, trainerImage } from '../../feature/trainer/trainer.interface';
import { TrainerService } from '../../feature/trainer/trainer.service';

/** Exercise picture for the chosen trainer, with a placeholder when the file is missing. */
@Component({
	selector: 'app-exercise-image',
	host: { class: 'flex h-full w-full items-center justify-center' },
	template: `
		@if (src(); as source) {
			<img
				class="h-full w-full object-contain"
				[src]="source"
				[alt]="alt()"
				width="960"
				height="600"
				[attr.loading]="lazy() ? 'lazy' : null"
				decoding="async"
				(error)="failed.set(source)"
			/>
		} @else {
			<span
				class="material-symbols-outlined text-[var(--c-text-muted)]"
				[class]="iconClass()"
				aria-hidden="true"
			>
				fitness_center
			</span>
		}
	`,
})
export class ExerciseImageComponent {
	private readonly _trainer = inject(TrainerService);

	readonly exercise = input.required<Exercise>();
	readonly alt = input('');
	readonly lazy = input(false);
	/** Show this trainer's picture when the exercise has it, instead of the chosen one. */
	readonly trainer = input<Trainer | null>(null);
	readonly iconClass = input('text-[44px]');

	protected readonly failed = signal<string | null>(null);
	protected readonly src = computed(() => {
		const exercise = this.exercise();
		const own = this.trainer();
		const trainers = exerciseTrainers(exercise);
		const who = own && trainers.includes(own) ? own : shownTrainer(exercise, this._trainer.choice());
		const url = trainerImage(exercise, who);

		return url && url !== this.failed() ? url : null;
	});
}
