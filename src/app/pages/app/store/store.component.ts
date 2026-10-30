import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountService } from '../../../feature/account/account.service';
import { CartService } from '../../../feature/store/cart.service';
import { MoneyPipe } from '../../../feature/store/money.pipe';
import { STORE_PRODUCTS } from '../../../feature/store/store.data';

@Component({
	imports: [MoneyPipe, RouterLink, TranslateDirective],
	template: `
		<div class="mt-6 flex flex-col gap-4">
			<p class="text-sm leading-6 text-[var(--c-text)]" translate>
				Придбане обладнання автоматично додається до вашого списку, і TrainUp пропонує нові вправи.
			</p>

			<div class="flex flex-wrap gap-2">
				<a class="btn btn-outline btn-sm" routerLink="/store/orders">
					<span class="material-symbols-outlined text-[20px]" aria-hidden="true">receipt_long</span>
					<span translate>Мої замовлення</span>
				</a>
				<a class="btn btn-primary btn-sm" routerLink="/store/cart">
					<span class="material-symbols-outlined text-[20px]" aria-hidden="true">shopping_cart</span>
					<span translate>Кошик</span>
					@if (cart.count()) {
						<span class="font-bold">· {{ cart.count() }}</span>
					}
				</a>
			</div>

			<ul class="grid grid-cols-2 gap-3">
				@for (product of products; track product.id) {
					<li class="surface flex flex-col overflow-hidden">
						<a
							class="theme-focus flex flex-1 flex-col"
							[routerLink]="['/store', product.id]"
						>
							<span
								class="surface-inset relative m-2 flex aspect-[4/3] items-center justify-center text-[var(--c-primary-text)]"
							>
								<span class="material-symbols-outlined text-[56px]" aria-hidden="true">
									{{ product.icon }}
								</span>
								@if (owned().has(product.equipment.type)) {
									<span class="chip chip-success absolute left-2 top-2" translate>Є у вас</span>
								}
							</span>
							<span class="flex flex-1 flex-col gap-1 px-3 pb-2">
								<span
									class="text-sm font-semibold leading-5 text-[var(--c-text-strong)]"
									[translate]="product.name"
								>
									{{ product.name }}
								</span>
								<span class="font-display mt-auto text-lg text-[var(--c-text-strong)]">
									{{ product.price | money }}
								</span>
							</span>
						</a>
						<div class="px-3 pb-3">
							<button
								class="btn btn-primary btn-sm btn-block"
								type="button"
								[disabled]="inCart(product.id) >= product.stock"
								(click)="add(product.id)"
							>
								<span class="material-symbols-outlined text-[18px]" aria-hidden="true">
									add_shopping_cart
								</span>
								<span translate>У кошик</span>
							</button>
						</div>
					</li>
				}
			</ul>
		</div>
	`,
})
export class StoreComponent {
	private readonly _account = inject(AccountService);

	protected readonly cart = inject(CartService);
	protected readonly products = STORE_PRODUCTS;
	protected readonly owned = computed(
		() => new Set(this._account.setup()?.equipment.map((item) => item.type) ?? []),
	);

	protected inCart(id: string): number {
		return this.cart.cart()[id] ?? 0;
	}

	protected add(id: string) {
		this.cart.add(id);
	}
}
