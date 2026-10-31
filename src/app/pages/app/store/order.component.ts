import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { MoneyPipe } from '../../../feature/store/money.pipe';
import {
	Order,
	ORDER_PAYMENT_LABEL,
	ORDER_STATUS_LABEL,
} from '../../../feature/store/order.interface';
import { OrderService } from '../../../feature/store/order.service';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [MoneyPipe, RouterLink, StateMessageComponent, TranslateDirective],
	template: `
		<div class="mt-6 flex flex-col gap-4">
			@let current = order();

			@if (current === undefined) {
				<app-state-message tone="loading" title="Завантажуємо замовлення" />
			} @else if (current === null) {
				<app-state-message
					icon="search_off"
					title="Замовлення не знайдено"
					text="Можливо, посилання застаріле."
				>
					<a class="btn btn-primary mt-4" routerLink="/store/orders" translate>
						До замовлень
					</a>
				</app-state-message>
			} @else {
				<section class="accent-block flex flex-col gap-1 p-5">
					<p class="text-sm font-semibold" translate>Дякуємо за замовлення!</p>
					<h2 class="font-display text-2xl">№ {{ current.id }}</h2>
					<p class="text-sm">{{ orderDate() }}</p>
					<p class="mt-2">
						<span class="chip chip-sun" [translate]="statusLabel[current.status]">
							{{ statusLabel[current.status] }}
						</span>
					</p>
				</section>

				<section class="surface flex flex-col gap-3 p-4">
					<h2 class="font-display text-xl text-[var(--c-text-strong)]" translate>Товари</h2>
					<ul class="flex flex-col gap-2 text-sm">
						@for (item of current.items; track item.productId) {
							<li class="flex justify-between gap-3 text-[var(--c-text)]">
								<span>
									<span [translate]="item.name">{{ item.name }}</span> × {{ item.quantity }}
								</span>
								<span class="shrink-0 font-semibold text-[var(--c-text-strong)]">
									{{ item.price * item.quantity | money }}
								</span>
							</li>
						}
					</ul>
					<div class="flex items-center justify-between border-t border-[var(--c-border)] pt-3">
						<span translate>Разом</span>
						<span class="font-display text-2xl text-[var(--c-text-strong)]">
							{{ current.total | money }}
						</span>
					</div>
				</section>

				<section class="surface flex flex-col gap-3 p-4">
					<h2 class="font-display text-xl text-[var(--c-text-strong)]" translate>Доставка й оплата</h2>
					<dl class="flex flex-col gap-2 text-sm">
						<div>
							<dt class="text-[var(--c-text-muted)]" translate>Одержувач</dt>
							<dd class="text-[var(--c-text-strong)]">{{ current.name }}, {{ current.phone }}</dd>
						</div>
						<div>
							<dt class="text-[var(--c-text-muted)]" translate>Нова пошта</dt>
							<dd class="text-[var(--c-text-strong)]">{{ current.city }}, {{ current.address }}</dd>
						</div>
						<div>
							<dt class="text-[var(--c-text-muted)]" translate>Оплата</dt>
							<dd class="text-[var(--c-text-strong)]" [translate]="paymentLabel()">
								{{ paymentLabel() }}
							</dd>
						</div>
						@if (current.comment) {
							<div>
								<dt class="text-[var(--c-text-muted)]" translate>Коментар</dt>
								<dd class="text-[var(--c-text-strong)]">{{ current.comment }}</dd>
							</div>
						}
					</dl>
				</section>

				<p class="surface-inset p-4 text-sm leading-6 text-[var(--c-text)]" translate>
					Придбане обладнання вже додано до вашого списку. Нові вправи з’являться у «Вправах».
				</p>
				<a class="btn btn-primary btn-lg btn-block" routerLink="/explore"
					[queryParams]="{ equipment: equipmentTypes() }"
					translate
				>
					Переглянути вправи
				</a>
			}
		</div>
	`,
})
export class OrderComponent {
	private readonly _orders = inject(OrderService);
	private readonly _id = inject(ActivatedRoute).snapshot.paramMap.get('id');

	protected readonly statusLabel = ORDER_STATUS_LABEL;
	/** undefined = loading, null = not found. */
	protected readonly order = signal<Order | null | undefined>(undefined);
	protected readonly orderDate = computed(() => {
		const order = this.order();

		return order
			? new Date(order.date).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })
			: '';
	});
	/** Equipment types in this order, used to show only the exercises that need them. */
	protected readonly equipmentTypes = computed(() =>
		[
			...new Set(
				(this.order()?.items ?? []).flatMap((item) => (item.equipment ? [item.equipment.type] : [])),
			),
		].join(','),
	);
	protected readonly paymentLabel = computed(() => {
		const order = this.order();

		return order ? ORDER_PAYMENT_LABEL[order.payment] : '';
	});

	constructor() {
		this._orders.getById(this._id ?? '').then(
			(order) => this.order.set(order),
			() => this.order.set(null),
		);
	}
}
