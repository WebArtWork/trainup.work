import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { FirebaseError } from 'firebase/app';
import { AccountService } from '../../../feature/account/account.service';
import { APP_PATHS, takeReturnUrl } from '../../../feature/auth/auth.guard';
import { AuthService, SignInProvider } from '../../../feature/auth/auth.service';

interface ProviderButton {
	provider: SignInProvider;
	label: string;
	icon: string;
}

const SILENT_ERROR_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

@Component({
	imports: [TranslateDirective],
	templateUrl: './sign-in.component.html',
})
export class SignInComponent {
	private readonly _authService = inject(AuthService);
	private readonly _accountService = inject(AccountService);
	private readonly _router = inject(Router);

	protected readonly providers: ProviderButton[] = [
		{ provider: 'google', label: 'Увійти через Google', icon: 'google' },
		{ provider: 'apple', label: 'Увійти через Apple', icon: 'apple' },
	];
	protected readonly pending = signal<SignInProvider | null>(null);
	protected readonly error = signal<string | null>(null);

	protected async signIn(provider: SignInProvider) {
		this.pending.set(provider);
		this.error.set(null);

		try {
			const user = await this._authService.signIn(provider);

			await this._accountService.ensureLoaded(user);
			await this._router.navigateByUrl(
				this._accountService.isOnboarded()
					? (takeReturnUrl() ?? APP_PATHS.home)
					: APP_PATHS.onboarding,
			);
		} catch (error) {
			const code = error instanceof FirebaseError ? error.code : '';

			if (!SILENT_ERROR_CODES.has(code)) {
				console.error(error);
				this.error.set(_errorMessage(code));
			}
		} finally {
			this.pending.set(null);
		}
	}
}

function _errorMessage(code: string): string {
	switch (code) {
		case 'auth/popup-blocked':
			return 'Браузер заблокував вікно входу. Дозвольте спливаючі вікна для цього сайту й спробуйте ще раз.';
		case 'auth/account-exists-with-different-credential':
			return 'Цю пошту вже прив’язано до іншого способу входу. Увійдіть так, як робили це раніше.';
		case 'auth/network-request-failed':
			return 'Немає з’єднання з інтернетом. Перевірте мережу й спробуйте ще раз.';
		default:
			return 'Не вдалося увійти. Спробуйте ще раз трохи пізніше.';
	}
}
