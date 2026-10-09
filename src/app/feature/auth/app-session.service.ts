import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';
import { AccountService } from '../account/account.service';
import { ExerciseFlagService } from '../exercise-flag/exercise-flag.service';
import { PlanService } from '../plan/plan.service';
import { ReminderService } from '../reminder/reminder.service';
import { TodoService } from '../todo/todo.service';
import { WorkoutSessionService } from '../workout-session/workout-session.service';
import { APP_PATHS } from './auth.guard';
import { AuthService } from './auth.service';

/** Ends the signed-in session: signs out and drops every per-user cache. */
@Service()
export class AppSessionService {
	private readonly _authService = inject(AuthService);
	private readonly _accountService = inject(AccountService);
	private readonly _planService = inject(PlanService);
	private readonly _sessionService = inject(WorkoutSessionService);
	private readonly _flags = inject(ExerciseFlagService);
	private readonly _todoService = inject(TodoService);
	private readonly _reminderService = inject(ReminderService);
	private readonly _router = inject(Router);

	async signOut(): Promise<void> {
		await this._authService.signOut();
		await this.leave();
	}

	/** Clears caches and returns to sign-in; the Auth user is already signed out or deleted. */
	async leave(): Promise<void> {
		this._accountService.reset();
		this._planService.reset();
		this._sessionService.reset();
		this._flags.reset();
		this._todoService.reset();
		this._reminderService.reset();
		await this._router.navigateByUrl(APP_PATHS.signIn);
	}
}
