import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
	imports: [RouterOutlet, TopbarComponent, FooterComponent],
	template: `
		<div class="flex min-h-screen flex-col">
			<app-topbar cta />
			<main class="flex-1">
				<router-outlet />
			</main>
			<app-footer />
		</div>
	`,
})
export class MarketingLayoutComponent {}
