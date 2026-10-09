// Appends new UI strings to every src/i18n/*.json file (index-aligned with ua.json).
// Usage: node tools/i18n/add-strings.mjs [tools/i18n/strings/<name>.json ...]   (default: all)
// Each strings file is an array of { "ua": "...", "en": "...", "<code>": "..." }.
// Languages without an explicit translation get the English text as a placeholder, so the arrays
// stay aligned and nobody sees Ukrainian by accident. Re-running is safe: known `ua` keys are skipped.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const i18nDir = path.join(root, 'src/i18n');
const stringsDir = path.join(root, 'tools/i18n/strings');

const inputs = process.argv.length > 2
	? process.argv.slice(2).map((file) => path.resolve(file))
	: (await readdir(stringsDir)).filter((f) => f.endsWith('.json')).map((f) => path.join(stringsDir, f));

const codes = (await readdir(i18nDir)).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
const tables = Object.fromEntries(
	await Promise.all(codes.map(async (code) => [code, JSON.parse(await readFile(path.join(i18nDir, `${code}.json`), 'utf8'))])),
);
const known = new Set(tables.ua);
let added = 0;

for (const file of inputs) {
	for (const entry of JSON.parse(await readFile(file, 'utf8'))) {
		if (!entry.ua || !entry.en) {
			throw new Error(`${path.basename(file)}: every entry needs "ua" and "en": ${JSON.stringify(entry)}`);
		}

		if (known.has(entry.ua)) {
			continue;
		}

		known.add(entry.ua);
		added++;

		for (const code of codes) {
			tables[code].push(code === 'ua' ? entry.ua : (entry[code] ?? entry.en));
		}
	}
}

for (const code of codes) {
	await writeFile(path.join(i18nDir, `${code}.json`), JSON.stringify(tables[code], null, '\t') + '\n');
}

console.log(`Added ${added} string(s) to ${codes.length} language files.`);
