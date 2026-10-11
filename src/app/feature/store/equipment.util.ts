import type { EquipmentItem, TrainingSetupInput } from '../training-setup/training-setup.interface';

/** Merges one purchased item into the equipment the user already has. */
export function mergeEquipmentItem(current: EquipmentItem[], bought: EquipmentItem): EquipmentItem[] {
	const existing = current.find((item) => item.type === bought.type);

	if (!existing) {
		return [...current, { ...bought }];
	}

	const merged: EquipmentItem = { ...existing };

	if (bought.weightsKg?.length) {
		merged.weightsKg = [...new Set([...(existing.weightsKg ?? []), ...bought.weightsKg])].sort(
			(a, b) => a - b,
		);
	}

	if (bought.resistances?.length) {
		merged.resistances = [...new Set([...(existing.resistances ?? []), ...bought.resistances])];
	}

	if (bought.adjustable) {
		merged.adjustable = true;
	}

	// `safelyInstalled` is only ever confirmed by the user, never by a purchase.
	return current.map((item) => (item === existing ? merged : item));
}

/** Returns the setup with every purchased item added to its equipment. */
export function addPurchasedEquipment(
	setup: TrainingSetupInput,
	bought: EquipmentItem[],
): TrainingSetupInput {
	return {
		...setup,
		noEquipment: false,
		equipment: bought.reduce(mergeEquipmentItem, setup.equipment),
	};
}
