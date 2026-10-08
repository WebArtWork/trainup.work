import { computed, inject, Service, signal } from '@angular/core';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	Firestore,
	getDocs,
	serverTimestamp,
	updateDoc,
} from 'firebase/firestore';
import { FirebaseService } from '../firebase/firebase.service';
import { localToday } from '../plan/plan.util';
import { Todo, TODO_SCHEMA_VERSION, TODO_TITLE_MAX_LENGTH } from './todo.interface';

@Service()
export class TodoService {
	private readonly _firebase = inject(FirebaseService);

	readonly todos = signal<Todo[]>([]);
	/** Open tasks, overdue first, then by due date; undated tasks last. */
	readonly open = computed(() =>
		this.todos()
			.filter((todo) => !todo.done)
			.sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')),
	);
	/** What Today shows: open tasks due today or earlier, plus undated ones. */
	readonly forToday = computed(() => {
		const today = localToday();

		return this.open().filter((todo) => !todo.dueDate || todo.dueDate <= today);
	});
	readonly done = computed(() => this.todos().filter((todo) => todo.done));

	private _uid: string | null = null;
	private _loading: Promise<void> | null = null;

	ensureLoaded(): Promise<void> {
		const uid = this._firebase.auth?.currentUser?.uid ?? null;

		if (uid !== this._uid || !this._loading) {
			this._uid = uid;
			this._loading = this._load().catch((error: unknown) => {
				this._loading = null;
				throw error;
			});
		}

		return this._loading;
	}

	async add(title: string, dueDate: string | null): Promise<void> {
		const { db, uid } = this._context();
		const clean = title.trim().slice(0, TODO_TITLE_MAX_LENGTH);

		if (!clean) {
			return;
		}

		await addDoc(collection(db, 'users', uid, 'todos'), {
			schemaVersion: TODO_SCHEMA_VERSION,
			title: clean,
			dueDate,
			done: false,
			createdAt: serverTimestamp(),
			updatedAt: serverTimestamp(),
			completedAt: null,
		});
		await this._load();
	}

	async update(todo: Todo, changes: Partial<Pick<Todo, 'title' | 'dueDate' | 'done'>>): Promise<void> {
		const { db, uid } = this._context();
		const done = changes.done ?? todo.done;

		// Optimistic: the checkbox should react immediately; reload reconciles.
		this.todos.update((todos) =>
			todos.map((item) => (item.id === todo.id ? { ...item, ...changes } : item)),
		);
		await updateDoc(doc(db, 'users', uid, 'todos', todo.id), {
			...changes,
			...(changes.title !== undefined
				? { title: changes.title.trim().slice(0, TODO_TITLE_MAX_LENGTH) }
				: {}),
			completedAt: done ? (todo.completedAt ?? serverTimestamp()) : null,
			updatedAt: serverTimestamp(),
		});
		await this._load();
	}

	async remove(todo: Todo): Promise<void> {
		const { db, uid } = this._context();

		this.todos.update((todos) => todos.filter((item) => item.id !== todo.id));
		await deleteDoc(doc(db, 'users', uid, 'todos', todo.id));
	}

	reset() {
		this._uid = null;
		this._loading = null;
		this.todos.set([]);
	}

	private async _load() {
		const { db, uid } = this._context();
		const snapshot = await getDocs(collection(db, 'users', uid, 'todos'));

		this.todos.set(snapshot.docs.map((item) => ({ ...(item.data() as Todo), id: item.id })));
	}

	private _context(): { db: Firestore; uid: string } {
		const db = this._firebase.firestore;
		const uid = this._firebase.auth?.currentUser?.uid;

		if (!db || !uid) {
			throw new Error('No signed-in user.');
		}

		return { db, uid };
	}
}
