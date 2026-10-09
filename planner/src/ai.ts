import { generatePlan, MAX_EXERCISES_PER_DAY, plannedExerciseSeconds } from './generate';
import type {
	BodyArea,
	Exercise,
	Infeasibility,
	LoadAdjustment,
	PlanDay,
	PlannedExercise,
	PlannerInput,
	PlannerProfile,
	TrainingSetupInput,
	WorkoutPlan,
} from './types';
import { validatePlan } from './validate';

/**
 * Provider-agnostic AI layer (README §6.3). The model only *proposes* a choice and prescription
 * from the approved exercise ids; the same `validatePlan()` that checks calculator plans decides
 * whether the proposal may be used. The deterministic plan is always built first and is the
 * fallback, so a provider outage never blocks planning.
 */

export const AI_PROVIDER_VERSION = 'ai-1.0.0';

export const AI_MAX_SESSIONS = 7;
export const AI_MAX_EXERCISES_PER_SESSION = MAX_EXERCISES_PER_DAY;
export const AI_MAX_SETS = 8;
export const AI_MAX_REPS = 100;
export const AI_MAX_DURATION_SECONDS = 600;
/** Hard cap on how much provider output is parsed (characters of a JSON string). */
export const AI_MAX_RESPONSE_CHARS = 100_000;
export const AI_DEFAULT_TARGET_RPE = 7;

// ---------------------------------------------------------------------------------------------
// Request / provider contract
// ---------------------------------------------------------------------------------------------

/** Everything the provider may know about the user: planner inputs only, no identity or free text. */
export interface AiPlanSnapshot {
	profile: PlannerProfile;
	/** `customEquipment` free text is always stripped. */
	setup: TrainingSetupInput;
	/** Body areas (a closed enum), never the user's own words. */
	limitations: BodyArea[];
	adjustment: LoadAdjustment;
}

export interface AiPlanRequest {
	snapshot: AiPlanSnapshot;
	/** The only exercise ids the provider may use. */
	eligibleExerciseIds: string[];
	/** 1-based. */
	attempt: number;
	/** Validator errors from the previous attempt; empty on the first try. */
	feedback: string[];
}

export interface AiPlanProvider {
	id: string;
	/** Returns the raw, untrusted output (a JSON string or an already parsed value). */
	propose(request: AiPlanRequest, signal?: AbortSignal): Promise<unknown>;
}

// ---------------------------------------------------------------------------------------------
// Response schema
// ---------------------------------------------------------------------------------------------

export interface AiProposedExercise {
	exerciseId: string;
	sets: number;
	repsMin?: number;
	repsMax?: number;
	durationSeconds?: number;
	targetRpe?: number;
}

export interface AiProposedSession {
	exercises: AiProposedExercise[];
}

/** One session per training day of a week; later weeks repeat it. No loads, no free text. */
export interface AiPlanProposal {
	sessions: AiProposedSession[];
}

export type AiParseResult = { ok: true; proposal: AiPlanProposal } | { ok: false; errors: string[] };

const MAX_ERRORS = 10;

/**
 * Strict hand-written parser: unknown keys, wrong types, unknown exercise ids (when
 * `approvedExerciseIds` is given), non-integer or out-of-range numbers and oversized lists are all
 * rejected. Accepts a JSON string or an already parsed value.
 */
