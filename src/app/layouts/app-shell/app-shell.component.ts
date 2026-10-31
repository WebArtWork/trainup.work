import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AccountService } from '../../feature/account/account.service';
import { CartService } from '../../feature/store/cart.service';
import { TopbarLink } from '../topbar/topbar.component';
import { ExploreFilterService } from '../../feature/exercise/explore-filter.service';
import { PageTitleService } from './page-title.service';
import { TopbarComponent } from '../topbar/topbar.component';

/** Signed-in app frame: shared topbar, no marketing footer. */
@Component({
	imports: [RouterOutlet, TopbarComponent],
	template: `
		<div class="flex min-h-screen flex-col">
			<app-topbar narrow [title]="title()" [titleHeading]="heading()" [controls]="false" [profile]="profile()" homeLink="/dashboard" [links]="links()" [filters]="showFilters()" [filterCount]="filterCount()" (filtersClick)="openFilters()" />
			<main class="page-wrap page-wrap-narrow flex-1 py-6 sm:py-8">
				<router-outlet />
			</main>
		</div>
	`,
})
export class AppShellComponent {
	private readonly _router = inject(Router);

	protected readonly profile = inject(AccountService).profile;
	private readonly _filters = inject(ExploreFilterService);
	private readonly _cart = inject(CartService);
	protected readonly filterCount = this._filters.activeCount;

	private readonly _pageTitle = inject(PageTitleService);

	private readonly _route = toSignal(
		this._router.events.pipe(
			filter((event) => event instanceof NavigationEnd),
			startWith(null),
			map(() => this._leafData()),
		),
		{ initialValue: { title: null as string | null, barTitle: false, filters: false, topbarLinks: null as string | null } },
	);

	/** A page-set title wins over the route's `meta.title`. */
	protected readonly title = computed(() => this._pageTitle.override() ?? this._route().title);
	/** Quick-action icons in the top bar; only the store page has them. */
	protected readonly links = computed<TopbarLink[]>(() =>
		this._route().topbarLinks === 'store'
			? [
					{ icon: 'receipt_long', label: 'Мої замовлення', path: '/store/orders' },
					{ icon: 'shopping_cart', label: 'Кошик', path: '/store/cart', badge: this._cart.count() },
				]
			: [],
	);
	protected readonly showFilters = computed(() => this._route().filters);

	protected openFilters() {
		void this._filters.open();
	}

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
			filters: !!route.data['filters'],
			topbarLinks: (route.data['topbarLinks'] as string | undefined) ?? null,
		};
	}
}
