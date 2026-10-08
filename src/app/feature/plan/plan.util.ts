/** Today's date in the user's local calendar, `YYYY-MM-DD`. */
export function localToday(now = new Date()): string {
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');

	return `${now.getFullYear()}-${month}-${day}`;
}

/** JSON with object keys sorted, so equal data compares equal regardless of key order. */
export function stableStringify(value: unknown): string {
	return JSON.stringify(value, (_, item: unknown) =>
		item && typeof item === 'object' && !Array.isArray(item)
			? Object.fromEntries(
					Object.entries(item as Record<string, unknown>)
						.filter(([, entry]) => entry !== undefined)
						.sort(([a], [b]) => a.localeCompare(b)),
				)
			: item,
	);
}

/** Long local date for a `YYYY-MM-DD` plan date, e.g. "понеділок, 5 жовтня". */
export function formatPlanDate(date: string, locale: string): string {
	const [year, month, day] = date.split('-').map(Number);

	return new Intl.DateTimeFormat(locale, {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		timeZone: 'UTC',
	}).format(new Date(Date.UTC(year!, month! - 1, day!)));
}
