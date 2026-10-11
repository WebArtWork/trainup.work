import { Component, computed, effect, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { PageTitleService } from '../../../layouts/app-shell/page-title.service';
import { AccountService } from '../../../feature/account/account.service';
import { CartService } from '../../../feature/store/cart.service';
import { MoneyPipe } from '../../../feature/store/money.pipe';
import { findProduct } from '../../../feature/store/store.data';
import { EQUIPMENT_OPTIONS } from '../../../feature/training-setup/training-setup.const';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [MoneyPipe, RouterLink, StateMessageComponent, TranslateDirective],
	template: `
		<div class="mt-6 flex flex-col gap-4">
			@if (product(); as product) {
				<article class="surface flex flex-col gap-4 p-4">
					<div
						class="surface-inset flex aspect-[4/3] items-center justify-center text-[var(--c-primary-text)]"
					>
						<span class="material-symbols-outlined text-[96px]" aria-hidden="true">
							{{ product.icon }}
						</span>
					</div>

					<div>
						<h1 class="font-display text-2xl text-[var(--c-text-strong)]" [translate]="product.name">
							{{ product.name }}
						</h1>
						<p class="font-display mt-1 text-2xl text-[var(--c-primary-text)]">
							{{ product.price | money }}
						</p>
					</div>

					<p class="text-sm leading-6 text-[var(--c-text)]" [translate]="product.description">
						{{ product.description }}
					</p>

					<div class="surface-inset flex items-start gap-3 p-3">
						<span
							class="material-symbols-outlined text-[22px] text-[var(--c-primary-text)]"
							aria-hidden="true"
						>
							auto_awesome
						</span>
						<p class="text-sm leading-6 text-[var(--c-text)]">
							<span translate>Після покупки у вашому обладнанні з’явиться:</span>
							<strong class="text-[var(--c-text-strong)]" [translate]="equipmentLabel()">
								{{ equipmentLabel() }}
							</strong>
							@if (owned()) {
								<br />
								<span class="chip chip-success mt-1" translate>Уже є у вашому списку</span>
							}
						</p>
					</div>

					@if (product.stock > 0) {
						<button
							class="btn btn-primary btn-lg btn-block"
							type="button"
							[disabled]="inCart() >= product.stock"
							(click)="add()"
						>
							<span class="material-symbols-outlined text-[22px]" aria-hidden="true">
								add_shopping_cart
							</span>
							<span translate>У кошик</span>
						</button>
						@if (inCart()) {
							<a class="btn btn-outline btn-block" routerLink="/app/store/cart">
								<span translate>Перейти до кошика</span>
								<span>· {{ inCart() }}</span>
							</a>
						}
					} @else {
						<p class="chip chip-warning self-start" translate>Немає в наявності</p>
					}
				</article>
			} @else {
				<app-state-message
					icon="search_off"
					title="Товар не знайдено"
					text="Можливо, посилання застаріле."
				>
					<a class="btn btn-primary mt-4" routerLink="/app/store" translate>До магазину</a>
				</app-state-message>
			}
		</div>
	`,
})
export class StoreProductComponent {
	private readonly _account = inject(AccountService);
	private readonly _cart = inject(CartService);
	private readonly _id = inject(ActivatedRoute).snapshot.paramMap.get('id');

	protected readonly product = computed(() => findProduct(this._id) ?? null);
	protected readonly inCart = computed(() => this._cart.cart()[this._id ?? ''] ?? 0);
	protected readonly equipmentLabel = computed(() => {
		const type = this.product()?.equipment.type;

		return EQUIPMENT_OPTIONS.find((option) => option.value === type)?.label ?? '';
	});
	protected readonly owned = computed(() => {
		const type = this.product()?.equipment.type;

		return !!this._account.setup()?.equipment.some((item) => item.type === type);
	});

	constructor() {
		const pageTitle = inject(PageTitleService);

		effect(() => pageTitle.set(this.product()?.name ?? null));
		inject(DestroyRef).onDestroy(() => pageTitle.set(null));
	}

	protected add() {
		this._cart.add(this._id!);
	}
}
