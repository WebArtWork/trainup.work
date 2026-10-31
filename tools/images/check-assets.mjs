import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const catalog = JSON.parse(read('src/data/exercise/exercises.json'));
const products = JSON.parse(read('src/data/store/products.json'));
const company = JSON.parse(read('src/data/company/company.json'));
const lookup = read('src/app/feature/exercise/exercise-images.ts');
const meta = read('src/app/pages/app/app-page-meta.ts');
const titles = meta.match(/const PAGE_TITLES = \{([\s\S]*?)\} as const;/)[1];
const pages = [...titles.matchAll(/^\s*'?([\w-]+)'?:/gm)].map((match) => match[1]);
let checked = 0;

function checkImage(url, expected) {
	const file = path.join(root, 'src/assets', url);
	const bytes = readFileSync(file);
	assert.equal(bytes.readUInt16BE(0), 0xffd8, `${url}: expected JPEG`);
	let offset = 2;
	while (offset < bytes.length) {
		assert.equal(bytes[offset], 0xff, `${url}: invalid JPEG marker`);
		const marker = bytes[offset + 1];
		const length = bytes.readUInt16BE(offset + 2);
		if ([0xc0, 0xc1, 0xc2].includes(marker)) {
			const size = [bytes.readUInt16BE(offset + 7), bytes.readUInt16BE(offset + 5)];
			assert.deepEqual(size, expected, `${url}: unexpected dimensions`);
			checked++;
			return;
		}
		offset += length + 2;
	}
	throw new Error(`${url}: missing JPEG dimensions`);
}

for (const exercise of catalog) {
	assert.equal(exercise.imageUrl, `/exercises/${exercise.id}.jpg`);
	assert.ok(
		lookup.includes(`'/exercises/${exercise.id}.jpg'`),
		`${exercise.id}: missing share lookup`,
	);
	checkImage(exercise.imageUrl, [960, 600]);
	checkImage(`/exercises/male/${exercise.id}.jpg`, [960, 600]);
}
const covers = new Set([
	company.image,
	...Object.values(company.pageSeo).map((page) => page.image),
]);
for (const page of pages) covers.add(`/seo/${page}.jpg`);
for (const url of covers) checkImage(url, [1200, 630]);
for (const product of products) {
	assert.equal(product.image, `/products/${product.id}.jpg`);
	checkImage(product.image, [1200, 900]);
}
console.log(
	`Verified ${catalog.length} exercises × 2 trainers, ${covers.size} page covers, and ${products.length} products (${checked} JPEGs).`,
);