export function parseAiPlanResponse(
	raw: unknown,
	approvedExerciseIds?: readonly string[],
): AiParseResult {
	let value = raw;

	if (typeof raw === 'string') {
		if (raw.length > AI_MAX_RESPONSE_CHARS) {
			return { ok: false, errors: ['response is too large'] };
		}

		try {
			value = JSON.parse(raw);
		} catch {
			return { ok: false, errors: ['response is not valid JSON'] };
		}
	}

	const errors: string[] = [];
	const approved = approvedExerciseIds ? new Set(approvedExerciseIds) : null;

	if (!_isRecord(value)) {
		return { ok: false, errors: ['response must be an object'] };
	}

	_noUnknownKeys(value, ['sessions'], 'response', errors);

	const sessions: AiProposedSession[] = [];

	if (!Array.isArray(value['sessions'])) {
		errors.push('sessions must be an array');
	} else if (!value['sessions'].length || value['sessions'].length > AI_MAX_SESSIONS) {
		errors.push(`sessions must contain 1-${AI_MAX_SESSIONS} items`);
	} else {
		value['sessions'].forEach((rawSession: unknown, s: number) => {
			const path = `sessions[${s}]`;

			if (!_isRecord(rawSession)) {
				errors.push(`${path} must be an object`);
				return;
			}

			_noUnknownKeys(rawSession, ['exercises'], path, errors);

			const list = rawSession['exercises'];

			if (!Array.isArray(list)) {
				errors.push(`${path}.exercises must be an array`);
				return;
			}

			if (!list.length || list.length > AI_MAX_EXERCISES_PER_SESSION) {
				errors.push(`${path}.exercises must contain 1-${AI_MAX_EXERCISES_PER_SESSION} items`);
				return;
			}

			const exercises: AiProposedExercise[] = [];

			list.forEach((rawExercise: unknown, e: number) => {
				const parsed = _parseExercise(rawExercise, `${path}.exercises[${e}]`, approved, errors);

				if (parsed) {
					exercises.push(parsed);
				}
			});
			sessions.push({ exercises });
		});
	}

	if (errors.length) {
		return { ok: false, errors: errors.slice(0, MAX_ERRORS) };
	}

	return { ok: true, proposal: { sessions } };
}

function _parseExercise(
	raw: unknown,
	path: string,
	approved: Set<string> | null,
	errors: string[],
): AiProposedExercise | null {
	if (!_isRecord(raw)) {
		errors.push(`${path} must be an object`);
		return null;
	}

	const before = errors.length;

	_noUnknownKeys(
		raw,
		['exerciseId', 'sets', 'repsMin', 'repsMax', 'durationSeconds', 'targetRpe'],
		path,
		errors,
	);

	const id = raw['exerciseId'];

	if (typeof id !== 'string' || !id || id.length > 128) {
		errors.push(`${path}.exerciseId must be a non-empty string`);
	} else if (approved && !approved.has(id)) {
		errors.push(`${path}.exerciseId "${_clip(id)}" is not an approved exercise`);
	}

	const sets = _int(raw, 'sets', 1, AI_MAX_SETS, true, path, errors);
	const repsMin = _int(raw, 'repsMin', 1, AI_MAX_REPS, false, path, errors);
	const repsMax = _int(raw, 'repsMax', 1, AI_MAX_REPS, false, path, errors);
	const durationSeconds = _int(raw, 'durationSeconds', 1, AI_MAX_DURATION_SECONDS, false, path, errors);
	const targetRpe = _int(raw, 'targetRpe', 1, 10, false, path, errors);

	if ((repsMin === undefined) !== (repsMax === undefined)) {
		errors.push(`${path} needs both repsMin and repsMax`);
	} else if (repsMin !== undefined && repsMax !== undefined && repsMin > repsMax) {
		errors.push(`${path}.repsMin must not exceed repsMax`);
	}

	if (repsMin !== undefined && durationSeconds !== undefined) {
		errors.push(`${path} must use either reps or durationSeconds, not both`);
	}

	if (repsMin === undefined && durationSeconds === undefined) {
		errors.push(`${path} needs reps or durationSeconds`);
	}

	if (errors.length > before) {
		return null;
	}

	const exercise: AiProposedExercise = { exerciseId: id as string, sets: sets! };

	if (repsMin !== undefined) {
		exercise.repsMin = repsMin;
		exercise.repsMax = repsMax!;
	}

	if (durationSeconds !== undefined) {
		exercise.durationSeconds = durationSeconds;
	}

	if (targetRpe !== undefined) {
		exercise.targetRpe = targetRpe;
	}

	return exercise;
}

