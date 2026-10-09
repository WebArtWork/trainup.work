import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';

/** Signed-in app frame under `/app`: shared topbar, no marketing footer. */
@Component({
	imports: [RouterOutlet, TopbarComponent],
	template: `
		<div class="flex min-h-screen flex-col">
			<app-topbar />
			<main class="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
				<router-outlet />
			</main>
		</div>
	`,
})
export class AppShellComponent {}
