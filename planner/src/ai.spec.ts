import { describe, expect, it } from 'vitest';
import {
	buildAiPlanRequest,
	generatePlanWithAi,
	parseAiPlanResponse,
	redactSecrets,
	type AiPlanProposal,
	type AiPlanProvider,
	type AiPlanRequest,
} from './ai';
import { generatePlan } from './generate';
import type { Exercise, MovementPattern, PlannerInput, TrainingSetupInput, WorkoutPlan } from './types';
import { validatePlan } from './validate';

// --- fixtures ------------------------------------------------------------------------------

function exercise(id: string, pattern: MovementPattern, overrides: Partial<Exercise> = {}): Exercise {
	return {
		id,
		slug: id,
		name: id,
		description: id,
		category: pattern === 'conditioning' ? 'conditioning' : pattern === 'mobility' ? 'mobility' : 'strength',
		movementPattern: pattern,
		primaryMuscles: ['full-body'],
		secondaryMuscles: [],
		equipmentRequired: [],
		requiresAdjustableBench: false,
		fitnessLevel: 'beginner',
		coordinationDifficulty: 1,
		minimumSpace: {
			lengthM: 1,
			widthM: 1,
			heightM: null,
			needsFloorContact: false,
			needsAnchor: false,
			surfaces: null,
			locations: ['home', 'gym', 'outdoors', 'other'],
		},
		impactLevel: 'none',
		noiseLevel: 'quiet',
		axialSpinalLoad: 'none',
		highLoadBodyAreas: [],
		contraindicatedAreas: [],
		warnings: [],
		intensityMode: 'reps',
		defaultSets: 3,
		repRange: { min: 8, max: 12 },
		durationRange: null,
		estimatedSetSeconds: 36,
		restSeconds: 60,
		imageUrl: null,
		steps: ['step'],
		techniqueNotes: [],
		status: 'published',
		reviewedBy: 'Reviewer',
		reviewedAt: '2026-10-01',
		version: 1,
		...overrides,
	};
}

const CATALOG: Exercise[] = [
	exercise('squat', 'squat'),
	exercise('wall-push-up', 'push-horizontal'),
	exercise('good-morning', 'hinge'),
	exercise('towel-row', 'pull-horizontal'),
	exercise('plank', 'core', {
		intensityMode: 'time',
		repRange: null,
		durationRange: { min: 20, max: 40 },
		estimatedSetSeconds: 40,
	}),
	exercise('march', 'conditioning'),
	exercise('db-row', 'pull-horizontal', { equipmentRequired: [{ anyOf: ['dumbbells'] }] }),
	exercise('bridge', 'hinge', {
		minimumSpace: { ...exercise('x', 'hinge').minimumSpace, needsFloorContact: true },
	}),
	exercise('tall-jump', 'conditioning', {
		minimumSpace: { ...exercise('x', 'hinge').minimumSpace, heightM: 2.6 },
	}),
];

const SETUP: TrainingSetupInput = {
	noEquipment: true,
	equipment: [],
	customEquipment: ['my secret garage gym'],
	location: 'home',
	floor: { preset: 'large', lengthM: null, widthM: null },
	ceiling: { preset: 'low', heightM: null },
	surface: 'hard-floor',
	jumpingAllowed: 'yes',
	quietOnly: false,
	canLieDown: 'no',
	safeAnchor: 'no',
};

function input(overrides: Partial<PlannerInput> = {}): PlannerInput {
	return {
		profile: {
			goal: 'general-fitness',
			fitnessLevel: 'beginner',
			daysPerWeek: 2,
			sessionMinutes: 12,
			preferredDays: [],
		},
		setup: SETUP,
		limitations: [],
		catalog: CATALOG,
		startDate: '2026-10-05',
		...overrides,
	};
}

function basePlan(): WorkoutPlan {
	const result = generatePlan(input());

	if (!result.ok) {
		throw new Error(`expected a plan, got ${result.infeasibility.code}`);
	}

	return result.plan;
}

/** The deterministic week 1, expressed as an AI proposal. */
function proposalFromBase(): AiPlanProposal {
	const plan = basePlan();

	return {
		sessions: plan.days.slice(0, plan.daysPerWeek).map((day) => ({
			exercises: day.exercises.map((planned) => ({
				exerciseId: planned.exerciseId,
				sets: planned.sets,
				...(planned.repsMin !== null ? { repsMin: planned.repsMin, repsMax: planned.repsMax! } : {}),
				...(planned.durationSeconds !== null ? { durationSeconds: planned.durationSeconds } : {}),
			})),
		})),
	};
}

function provider(propose: AiPlanProvider['propose'], id = 'mock'): AiPlanProvider {
	return { id, propose };
}

const returning = (value: unknown) => provider(async () => value);

// --- tests ---------------------------------------------------------------------------------

