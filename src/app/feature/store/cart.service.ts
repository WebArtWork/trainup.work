import { computed, inject, PLATFORM_ID, Service, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StoreService } from '@wawjs/ngx-core';
import { findProduct, STORE_PRODUCTS } from './store.data';
import { Cart, CartLine, StoreProduct } from './store.interface';

const CART_STORE_KEY = 'trainup-cart';

@Service()
export class CartService {
	private readonly _storeService = inject(StoreService);
	private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

	readonly cart = signal<Cart>({});
	/** The cart lives in browser storage, so it stays unloaded during SSR/prerender. */
	readonly loaded = signal(false);
	readonly count = computed(() => cartCount(this.cart()));
	readonly lines = computed(() => cartLines(this.cart(), STORE_PRODUCTS));
	readonly total = computed(() => this.lines().reduce((sum, line) => sum + line.total, 0));

	constructor() {
		if (this._isBrowser) {
			void this._restore();
		}
	}

	add(id: string, quantity = 1) {
		const product = findProduct(id);
		const next = (this.cart()[id] ?? 0) + quantity;

		if (!product || !isValidQuantity(quantity) || !isValidQuantity(next) || next > product.stock) {
			throw new Error('Некоректний товар або кількість');
		}

		this._replace({ ...this.cart(), [id]: next });
	}

	setQuantity(id: string, quantity: number) {
		const product = findProduct(id);

		if (product && isValidQuantity(quantity) && quantity <= product.stock) {
			this._replace({ ...this.cart(), [id]: quantity });
		}
	}

	remove(id: string) {
		const { [id]: _removed, ...rest } = this.cart();

		this._replace(rest);
	}

	clear() {
		this.cart.set({});
		void this._storeService.remove(CART_STORE_KEY);
	}

	private _replace(cart: Cart) {
		this.cart.set(cart);
		void this._storeService.setJson(CART_STORE_KEY, cart);
	}

	private async _restore() {
		const saved = await this._storeService.getJson<Cart>(CART_STORE_KEY, { clearOnError: true });
		const cart: Cart = {};

		for (const product of STORE_PRODUCTS) {
			const quantity = saved?.[product.id];

			if (typeof quantity === 'number' && isValidQuantity(quantity) && quantity <= product.stock) {
				cart[product.id] = quantity;
			}
		}

		this.cart.set(cart);
		this.loaded.set(true);
	}
}

export function cartCount(cart: Cart): number {
	return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}

export function cartLines(cart: Cart, products: StoreProduct[]): CartLine[] {
	return products
		.filter((product) => cart[product.id])
		.map((product) => ({
			product,
			quantity: cart[product.id]!,
			total: product.price * cart[product.id]!,
		}));
}

export function isValidQuantity(value: number): boolean {
	return Number.isSafeInteger(value) && value >= 1;
}
