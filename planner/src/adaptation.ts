import type { AdjustmentRecommendation, LoadAdjustment, SessionFeedback } from './types';

/** Feedback needed before any change is suggested; one session is never enough (README §6.4). */
export const MIN_SESSIONS_FOR_ADJUSTMENT = 3;
/** Sessions that must all be easy before volume goes up. */
export const SESSIONS_FOR_PROGRESS = 4;
const HARD_RPE = 9;
const EASY_RPE = 5;
const LOW_COMPLETION = 0.6;
const FULL_COMPLETION = 0.9;

/**
 * Conservative volume change for the next plan, from accumulated session feedback:
 * - fewer than 3 sessions: keep (not enough data);
 * - any pain in the recent sessions: keep — never increase after pain;
 * - 2 of the last 3 sessions very hard (RPE ≥ 9) or mostly unfinished (< 60% of sets): ease;
 * - the last 4 sessions all easy (RPE ≤ 5) and fully completed: progress;
 * - otherwise keep.
 */
export function recommendAdjustment(feedback: SessionFeedback[]): AdjustmentRecommendation {
	const recent = [...feedback]
		.sort((a, b) => b.date.localeCompare(a.date))
		.slice(0, SESSIONS_FOR_PROGRESS);

	if (recent.length < MIN_SESSIONS_FOR_ADJUSTMENT) {
		return { adjustment: 'keep', reason: 'not-enough-data', sessions: recent.length };
	}

	if (recent.some((session) => session.pain)) {
		return { adjustment: 'keep', reason: 'pain', sessions: recent.length };
	}

	const lastThree = recent.slice(0, MIN_SESSIONS_FOR_ADJUSTMENT);
	const hard = lastThree.filter(
		(session) =>
			(session.rpe !== null && session.rpe >= HARD_RPE) || session.completionRate < LOW_COMPLETION,
	).length;

	if (hard >= 2) {
		return { adjustment: 'ease', reason: 'too-hard', sessions: lastThree.length };
	}

	const allEasy =
		recent.length === SESSIONS_FOR_PROGRESS &&
		recent.every(
			(session) =>
				session.rpe !== null &&
				session.rpe <= EASY_RPE &&
				session.completionRate >= FULL_COMPLETION,
		);

	if (allEasy) {
		return { adjustment: 'progress', reason: 'too-easy', sessions: recent.length };
	}

	return { adjustment: 'keep', reason: 'on-track', sessions: recent.length };
}

const ADJUSTMENT_ORDER: LoadAdjustment[] = ['ease', 'keep', 'progress'];

/**
 * The adjustment for the next plan: one step from the previous plan's adjustment at most, so
 * volume changes gradually. No clear signal keeps the previous adjustment; pain never moves up.
 */
export function nextAdjustment(
	previous: LoadAdjustment,
	recommendation: AdjustmentRecommendation,
): LoadAdjustment {
	const index = ADJUSTMENT_ORDER.indexOf(previous);

	switch (recommendation.reason) {
		case 'too-hard':
			return ADJUSTMENT_ORDER[Math.max(0, index - 1)]!;
		case 'too-easy':
			return ADJUSTMENT_ORDER[Math.min(ADJUSTMENT_ORDER.length - 1, index + 1)]!;
		case 'pain':
			return previous === 'progress' ? 'keep' : previous;
		case 'not-enough-data':
		case 'on-track':
			return previous;
	}
}
