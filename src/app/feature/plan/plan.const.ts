import type {
	ExclusionReason,
	ExerciseCategory,
	InfeasibilityCode,
	MovementPattern,
	MuscleGroup,
} from '@trainup/planner';
import type { AccountSection } from '../account/account.interface';

export interface ExclusionReasonInfo {
	label: string;
	/** Profile section where the user can change the input behind this reason. */
	section: AccountSection | null;
}

export const EXCLUSION_REASONS: Record<ExclusionReason, ExclusionReasonInfo> = {
	'not-published': { label: 'Вправа ще проходить перевірку', section: null },
	'incomplete-metadata': { label: 'Опис вправи ще неповний', section: null },
	'missing-equipment': { label: 'Бракує потрібного обладнання', section: 'equipment' },
	'pull-up-bar-not-secure': { label: 'Турнік не закріплено надійно', section: 'equipment' },
	'bench-not-adjustable': { label: 'Потрібна лава з регульованою спинкою', section: 'equipment' },
	'floor-too-small': { label: 'Замало вільного місця', section: 'space' },
	'floor-unknown': { label: 'Не вказано вільну площу', section: 'space' },
	'ceiling-too-low': { label: 'Замала висота стелі', section: 'space' },
	'ceiling-unknown': { label: 'Невідома висота стелі', section: 'space' },
	'surface-unsuitable': { label: 'Покриття не підходить', section: 'space' },
	'jumping-not-allowed': { label: 'Стрибки не дозволені', section: 'space' },
	'too-noisy': { label: 'Вправа гучна, а потрібна тиша', section: 'space' },
	'no-floor-contact': { label: 'Потрібно лягати на підлогу', section: 'space' },
	'no-anchor': { label: 'Потрібна надійна точка кріплення', section: 'space' },
	location: { label: 'Не підходить для місця тренувань', section: 'space' },
	limitation: { label: 'Навантажує ділянку, яку потрібно берегти', section: 'limitations' },
	'level-too-high': { label: 'Складна для вашого рівня', section: 'schedule' },
};

export const INFEASIBILITY_MESSAGES: Record<InfeasibilityCode, string> = {
	'missing-goal-or-level': 'Оберіть ціль і рівень підготовки, щоб скласти план.',
	'no-eligible-exercises': 'Жодна вправа не підходить до ваших налаштувань.',
	'too-few-exercises': 'Підходить замало вправ, щоб скласти повноцінне тренування.',
	'session-too-short': 'Заняття закоротке, щоб вмістити хоча б дві вправи з відпочинком.',
};

export const MOVEMENT_PATTERN_LABELS: Record<MovementPattern, string> = {
	squat: 'Присідання',
	hinge: 'Згинання в тазі',
	lunge: 'Випади',
	'push-horizontal': 'Жим від себе',
	'push-vertical': 'Жим угору',
	'pull-horizontal': 'Тяга до себе',
	'pull-vertical': 'Тяга згори',
	core: 'М’язи кора',
	conditioning: 'Кардіо',
	mobility: 'Рухливість',
};

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
	quads: 'Квадрицепси',
	hamstrings: 'Задня поверхня стегна',
	glutes: 'Сідниці',
	calves: 'Литки',
	chest: 'Груди',
	back: 'Спина',
	shoulders: 'Плечі',
	biceps: 'Біцепси',
	triceps: 'Трицепси',
	core: 'М’язи кора',
	'full-body': 'Усе тіло',
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
	strength: 'Сила',
	conditioning: 'Витривалість',
	mobility: 'Рухливість',
};
