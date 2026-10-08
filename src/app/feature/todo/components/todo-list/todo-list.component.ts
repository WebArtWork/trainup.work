import { booleanAttribute, Component, computed, inject, input, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { injectLocale } from '../../../plan/locale';
import { localToday } from '../../../plan/plan.util';
import { Todo, TODO_TITLE_MAX_LENGTH } from '../../todo.interface';
import { TodoService } from '../../todo.service';

@Component({
	selector: 'app-todo-list',
	imports: [TranslateDirective],
	templateUrl: './todo-list.component.html',
})
export class TodoListComponent {
	private readonly _todoService = inject(TodoService);
	private readonly _locale = injectLocale();

	readonly todos = input.required<Todo[]>();
	/** Compact: check off only (Today). Otherwise tasks can be edited and deleted. */
	readonly compact = input(false, { transform: booleanAttribute });
	readonly showAdd = input(true, { transform: booleanAttribute });

	protected readonly maxLength = TODO_TITLE_MAX_LENGTH;
	protected readonly today = localToday();
	protected readonly draftTitle = signal('');
	protected readonly draftDate = signal('');
	protected readonly editingId = signal<string | null>(null);
	protected readonly editTitle = signal('');
	protected readonly editDate = signal('');
	protected readonly busy = signal(false);
	protected readonly error = signal(false);
	protected readonly canAdd = computed(() => this.draftTitle().trim().length > 0 && !this.busy());

	protected dueLabel(date: string): string {
		const [year, month, day] = date.split('-').map(Number);

		return new Intl.DateTimeFormat(this._locale(), {
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC',
		}).format(new Date(Date.UTC(year!, month! - 1, day!)));
	}

	protected async add() {
		if (!this.canAdd()) {
			return;
		}

		await this._run(() => this._todoService.add(this.draftTitle(), this.draftDate() || null));
		this.draftTitle.set('');
		this.draftDate.set('');
	}

	protected toggle(todo: Todo) {
		void this._run(() => this._todoService.update(todo, { done: !todo.done }));
	}

	protected startEdit(todo: Todo) {
		this.editingId.set(todo.id);
		this.editTitle.set(todo.title);
		this.editDate.set(todo.dueDate ?? '');
	}

	protected async saveEdit(todo: Todo) {
		if (!this.editTitle().trim()) {
			return;
		}

		await this._run(() =>
			this._todoService.update(todo, {
				title: this.editTitle(),
				dueDate: this.editDate() || null,
			}),
		);
		this.editingId.set(null);
	}

	protected remove(todo: Todo) {
		void this._run(() => this._todoService.remove(todo));
	}

	private async _run(action: () => Promise<void>) {
		this.busy.set(true);
		this.error.set(false);

		try {
			await action();
		} catch (error) {
			console.error(error);
			this.error.set(true);
		} finally {
			this.busy.set(false);
		}
	}
}
