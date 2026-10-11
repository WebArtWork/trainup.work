import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { MoneyPipe } from '../../../feature/store/money.pipe';
import { Order, ORDER_STATUS_LABEL } from '../../../feature/store/order.interface';
import { OrderService } from '../../../feature/store/order.service';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [MoneyPipe, RouterLink, StateMessageComponent, TranslateDirective],
	template: `
		<div class="mt-6 flex flex-col gap-4">
			@let stateValue = state();
			@switch (stateValue) {
				@case ('loading') {
					<app-state-message tone="loading" title="Завантажуємо замовлення" />
				}
				@case ('error') {
					<app-state-message
						tone="error"
						icon="cloud_off"
						title="Не вдалося завантажити замовлення"
						text="Перевірте з’єднання з інтернетом і спробуйте ще раз."
					/>
				}
				@case ('ready') {
					@if (!orders().length) {
						<app-state-message
							icon="receipt_long"
							title="Замовлень ще немає"
							text="Тут з’являться ваші покупки."
						>
							<a class="btn btn-primary mt-4" routerLink="/app/store" translate>До магазину</a>
						</app-state-message>
					} @else {
						<ul class="flex flex-col gap-3">
							@for (order of orders(); track order.id) {
								<li>
									<a
										class="surface theme-focus flex flex-col gap-2 p-4 hover:bg-[var(--c-bg-tertiary)]"
										[routerLink]="['/app/store/orders', order.id]"
									>
										<span class="flex items-center justify-between gap-2">
											<span class="font-semibold text-[var(--c-text-strong)]">№ {{ order.id }}</span>
											<span class="chip chip-sun" [translate]="statusLabel[order.status]">
												{{ statusLabel[order.status] }}
											</span>
										</span>
										<span class="text-xs text-[var(--c-text-muted)]">{{ formatDate(order.date) }}</span>
										<span class="flex items-center justify-between gap-2 text-sm text-[var(--c-text)]">
											<span>{{ order.items.length }} <span translate>поз.</span></span>
											<span class="font-display text-lg text-[var(--c-text-strong)]">
												{{ order.total | money }}
											</span>
										</span>
									</a>
								</li>
							}
						</ul>
					}
				}
			}
		</div>
	`,
})
export class OrdersComponent {
	private readonly _orders = inject(OrderService);

	protected readonly statusLabel = ORDER_STATUS_LABEL;
	protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
	protected readonly orders = signal<Order[]>([]);

	constructor() {
		this._orders.getAll().then(
			(orders) => {
				this.orders.set(orders);
				this.state.set('ready');
			},
			(error) => {
				console.error('Failed to load orders', error);
				this.state.set('error');
			},
		);
	}

	protected formatDate(date: string): string {
		return new Date(date).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
	}
}