describe('parseAiPlanResponse', () => {
	it('accepts a JSON string or an object', () => {
		const proposal = proposalFromBase();

		expect(parseAiPlanResponse(JSON.stringify(proposal)).ok).toBe(true);
		expect(parseAiPlanResponse(proposal).ok).toBe(true);
	});

	it('rejects unknown keys, wrong types and bad numbers', () => {
		const good = proposalFromBase();
		const withExercise = (patch: Record<string, unknown>) => ({
			sessions: [{ exercises: [{ exerciseId: 'squat', sets: 2, repsMin: 8, repsMax: 10, ...patch }] }],
		});

		expect(parseAiPlanResponse({ ...good, name: 'Anna' }).ok).toBe(false);
		expect(parseAiPlanResponse(withExercise({ loadKg: 40 })).ok).toBe(false);
		expect(parseAiPlanResponse(withExercise({ sets: 2.5 })).ok).toBe(false);
		expect(parseAiPlanResponse(withExercise({ sets: '2' })).ok).toBe(false);
		expect(parseAiPlanResponse(withExercise({ sets: 99 })).ok).toBe(false);
		expect(parseAiPlanResponse(withExercise({ repsMin: 12, repsMax: 8 })).ok).toBe(false);
		expect(parseAiPlanResponse(withExercise({ durationSeconds: 30 })).ok).toBe(false);
		expect(parseAiPlanResponse(withExercise({ targetRpe: 11 })).ok).toBe(false);
		expect(parseAiPlanResponse({ sessions: [] }).ok).toBe(false);
		expect(parseAiPlanResponse(null).ok).toBe(false);
		expect(parseAiPlanResponse([]).ok).toBe(false);
	});

	it('rejects oversized lists and unapproved exercise ids', () => {
		const many = { sessions: Array.from({ length: 8 }, () => ({ exercises: [] })) };
		const tooLong = {
			sessions: [
				{
					exercises: Array.from({ length: 9 }, () => ({ exerciseId: 'squat', sets: 2, repsMin: 8, repsMax: 9 })),
				},
			],
		};
		const unknown = { sessions: [{ exercises: [{ exerciseId: 'invented', sets: 2, repsMin: 8, repsMax: 9 }] }] };

		expect(parseAiPlanResponse(many).ok).toBe(false);
		expect(parseAiPlanResponse(tooLong).ok).toBe(false);
		expect(parseAiPlanResponse(unknown).ok).toBe(true);

		const strict = parseAiPlanResponse(unknown, ['squat']);

		expect(strict.ok).toBe(false);
		expect(!strict.ok && strict.errors.join()).toContain('not an approved exercise');
	});

	it('rejects non-JSON text', () => {
		expect(parseAiPlanResponse('Sure! Here is your plan').ok).toBe(false);
	});
});