function _int(
	source: Record<string, unknown>,
	key: string,
	min: number,
	max: number,
	required: boolean,
	path: string,
	errors: string[],
): number | undefined {
	const value = source[key];

	if (value === undefined) {
		if (required) {
			errors.push(`${path}.${key} is required`);
		}

		return undefined;
	}

	if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
		errors.push(`${path}.${key} must be an integer between ${min} and ${max}`);
		return undefined;
	}

	return value;
}

function _noUnknownKeys(
	source: Record<string, unknown>,
	allowed: string[],
	path: string,
	errors: string[],
): void {
	for (const key of Object.keys(source)) {
		if (!allowed.includes(key)) {
			errors.push(`${path} has unknown key "${_clip(key)}"`);
		}
	}
}

function _isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function _clip(text: string): string {
	return text.length > 40 ? `${text.slice(0, 40)}...` : text;
}

// ---------------------------------------------------------------------------------------------
// Request building and credential hygiene
// ---------------------------------------------------------------------------------------------

/** Builds the minimal request. Free text (custom equipment, names, notes) never leaves the device. */
export function buildAiPlanRequest(
	input: PlannerInput,
	eligibleExerciseIds: string[],
	attempt: number,
	feedback: string[] = [],
): AiPlanRequest {
	return {
		snapshot: {
			profile: {
				goal: input.profile.goal,
				fitnessLevel: input.profile.fitnessLevel,
				daysPerWeek: input.profile.daysPerWeek,
				sessionMinutes: input.profile.sessionMinutes,
				preferredDays: [...input.profile.preferredDays],
			},
			setup: { ...input.setup, equipment: input.setup.equipment.map((item) => ({ ...item })), customEquipment: [] },
			limitations: [...input.limitations].sort(),
			adjustment: input.adjustment ?? 'keep',
		},
		eligibleExerciseIds: [...eligibleExerciseIds],
		attempt,
		feedback: [...feedback],
	};
}

const SECRET_PATTERNS: RegExp[] = [
	/\bsk-ant-[A-Za-z0-9_-]{8,}/g,
	/\bsk-[A-Za-z0-9_-]{16,}/g,
	/\bAIza[A-Za-z0-9_-]{20,}/g,
	/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
];

/** Masks typical API keys and bearer tokens so they never reach logs, errors or stored plans. */
export function redactSecrets(text: string): string {
	return SECRET_PATTERNS.reduce(
		(result, pattern) =>
			result.replace(pattern, (match) =>
				/^bearer/i.test(match) ? 'Bearer [REDACTED]' : '[REDACTED]',
			),
		text,
	);
}

// ---------------------------------------------------------------------------------------------
// Proposal -> WorkoutPlan
// ---------------------------------------------------------------------------------------------

/**
 * Maps a parsed proposal onto the dates of the deterministic plan. Everything except the
 * prescription (sets, reps or duration, effort) comes from the catalog, never from the model.
 * Returns errors (used as retry feedback) when the proposal does not fit the catalog.
 */
