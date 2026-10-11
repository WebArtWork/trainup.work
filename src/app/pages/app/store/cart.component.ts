import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { CartService } from '../../../feature/store/cart.service';
import { MoneyPipe } from '../../../feature/store/money.pipe';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [MoneyPipe, RouterLink, StateMessageComponent, TranslateDirective],
	template: `
		<div class="mt-6 flex flex-col gap-4">
			@if (!cart.loaded()) {
				<app-state-message tone="loading" title="Завантажуємо кошик" />
			} @else if (!cart.lines().length) {
				<app-state-message
					icon="shopping_cart"
					title="Кошик порожній"
					text="Додайте обладнання з магазину, щоб оформити замовлення."
				>
					<a class="btn btn-primary mt-4" routerLink="/app/store" translate>До магазину</a>
				</app-state-message>
			} @else {
				<ul class="flex flex-col gap-3">
					@for (line of cart.lines(); track line.product.id) {
						<li class="surface flex gap-3 p-3">
							<span
								class="surface-inset flex h-20 w-20 shrink-0 items-center justify-center text-[var(--c-primary-text)]"
							>
								<span class="material-symbols-outlined text-[40px]" aria-hidden="true">
									{{ line.product.icon }}
								</span>
							</span>
							<div class="flex min-w-0 flex-1 flex-col gap-2">
								<a
									class="theme-focus text-sm font-semibold leading-5 text-[var(--c-text-strong)]"
									[routerLink]="['/app/store', line.product.id]"
									[translate]="line.product.name"
								>
									{{ line.product.name }}
								</a>
								<div class="mt-auto flex items-center justify-between gap-2">
									<div class="flex items-center gap-1">
										<button
											class="icon-btn"
											type="button"
											[translate]="{ ariaLabel: 'Зменшити кількість' }"
											[disabled]="line.quantity <= 1"
											(click)="cart.setQuantity(line.product.id, line.quantity - 1)"
										>
											<span class="material-symbols-outlined text-[20px]" aria-hidden="true">
												remove
											</span>
										</button>
										<span class="min-w-8 text-center font-semibold text-[var(--c-text-strong)]">
											{{ line.quantity }}
										</span>
										<button
											class="icon-btn"
											type="button"
											[translate]="{ ariaLabel: 'Збільшити кількість' }"
											[disabled]="line.quantity >= line.product.stock"
											(click)="cart.setQuantity(line.product.id, line.quantity + 1)"
										>
											<span class="material-symbols-outlined text-[20px]" aria-hidden="true">
												add
											</span>
										</button>
									</div>
									<span class="font-display text-lg text-[var(--c-text-strong)]">
										{{ line.total | money }}
									</span>
								</div>
							</div>
							<button
								class="icon-btn self-start"
								type="button"
								[translate]="{ ariaLabel: 'Видалити з кошика' }"
								(click)="cart.remove(line.product.id)"
							>
								<span class="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
							</button>
						</li>
					}
				</ul>

				<section class="surface flex flex-col gap-3 p-4" aria-labelledby="cart-total-title">
					<h2 id="cart-total-title" class="sr-only" translate>Підсумок</h2>
					<div class="flex items-center justify-between">
						<span class="text-base text-[var(--c-text)]" translate>Разом</span>
						<span class="font-display text-2xl text-[var(--c-text-strong)]">
							{{ cart.total() | money }}
						</span>
					</div>
					<p class="text-xs leading-5 text-[var(--c-text-muted)]" translate>
						Вартість доставки Новою поштою оплачується за тарифами перевізника.
					</p>
					<a class="btn btn-primary btn-lg btn-block" routerLink="/app/store/checkout" translate>
						Оформити замовлення
					</a>
				</section>
			}
		</div>
	`,
})
export class CartComponent {
	protected readonly cart = inject(CartService);
}
