import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { TodoListComponent } from '../../../feature/todo/components/todo-list/todo-list.component';
import { TodoService } from '../../../feature/todo/todo.service';
import { StateMessageComponent } from '../../../ui/state-message/state-message.component';

@Component({
	imports: [RouterLink, StateMessageComponent, TodoListComponent, TranslateDirective],
	template: `
		<header>
			<a
				class="link inline-flex min-h-11 items-center gap-1 text-sm font-semibold"
				routerLink="/app/today"
			>
				<span class="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_back</span>
				<span translate>Сьогодні</span>
			</a>
			<h1
				class="font-display mt-2 text-3xl text-[var(--c-text-strong)] sm:text-4xl"
				translate
			>
				Справи
			</h1>
			<p class="mt-2 text-sm text-[var(--c-text)]" translate>
				Короткий список на день. Тренування показуються окремо на сторінці «Сьогодні».
			</p>
		</header>

		<div class="mt-6 pb-28">
			@let stateValue = state();
			@switch (stateValue) {
				@case ('loading') {
					<app-state-message tone="loading" title="Завантажуємо справи" />
				}
				@case ('error') {
					<app-state-message
						tone="error"
						icon="cloud_off"
						title="Не вдалося завантажити справи"
						text="Перевірте з’єднання з інтернетом і спробуйте ще раз."
					/>
				}
				@case ('ready') {
					<app-todo-list [todos]="todoService.open()" />

					@if (todoService.done().length) {
						<details class="surface-inset mt-6 px-4">
							<summary
								class="theme-focus flex min-h-12 cursor-pointer items-center text-sm font-semibold text-[var(--c-text-strong)]"
							>
								<span translate>Виконані</span> ({{ todoService.done().length }})
							</summary>
							<div class="pb-3">
								<app-todo-list [todos]="todoService.done()" [showAdd]="false" />
							</div>
						</details>
					}
				}
				@default never;
			}
		</div>
	`,
})
export class TodosComponent {
	protected readonly todoService = inject(TodoService);
	protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');

	constructor() {
		this.todoService.ensureLoaded().then(
			() => this.state.set('ready'),
			(error: unknown) => {
				console.error(error);
				this.state.set('error');
			},
		);
	}
}
