import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AccountService } from '../../feature/account/account.service';
import { PageTitleService } from './page-title.service';
import { TopbarComponent } from '../topbar/topbar.component';

/** Signed-in app frame under `/app`: shared topbar, no marketing footer. */
@Component({
	imports: [RouterOutlet, TopbarComponent],
	template: `
		<div class="flex min-h-screen flex-col">
			<app-topbar [title]="title()" [titleHeading]="heading()" [controls]="false" [profile]="profile()" />
			<main class="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
				<router-outlet />
			</main>
		</div>
	`,
})
export class AppShellComponent {
	private readonly _router = inject(Router);

	protected readonly profile = inject(AccountService).profile;

	private readonly _pageTitle = inject(PageTitleService);

	private readonly _route = toSignal(
		this._router.events.pipe(
			filter((event) => event instanceof NavigationEnd),
			startWith(null),
			map(() => this._leafData()),
		),
		{ initialValue: { title: null as string | null, barTitle: false } },
	);

	/** A page-set title wins over the route's `meta.title`. */
	protected readonly title = computed(() => this._pageTitle.override() ?? this._route().title);
	/** The bar holds the `<h1>` unless the page renders its own heading. */
	protected readonly heading = computed(
		() => this._route().barTitle || this._pageTitle.override() !== null,
	);

	private _leafData() {
		let route = this._router.routerState.snapshot.root;
		while (route.firstChild) route = route.firstChild;

		return {
			title: (route.data['meta']?.title as string | undefined) ?? null,
			barTitle: !!route.data['barTitle'],
		};
	}
}