describe('generatePlanWithAi', () => {
	it('accepts a valid proposal and stamps AI provenance', async () => {
		const result = await generatePlanWithAi({
			provider: returning(proposalFromBase()),
			input: input(),
			catalog: CATALOG,
		});

		expect(result.ok && result.source).toBe('ai');
		expect(result.ok && result.attempts).toBe(1);

		if (result.ok) {
			expect(result.plan.provenance).toBe('ai');
			expect(result.plan.algorithmVersion).toContain('mock');
			expect(result.fallbackReason).toBeUndefined();
			expect(validatePlan(result.plan, input())).toEqual([]);
		}
	});

	it('falls back to the calculator when the provider throws (acceptance 8)', async () => {
		const result = await generatePlanWithAi({
			provider: provider(async () => {
				throw new Error('503 from upstream, key sk-ant-abcdef1234567890');
			}),
			input: input(),
			catalog: CATALOG,
		});

		expect(result.ok && result.source).toBe('calculator');
		expect(result.ok && result.fallbackReason).toBe('provider-error');
		expect(result.ok && result.plan).toEqual(basePlan());
		expect(result.ok && result.detail).not.toContain('sk-ant-abcdef');
	});

	it('falls back when a synchronous provider throws', async () => {
		const result = await generatePlanWithAi({
			provider: provider(() => {
				throw new Error('boom');
			}),
			input: input(),
			catalog: CATALOG,
		});

		expect(result.ok && result.fallbackReason).toBe('provider-error');
	});

	it('reports disabled when no provider is configured', async () => {
		const result = await generatePlanWithAi({ provider: null, input: input(), catalog: CATALOG });

		expect(result.ok && result.source).toBe('calculator');
		expect(result.ok && result.fallbackReason).toBe('disabled');
	});

	it('rejects exercises outside the approved set and never returns them (acceptance 9)', async () => {
		// db-row needs dumbbells, bridge needs floor contact, tall-jump needs a high ceiling.
		for (const id of ['invented-move', 'db-row', 'bridge', 'tall-jump']) {
			const proposal = proposalFromBase();

			proposal.sessions[0]!.exercises[0] = { exerciseId: id, sets: 2, repsMin: 8, repsMax: 10 };

			const result = await generatePlanWithAi({ provider: returning(proposal), input: input(), catalog: CATALOG });

			expect(result.ok && result.source, id).toBe('calculator');
			expect(result.ok && result.fallbackReason, id).toBe('invalid-response');
			expect(result.ok && JSON.stringify(result.plan.days), id).not.toContain(`"${id}"`);
		}
	});

	it('rejects a proposal that runs over the time budget via the shared validator', async () => {
		const proposal = proposalFromBase();

		for (const session of proposal.sessions) {
			for (const item of session.exercises) {
				item.sets = 4;
			}
		}

		const calls: AiPlanRequest[] = [];
		const result = await generatePlanWithAi({
			provider: provider(async (request) => {
				calls.push(request);

				return proposal;
			}),
			input: input(),
			catalog: CATALOG,
		});

		expect(result.ok && result.source).toBe('calculator');
		expect(result.ok && result.fallbackReason).toBe('validation-failed');
		expect(calls).toHaveLength(2);
		expect(calls[1]!.feedback.join()).toContain('over-time-budget');
	});

	it('retries with validator feedback and accepts the second attempt', async () => {
		const bad = proposalFromBase();

		bad.sessions[0]!.exercises[0]!.exerciseId = 'invented-move';

		const calls: AiPlanRequest[] = [];
		const result = await generatePlanWithAi({
			provider: provider(async (request) => {
				calls.push(request);

				return request.attempt === 1 ? bad : proposalFromBase();
			}),
			input: input(),
			catalog: CATALOG,
		});

		expect(result.ok && result.source).toBe('ai');
		expect(result.ok && result.attempts).toBe(2);
		expect(calls[0]!.feedback).toEqual([]);
		expect(calls[1]!.feedback.join()).toContain('invented-move');
	});

	it('does not retry beyond maxAttempts', async () => {
		let calls = 0;
		const result = await generatePlanWithAi({
			provider: provider(async () => {
				calls++;

				return 'nonsense';
			}),
			input: input(),
			catalog: CATALOG,
			maxAttempts: 3,
		});

		expect(calls).toBe(3);
		expect(result.ok && result.fallbackReason).toBe('invalid-response');
	});

	it('falls back on timeout and aborts the provider', async () => {
		let aborted = false;
		const result = await generatePlanWithAi({
			provider: provider(
				(_request, signal) =>
					new Promise((_resolve, reject) => {
						signal?.addEventListener('abort', () => {
							aborted = true;
							reject(new Error('aborted'));
						});
					}),
			),
			input: input(),
			catalog: CATALOG,
			timeoutMs: 20,
		});

		expect(result.ok && result.source).toBe('calculator');
		expect(result.ok && result.fallbackReason).toBe('timeout');
		expect(aborted).toBe(true);
	});

	it('falls back on garbage and non-JSON output', async () => {
		for (const garbage of ['not json at all', '{"sessions": [', 42, undefined, { sessions: 'x' }]) {
			const result = await generatePlanWithAi({ provider: returning(garbage), input: input(), catalog: CATALOG });

			expect(result.ok && result.source).toBe('calculator');
			expect(result.ok && result.fallbackReason).toBe('invalid-response');
		}
	});

	it('does not call AI when no plan is feasible', async () => {
		let called = false;
		const result = await generatePlanWithAi({
			provider: provider(async () => {
				called = true;

				return {};
			}),
			input: input({ catalog: [] }),
			catalog: [],
		});

		expect(result.ok).toBe(false);
		expect(called).toBe(false);
	});
});

describe('credential hygiene (acceptance 14)', () => {
	it('redacts typical API keys and bearer tokens', () => {
		const text =
			'key sk-proj-abcdefghijklmnopqrstuvwx and sk-ant-api03-AbCdEf1234567890 ' +
			'Authorization: Bearer eyJhbGciOi.JIUzI1NiJ9.sig-123 done';
		const redacted = redactSecrets(text);

		expect(redacted).not.toContain('abcdefghijklmnop');
		expect(redacted).not.toContain('AbCdEf1234567890');
		expect(redacted).not.toContain('eyJhbGciOi');
		expect(redacted).toContain('Bearer [REDACTED]');
		expect(redactSecrets('plain task-list text')).toBe('plain task-list text');
	});

	it('keeps names, emails, notes and free text out of the request', async () => {
		const personal = input({
			setup: { ...SETUP, customEquipment: ['anna@example.com garage'] },
			// Extra fields a careless caller might smuggle in must not be forwarded either.
			...({ name: 'Anna Kovalenko', email: 'anna@example.com', notes: 'knee surgery 2024' } as object),
			limitations: ['knees'],
		});
		const seen: AiPlanRequest[] = [];

		await generatePlanWithAi({
			provider: provider(async (request) => {
				seen.push(request);

				return proposalFromBase();
			}),
			input: personal,
			catalog: CATALOG,
		});

		const json = JSON.stringify(seen[0]);

		expect(json).not.toMatch(/Anna|Kovalenko|anna@example|surgery|garage/);
		expect(seen[0]!.snapshot.setup.customEquipment).toEqual([]);
		expect(seen[0]!.snapshot.limitations).toEqual(['knees']);
		expect(Object.keys(seen[0]!).sort()).toEqual(['attempt', 'eligibleExerciseIds', 'feedback', 'snapshot']);
		expect(Object.keys(buildAiPlanRequest(personal, ['squat'], 1)).sort()).toEqual(
			Object.keys(seen[0]!).sort(),
		);
	});
});
