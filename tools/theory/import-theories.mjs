// Imports the theory Markdown files from content/theories/NNN.md into app data.
// Usage: node tools/theory/import-theories.mjs [--force]
//
// Writes:
//   src/data/theory/theories.json        language-independent catalog: number, slug, topic
//   src/data/theory/i18n/en.json         English page labels, topics, titles and short versions
//   src/data/theory/i18n/en/NNN.json     English detailed version and sources of one theory
//   src/data/theory/i18n/<lang>.json     + <lang>/NNN.json for every other app language
//
// Other languages start as copies of English, for translators to replace. Existing translated files
// are never overwritten unless --force is passed. English is always regenerated from the Markdown.
import { mkdir, readdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceDir = path.join(root, 'content/theories');
const dataDir = path.join(root, 'src/data/theory');
const i18nDir = path.join(dataDir, 'i18n');
const force = process.argv.includes('--force');

/** Topic blocks from THEORIES.md, in order. `to` is the last theory number in the block. */
const TOPICS = [
	{ id: 'foundations', to: 8, title: 'Training foundations' },
	{ id: 'body', to: 18, title: 'Body and movement' },
	{ id: 'variables', to: 30, title: 'Training variables' },
	{ id: 'patterns', to: 42, title: 'Movement patterns' },
	{ id: 'programming', to: 54, title: 'Program design' },
	{ id: 'equipment', to: 64, title: 'Equipment' },
	{ id: 'space', to: 70, title: 'Space and environment' },
	{ id: 'conditioning', to: 80, title: 'Conditioning' },
	{ id: 'mobility', to: 86, title: 'Warm-up and mobility' },
	{ id: 'recovery', to: 94, title: 'Recovery' },
	{ id: 'safety', to: 104, title: 'Safety and limitations' },
	{ id: 'groups', to: 110, title: 'Specific groups' },
	{ id: 'progress', to: 116, title: 'Progress tracking' },
	{ id: 'myths', to: 120, title: 'Myths' },
];

/** Page labels. `{n}`, `{title}` and `{shown}` are filled in by the app. */
const UI = {
	title: 'Theories',
	intro:
		'Short explanations of how training works: what each idea means, how to use it and what to avoid. Every theory has a short version and a detailed one.',
	disclaimer:
		'These theories are general education, not medical advice. If you have pain, an injury or a health condition, ask a doctor or physiotherapist before you change your training.',
	searchLabel: 'Search theories',
	searchPlaceholder: 'Search by title or idea',
	topicLabel: 'Topic',
	allTopics: 'All topics',
	count: '{shown} of {n} theories',
	empty: 'No theories match your search.',
	reset: 'Show all theories',
	short: 'In short',
	readMore: 'Read more',
	readLess: 'Show less',
	sources: 'Sources',
	previous: 'Previous',
	next: 'Next',
	backToList: 'All theories',
	inTopic: 'More in {title}',
	notFound: 'This theory was not found.',
};

const files = (await readdir(sourceDir)).filter((f) => /^\d{3}\.md$/.test(f)).sort();
const catalog = [];
const en = { ui: UI, topics: {}, theories: {} };
const bodies = {};
const slugs = new Set();

for (const topic of TOPICS) {
	en.topics[topic.id] = topic.title;
}

for (const file of files) {
	const theory = parseTheory(await readFile(path.join(sourceDir, file), 'utf8'), file);
	const topic = TOPICS.find((t) => theory.n <= t.to);

	if (Number(file.slice(0, 3)) !== theory.n) {
		throw new Error(`${file}: heading number ${theory.n} does not match the file name`);
	}
	if (slugs.has(theory.slug)) {
		throw new Error(`${file}: duplicate slug ${theory.slug}`);
	}
	slugs.add(theory.slug);

	catalog.push({ n: theory.n, slug: theory.slug, topic: topic.id });
	en.theories[theory.n] = { title: theory.title, short: theory.short };
	bodies[file.slice(0, 3)] = { sections: theory.sections, sources: theory.sources };
}

const languages = (await readdir(path.join(root, 'src/i18n')))
	.filter((f) => f.endsWith('.json'))
	.map((f) => f.slice(0, -5));

await mkdir(dataDir, { recursive: true });
await writeJson(path.join(dataDir, 'theories.json'), {
	topics: TOPICS.map((t) => t.id),
	theories: catalog,
});

let copied = 0;
for (const lang of ['en', ...languages.filter((l) => l !== 'en')]) {
	const overwrite = lang === 'en' || force;
	await mkdir(path.join(i18nDir, lang), { recursive: true });
	copied += await writeOnce(path.join(i18nDir, `${lang}.json`), en, overwrite);
	for (const [id, body] of Object.entries(bodies)) {
		copied += await writeOnce(path.join(i18nDir, lang, `${id}.json`), body, overwrite);
	}
}

console.log(
	`Imported ${catalog.length} theories in ${TOPICS.length} topics; wrote ${copied} file(s) for ${languages.length} language(s).`,
);

function parseTheory(markdown, file) {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const heading = lines[0].match(/^## (\d+)\. (.+)$/);
	if (!heading) {
		throw new Error(`${file}: first line must be "## N. Title"`);
	}

	const blocks = { short: [], detailed: [] };
	let current = null;
	for (const line of lines.slice(1)) {
		if (line === '### EN: Short') current = 'short';
		else if (line === '### EN: Detailed') current = 'detailed';
		else if (line.startsWith('#')) throw new Error(`${file}: unexpected heading "${line}"`);
		else if (current && line.trim()) blocks[current].push(line.trim());
	}

	if (blocks.short.length !== 1) {
		throw new Error(`${file}: the short version must be exactly one paragraph`);
	}

	const sections = [];
	let sources = [];
	for (const paragraph of blocks.detailed) {
		const sourceLine = paragraph.match(/^\*\*Sources:\*\*\s*(.+)$/);
		if (sourceLine) {
			sources = [...sourceLine[1].matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => ({
				label: plain(m[1]),
				url: m[2],
			}));
			continue;
		}
		const section = paragraph.match(/^\*\*(.+?)\*\*\s*(.+)$/);
		if (!section) {
			throw new Error(`${file}: detailed paragraph must start with a bold heading: ${paragraph.slice(0, 60)}`);
		}
		sections.push({ title: plain(section[1]).replace(/[.:]$/, ''), text: plain(section[2]) });
	}

	if (!sections.length || !sources.length) {
		throw new Error(`${file}: detailed version needs sections and sources`);
	}

	const title = plain(heading[2]);
	return { n: Number(heading[1]), title, slug: slugify(title), short: plain(blocks.short[0]), sections, sources };
}

/** Text is rendered as plain text. Enforces tools/theory/STYLE.md: no Markdown, em dashes or straight quotes. */
function plain(text) {
	if (/\*\*|\]\(|`|<[a-z/]/i.test(text)) {
		throw new Error(`Unexpected Markdown or HTML in: ${text.slice(0, 80)}`);
	}
	if (text.includes('—')) {
		throw new Error(`Em dash (house style forbids it) in: ${text.slice(0, 80)}`);
	}
	if (/['"]/.test(text)) {
		throw new Error(`Straight quote (use ’ “ ”) in: ${text.slice(0, 80)}`);
	}
	return text.trim();
}

function slugify(title) {
	return title
		.toLowerCase()
		.replace(/[’']/g, '')
		.replace(/\([^)]*\)/g, (m) => m.slice(1, -1))
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

async function writeOnce(file, value, overwrite) {
	if (!overwrite) {
		try {
			await access(file);
			return 0;
		} catch {
			// missing: write the English copy
		}
	}
	await writeJson(file, value);
	return 1;
}

async function writeJson(file, value) {
	await writeFile(file, JSON.stringify(value, null, '\t') + '\n');
}