export function proposalToPlan(
	proposal: AiPlanProposal,
	base: WorkoutPlan,
	catalog: Exercise[],
	providerId: string,
): { ok: true; plan: WorkoutPlan } | { ok: false; errors: string[] } {
	const errors: string[] = [];

	if (proposal.sessions.length !== base.daysPerWeek) {
		return {
			ok: false,
			errors: [`sessions must contain exactly ${base.daysPerWeek} items, got ${proposal.sessions.length}`],
		};
	}

	const byId = new Map(catalog.map((exercise) => [exercise.id, exercise]));
	const sessions = proposal.sessions.map((session, s) =>
		session.exercises.map((proposed, e) => {
			const exercise = byId.get(proposed.exerciseId);

			if (!exercise) {
				errors.push(`sessions[${s}].exercises[${e}]: unknown exercise "${_clip(proposed.exerciseId)}"`);
				return null;
			}

			const planned = _toPlanned(proposed, exercise);

			if (typeof planned === 'string') {
				errors.push(`sessions[${s}].exercises[${e}] (${exercise.id}): ${planned}`);
				return null;
			}

			return { exercise, planned };
		}),
	);

	if (errors.length) {
		return { ok: false, errors: errors.slice(0, MAX_ERRORS) };
	}

	const positionInWeek = new Map<number, number>();
	const days: PlanDay[] = base.days.map((day) => {
		const position = positionInWeek.get(day.week) ?? 0;

		positionInWeek.set(day.week, position + 1);

		const session = sessions[position % sessions.length]!.map((item) => item!);
		const seconds = session.reduce(
			(total, { exercise, planned }) => total + plannedExerciseSeconds(exercise, planned),
			0,
		);

		return {
			...day,
			estimatedMinutes: Math.ceil(seconds / 60),
			exercises: session.map(({ planned }) => ({ ...planned })),
		};
	});

	return {
		ok: true,
		plan: {
			...base,
			algorithmVersion: `${AI_PROVIDER_VERSION}:${providerId}`,
			provenance: 'ai',
			days,
		},
	};
}

/** Returns the planned exercise, or a reason string when the prescription does not fit. */
function _toPlanned(proposed: AiProposedExercise, exercise: Exercise): PlannedExercise | string {
	const planned: PlannedExercise = {
		exerciseId: exercise.id,
		exerciseVersion: exercise.version,
		name: exercise.name,
		movementPattern: exercise.movementPattern,
		sets: proposed.sets,
		repsMin: null,
		repsMax: null,
		durationSeconds: null,
		restSeconds: exercise.restSeconds,
		targetRpe: proposed.targetRpe ?? AI_DEFAULT_TARGET_RPE,
	};

	if (proposed.sets > exercise.defaultSets + 1) {
		return `sets must not exceed ${exercise.defaultSets + 1}`;
	}

	if (exercise.intensityMode === 'reps') {
		const range = exercise.repRange;

		if (!range || proposed.repsMin === undefined || proposed.repsMax === undefined) {
			return 'this exercise is prescribed in reps (repsMin and repsMax)';
		}

		if (proposed.repsMin < range.min || proposed.repsMax > range.max) {
			return `reps must stay within ${range.min}-${range.max}`;
		}

		planned.repsMin = proposed.repsMin;
		planned.repsMax = proposed.repsMax;
	} else {
		const range = exercise.durationRange;

		if (!range || proposed.durationSeconds === undefined) {
			return 'this exercise is prescribed by time (durationSeconds)';
		}

		if (proposed.durationSeconds < range.min || proposed.durationSeconds > range.max) {
			return `durationSeconds must stay within ${range.min}-${range.max}`;
		}

		planned.durationSeconds = proposed.durationSeconds;
	}

	return planned;
}

// ---------------------------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------------------------

export type AiFallbackReason =
	| 'provider-error'
	| 'timeout'
	| 'invalid-response'
	| 'validation-failed'
	| 'disabled';

export interface GeneratePlanWithAiOptions {
	/** `null` or `undefined` means AI is disabled: the calculator plan is returned. */
	provider: AiPlanProvider | null | undefined;
	input: PlannerInput;
	catalog: Exercise[];
	/** Total attempts, including the first. Defaults to 2. */
	maxAttempts?: number;
	/** Per-attempt time limit. No limit when omitted. */
	timeoutMs?: number;
	/** Clock for `elapsedMs`; defaults to `Date.now`. */
	now?: () => number;
}

export type AiPlanResult =
	| {
			ok: true;
			plan: WorkoutPlan;
			source: 'ai' | 'calculator';
			/** Set when `source` is `'calculator'` only because AI was skipped or failed. */
			fallbackReason?: AiFallbackReason;
			/** Redacted, short diagnostic for the failure; never contains secrets. */
			detail?: string;
			attempts: number;
			elapsedMs: number;
	  }
	| { ok: false; infeasibility: Infeasibility; elapsedMs: number };

