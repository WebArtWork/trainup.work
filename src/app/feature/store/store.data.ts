import productsData from '../../../data/store/products.json';
import { StoreProduct } from './store.interface';

export const STORE_PRODUCTS = productsData as StoreProduct[];

export function findProduct(id: string | null | undefined): StoreProduct | undefined {
	return STORE_PRODUCTS.find((product) => product.id === id);
}

export function formatMoney(value: number): string {
	return `${new Intl.NumberFormat('uk-UA').format(value)} ₴`;
}
