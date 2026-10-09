import { booleanAttribute, Component, inject, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { CompanyService } from '../../feature/company/company.service';
import { PreferencesControlsComponent } from '../../ui/preferences-controls/preferences-controls.component';

@Component({
	selector: 'app-topbar',
	imports: [NgOptimizedImage, PreferencesControlsComponent, RouterLink, RouterLinkActive, TranslateDirective],
	templateUrl: './topbar.component.html',
	styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
	private readonly _companyService = inject(CompanyService);

	/** Show the signed-in user's profile button (app pages); the value is the avatar URL. */
	readonly profile = input<{ photoUrl?: string | null } | null>(null);

	/** Show the "open app" call to action (marketing pages). */
	readonly cta = input(false, { transform: booleanAttribute });

	/** Show the language and theme controls (marketing pages; the app has them in the profile). */
	readonly controls = input(true, { transform: booleanAttribute });

	/** Page heading shown in the bar (signed-in app pages). */
	readonly title = input<string | null>(null);

	/** Render the title as the page `<h1>`; otherwise the page has its own heading. */
	readonly titleHeading = input(false, { transform: booleanAttribute });

	protected readonly company = this._companyService.company;
}
