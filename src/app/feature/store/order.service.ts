import { inject, Service } from '@angular/core';
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { Order, OrderInput, ORDER_SCHEMA_VERSION } from './order.interface';

const MAX_ID_ATTEMPTS = 5;

/** Orders live at `users/{uid}/orders`: the owner creates and reads them; the shop edits status. */
@Service()
export class OrderService {
	private readonly _firebase = inject(FirebaseService);

	async create(input: OrderInput): Promise<Order> {
		const { db, uid } = await this._context();

		for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
			const id = generateOrderNumber();
			const ref = doc(db, 'users', uid, 'orders', id);

			if ((await getDoc(ref)).exists()) {
				continue;
			}

			const order: Order = {
				...input,
				id,
				schemaVersion: ORDER_SCHEMA_VERSION,
				status: 'new',
				delivery: 'Нова пошта',
				date: new Date().toISOString(),
			};

			await setDoc(ref, order);

			return order;
		}

		throw new Error('Could not generate a unique order number.');
	}

	async getById(id: string): Promise<Order | null> {
		const { db, uid } = await this._context();
		const snapshot = await getDoc(doc(db, 'users', uid, 'orders', id));

		return snapshot.exists() ? (snapshot.data() as Order) : null;
	}

	async getAll(): Promise<Order[]> {
		const { db, uid } = await this._context();
		const snapshot = await getDocs(
			query(collection(db, 'users', uid, 'orders'), orderBy('date', 'desc')),
		);

		return snapshot.docs.map((item) => item.data() as Order);
	}

	private async _context() {
		const db = this._firebase.firestore;
		const auth = this._firebase.auth;

		// On a fresh load the persisted session is restored asynchronously.
		await auth?.authStateReady();

		const uid = auth?.currentUser?.uid;

		if (!db || !uid) {
			throw new Error('Sign in to manage orders.');
		}

		return { db, uid };
	}
}

function generateOrderNumber(): string {
	const part = () => String(Math.floor(100 + Math.random() * 900));

	return `ORD-${part()}-${part()}`;
}
