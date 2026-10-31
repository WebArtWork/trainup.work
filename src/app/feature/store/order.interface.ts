import type { EquipmentItem } from '../training-setup/training-setup.interface';

export type OrderStatus = 'new' | 'processing' | 'done' | 'returned' | 'canceled';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
	new: 'Нове',
	processing: 'В обробці',
	done: 'Виконано',
	returned: 'Повернено',
	canceled: 'Скасовано',
};

export type OrderPayment = 'cod' | 'transfer';

export const ORDER_PAYMENT_LABEL: Record<OrderPayment, string> = {
	cod: 'Оплата при отриманні',
	transfer: 'Переказ на рахунок',
};

export const ORDER_SCHEMA_VERSION = 1;

export interface OrderItem {
	productId: string;
	name: string;
	quantity: number;
	/** Unit price in UAH at the time of purchase. */
	price: number;
	equipment: EquipmentItem | null;
}

/** Order data collected by checkout. */
export interface OrderInput {
	name: string;
	phone: string;
	city: string;
	cityRef: string;
	address: string;
	warehouseRef: string;
	comment: string;
	payment: OrderPayment;
	items: OrderItem[];
	total: number;
}

/** `users/{uid}/orders/{orderId}` document. Clients create orders; they never edit them. */
export interface Order extends OrderInput {
	id: string;
	schemaVersion: number;
	status: OrderStatus;
	delivery: 'Нова пошта';
	/** ISO string, shown in order lists. */
	date: string;
}
