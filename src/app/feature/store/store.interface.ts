import type { EquipmentItem } from '../training-setup/training-setup.interface';

/** Static catalog entry, shipped in `src/data/store/products.json`. */
export interface StoreProduct {
	id: string;
	name: string;
	description: string;
	/** Price in UAH. */
	price: number;
	stock: number;
	/** Material Symbols icon shown while a product has no photo. */
	icon: string;
	image: string | null;
	/** What the user's training setup gains after buying this product. */
	equipment: EquipmentItem;
}

/** Product id → quantity. */
export type Cart = Record<string, number>;

export interface CartLine {
	product: StoreProduct;
	quantity: number;
	total: number;
}
