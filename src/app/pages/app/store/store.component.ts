import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountService } from '../../../feature/account/account.service';
import { CartService } from '../../../feature/store/cart.service';
import { MoneyPipe } from '../../../feature/store/money.pipe';
import { STORE_PRODUCTS } from '../../../feature/store/store.data';
import { ProductImageComponent } from '../../../ui/product-image/product-image.component';

@Component({
	imports: [MoneyPipe, ProductImageComponent, RouterLink, TranslateDirective],
	template: `
		<div class="flex flex-col gap-4">
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
								<app-product-image [product]="product" />
								@if (product.equipment && owned().has(product.equipment.type)) {
									<span class="chip chip-success absolute left-2 top-2" translate
										>Є у вас</span
									>
								}
							</span>
							<span class="flex flex-1 flex-col gap-1 px-3 pb-2">
								<span
									class="text-sm font-semibold leading-5 text-[var(--c-text-strong)]"
									[translate]="product.name"
								>
									{{ product.name }}
								</span>
								<span
									class="font-display mt-auto text-lg text-[var(--c-text-strong)]"
								>
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
								<span
									class="material-symbols-outlined text-[18px]"
									aria-hidden="true"
								>
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
