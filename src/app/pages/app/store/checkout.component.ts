import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { AccountService } from '../../../feature/account/account.service';
import { CartService } from '../../../feature/store/cart.service';
import { addPurchasedEquipment } from '../../../feature/store/equipment.util';
import { MoneyPipe } from '../../../feature/store/money.pipe';
import {
	NovaPoshtaPickerComponent,
	NovaPoshtaSelection,
} from '../../../feature/store/nova-poshta/nova-poshta-picker.component';
import {
	ORDER_PAYMENT_LABEL,
	OrderInput,
	OrderPayment,
} from '../../../feature/store/order.interface';
import { OrderService } from '../../../feature/store/order.service';
import { EMPTY_TRAINING_SETUP_INPUT } from '../../../feature/training-setup/training-setup.const';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

const CHECKOUT_STORAGE_KEY = 'trainup.checkout';

interface SavedCheckout {
	name: string;
	phone: string;
	payment: OrderPayment;
	city: NovaPoshtaSelection;
	warehouse: NovaPoshtaSelection;
}

@Component({
	imports: [
		FormsModule,
		MoneyPipe,
		NovaPoshtaPickerComponent,
		RouterLink,
		StateMessageComponent,
		TranslateDirective,
	],
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
					<a class="btn btn-primary mt-4" routerLink="/store" translate>До магазину</a>
				</app-state-message>
			} @else {
				<form class="flex flex-col gap-4" (submit)="submit($event)">
					<section class="surface flex flex-col gap-4 p-4">
						<h2 class="font-display text-xl text-[var(--c-text-strong)]" translate>
							Дані одержувача
						</h2>
						<label class="flex flex-col gap-1.5">
							<span class="text-sm font-semibold text-[var(--c-text-strong)]" translate>
								Ім’я та прізвище
							</span>
							<input
								class="field"
								name="name"
								required
								autocomplete="name"
								[(ngModel)]="name"
							/>
						</label>
						<label class="flex flex-col gap-1.5">
							<span class="text-sm font-semibold text-[var(--c-text-strong)]" translate>
								Телефон
							</span>
							<input
								class="field"
								name="phone"
								type="tel"
								required
								autocomplete="tel"
								placeholder="+38 0__ ___ __ __"
								[(ngModel)]="phone"
							/>
						</label>
					</section>

					<section class="surface flex flex-col gap-4 p-4">
						<h2 class="font-display text-xl text-[var(--c-text-strong)]" translate>
							Доставка Новою поштою
						</h2>
						<app-nova-poshta-picker [(city)]="city" [(warehouse)]="warehouse" />
						@if (placeError()) {
							<p class="text-sm text-[var(--c-error)]" role="alert" translate>
								Оберіть місто та відділення зі списку підказок.
							</p>
						}
					</section>

					<section class="surface flex flex-col gap-3 p-4">
						<h2 class="font-display text-xl text-[var(--c-text-strong)]" translate>Оплата</h2>
						@for (option of paymentOptions; track option.value) {
							<label
								class="surface-inset flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2"
							>
								<input
									class="h-5 w-5 accent-[var(--c-primary)]"
									type="radio"
									name="payment"
									[value]="option.value"
									[(ngModel)]="payment"
								/>
								<span class="text-sm font-semibold text-[var(--c-text-strong)]" [translate]="option.label">
									{{ option.label }}
								</span>
							</label>
						}
					</section>

					<section class="surface flex flex-col gap-4 p-4">
						<label class="flex flex-col gap-1.5">
							<span class="text-sm font-semibold text-[var(--c-text-strong)]">
								<span translate>Коментар до замовлення</span>
								<span class="ml-1 font-normal text-[var(--c-text-muted)]" translate>
									(необов’язково)
								</span>
							</span>
							<textarea
								class="field min-h-24 py-3"
								name="comment"
								maxlength="500"
								[(ngModel)]="comment"
							></textarea>
						</label>
					</section>

					<section class="surface flex flex-col gap-3 p-4" aria-labelledby="order-summary-title">
						<h2 id="order-summary-title" class="font-display text-xl text-[var(--c-text-strong)]" translate>
							Ваше замовлення
						</h2>
						<ul class="flex flex-col gap-2 text-sm">
							@for (line of cart.lines(); track line.product.id) {
								<li class="flex justify-between gap-3 text-[var(--c-text)]">
									<span>
										<span [translate]="line.product.name">{{ line.product.name }}</span>
										× {{ line.quantity }}
									</span>
									<span class="shrink-0 font-semibold text-[var(--c-text-strong)]">
										{{ line.total | money }}
									</span>
								</li>
							}
						</ul>
						<div class="flex items-center justify-between border-t border-[var(--c-border)] pt-3">
							<span translate>Разом</span>
							<span class="font-display text-2xl text-[var(--c-text-strong)]">
								{{ cart.total() | money }}
							</span>
						</div>
						@if (error()) {
							<p class="text-sm text-[var(--c-error)]" role="alert" [translate]="error()">
								{{ error() }}
							</p>
						}
						<button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="submitting()">
							<span [translate]="submitting() ? 'Оформлюємо…' : 'Підтвердити замовлення'">
								{{ submitting() ? 'Оформлюємо…' : 'Підтвердити замовлення' }}
							</span>
						</button>
					</section>
				</form>
			}
		</div>
	`,
})
export class CheckoutComponent {
	private readonly _account = inject(AccountService);
	private readonly _orders = inject(OrderService);
	private readonly _router = inject(Router);

	protected readonly cart = inject(CartService);
	protected readonly paymentOptions = (Object.keys(ORDER_PAYMENT_LABEL) as OrderPayment[]).map(
		(value) => ({ value, label: ORDER_PAYMENT_LABEL[value] }),
	);

	protected name = this._account.profile()?.displayName ?? '';
	protected phone = '';
	protected comment = '';
	protected payment: OrderPayment = 'cod';

	protected readonly city = signal<NovaPoshtaSelection | null>(null);
	protected readonly warehouse = signal<NovaPoshtaSelection | null>(null);
	protected readonly placeError = signal(false);
	protected readonly submitting = signal(false);
	protected readonly error = signal('');
	protected readonly canSubmit = computed(() => !!this.city() && !!this.warehouse());

	constructor() {
		this._restore();
	}

	protected async submit(event: SubmitEvent) {
		event.preventDefault();

		const form = event.target as HTMLFormElement;

		this.placeError.set(!this.canSubmit());

		if (!this.canSubmit() || !form.checkValidity()) {
			form.reportValidity();

			return;
		}

		const lines = this.cart.lines();
		const input: OrderInput = {
			name: this.name.trim(),
			phone: this.phone.trim(),
			city: this.city()!.name,
			cityRef: this.city()!.ref,
			address: this.warehouse()!.name,
			warehouseRef: this.warehouse()!.ref,
			comment: this.comment.trim(),
			payment: this.payment,
			items: lines.map(({ product, quantity }) => ({
				productId: product.id,
				name: product.name,
				quantity,
				price: product.price,
				equipment: product.equipment,
			})),
			total: this.cart.total(),
		};

		this.submitting.set(true);
		this.error.set('');

		try {
			const order = await this._orders.create(input);

			this._save();
			this.cart.clear();
			await this._addToEquipment(lines.map(({ product }) => product.equipment));
			await this._router.navigate(['/store/orders', order.id]);
		} catch {
			this.error.set('Не вдалося оформити замовлення. Спробуйте ще раз.');
		} finally {
			this.submitting.set(false);
		}
	}

	private _restore() {
		if (typeof localStorage === 'undefined') {
			return;
		}

		try {
			const raw = localStorage.getItem(CHECKOUT_STORAGE_KEY);
			const saved = raw ? (JSON.parse(raw) as Partial<SavedCheckout>) : null;

			if (!saved) {
				return;
			}

			this.name = saved.name || this.name;
			this.phone = saved.phone ?? '';

			if (saved.payment && saved.payment in ORDER_PAYMENT_LABEL) {
				this.payment = saved.payment;
			}

			if (saved.city?.ref && saved.warehouse?.ref) {
				this.city.set(saved.city);
				this.warehouse.set(saved.warehouse);
			}
		} catch {
			// Corrupted or blocked storage just means an empty form.
		}
	}

	private _save() {
		if (typeof localStorage === 'undefined') {
			return;
		}

		try {
			const saved: SavedCheckout = {
				name: this.name.trim(),
				phone: this.phone.trim(),
				payment: this.payment,
				city: this.city()!,
				warehouse: this.warehouse()!,
			};

			localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(saved));
		} catch {
			// Storage can be full or blocked; the order itself must not fail because of it.
		}
	}

	/** The order is already placed, so a failure here must not look like a failed checkout. */
	private async _addToEquipment(bought: OrderInput['items'][number]['equipment'][]) {
		try {
			const setup = this._account.setup() ?? EMPTY_TRAINING_SETUP_INPUT;

			await this._account.saveSetup(addPurchasedEquipment(setup, bought));
		} catch (error: unknown) {
			console.error(error);
		}
	}
}