/**
 * Calculator first, then AI. The result is always a plan that passed `validatePlan()`, and this
 * function never throws because of the provider.
 */
export async function generatePlanWithAi(options: GeneratePlanWithAiOptions): Promise<AiPlanResult> {
	const clock = options.now ?? Date.now;
	const startedAt = clock();
	const elapsed = () => clock() - startedAt;
	const input: PlannerInput = { ...options.input, catalog: options.catalog };
	const base = generatePlan(input);

	if (!base.ok) {
		return { ok: false, infeasibility: base.infeasibility, elapsedMs: elapsed() };
	}

	const calculator = (fallbackReason: AiFallbackReason, attempts: number, detail?: string): AiPlanResult => ({
		ok: true,
		plan: base.plan,
		source: 'calculator',
		fallbackReason,
		...(detail ? { detail: _clip200(redactSecrets(detail)) } : {}),
		attempts,
		elapsedMs: elapsed(),
	});

	if (!options.provider) {
		return calculator('disabled', 0);
	}

	const provider = options.provider;
	const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 2));
	const eligibleIds = base.plan.input.catalog.map((entry) => entry.slice(0, entry.lastIndexOf('@')));
	let feedback: string[] = [];
	let reason: AiFallbackReason = 'invalid-response';
	let detail: string | undefined;
	let attempt = 0;

	while (attempt < maxAttempts) {
		attempt++;

		let raw: unknown;

		try {
			raw = await _callProvider(
				provider,
				buildAiPlanRequest(input, eligibleIds, attempt, feedback),
				options.timeoutMs,
			);
		} catch (error) {
			if (error instanceof AiTimeoutError) {
				return calculator('timeout', attempt);
			}

			return calculator('provider-error', attempt, error instanceof Error ? error.message : String(error));
		}

		const parsed = parseAiPlanResponse(raw, eligibleIds);

		if (!parsed.ok) {
			reason = 'invalid-response';
			feedback = parsed.errors;
			continue;
		}

		const converted = proposalToPlan(parsed.proposal, base.plan, options.catalog, provider.id);

		if (!converted.ok) {
			reason = 'invalid-response';
			feedback = converted.errors;
			continue;
		}

		const violations = validatePlan(converted.plan, input);

		if (!violations.length) {
			return {
				ok: true,
				plan: converted.plan,
				source: 'ai',
				attempts: attempt,
				elapsedMs: elapsed(),
			};
		}

		reason = 'validation-failed';
		feedback = _violationFeedback(violations);
	}

	return calculator(reason, attempt, feedback.join('; '));
}

function _violationFeedback(violations: ReturnType<typeof validatePlan>): string[] {
	const seen = new Set<string>();

	// Plans repeat one session across weeks, so identical violations are reported once.
	for (const violation of violations) {
		seen.add(
			`${violation.code}${violation.exerciseId ? ` ${violation.exerciseId}` : ''}: ${violation.detail}`,
		);
	}

	return [...seen].slice(0, MAX_ERRORS);
}

function _clip200(text: string): string {
	return text.length > 200 ? `${text.slice(0, 200)}...` : text;
}

class AiTimeoutError extends Error {}

function _callProvider(
	provider: AiPlanProvider,
	request: AiPlanRequest,
	timeoutMs: number | undefined,
): Promise<unknown> {
	const controller = new AbortController();
	let timer: ReturnType<typeof setTimeout> | undefined;
	const call = Promise.resolve().then(() => provider.propose(request, controller.signal));

	if (!timeoutMs || timeoutMs <= 0) {
		return call;
	}

	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => {
			controller.abort();
			reject(new AiTimeoutError('provider timed out'));
		}, timeoutMs);
	});

	// A late rejection from the abandoned call must not become an unhandled rejection.
	call.catch(() => undefined);

	return Promise.race([call, timeout]).finally(() => clearTimeout(timer));
}
