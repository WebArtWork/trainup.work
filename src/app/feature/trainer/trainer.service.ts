import { inject, Service, signal } from '@angular/core';
import { StoreService } from '@wawjs/ngx-core';
import { TRAINER_OPTIONS, TrainerChoice } from './trainer.interface';

const STORAGE_KEY = 'trainup.trainer';

/** The trainer whose pictures the user wants to see; remembered on this device. */
@Service()
export class TrainerService {
	private readonly _store = inject(StoreService);

	readonly choice = signal<TrainerChoice>('all');

	constructor() {
		void this._store.getJson<TrainerChoice>(STORAGE_KEY).then((saved) => {
			if (TRAINER_OPTIONS.some((option) => option.value === saved)) {
				this.choice.set(saved!);
			}
		});
	}

	select(choice: TrainerChoice) {
		this.choice.set(choice);
		void this._store.setJson(STORAGE_KEY, choice);
	}
}
