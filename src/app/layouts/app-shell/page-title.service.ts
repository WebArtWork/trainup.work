import { Service, signal } from '@angular/core';

/** Lets a page put a data-driven title (e.g. an exercise name) in the app topbar. */
@Service()
export class PageTitleService {
	readonly override = signal<string | null>(null);

	set(title: string | null) {
		this.override.set(title);
	}
}
