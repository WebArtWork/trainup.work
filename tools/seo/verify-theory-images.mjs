import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'src/data/theory/theories.json'),'utf8'));
const pages=[{route:'/theories',image:'/seo/theories.jpg'},...catalog.theories.map(t=>({route:'/theory/'+t.slug,image:'/seo/theory/'+t.slug+'.jpg'}))];
// Read JPEG SOF dimensions directly so verification needs no optional image dependency.
function dimensions(bytes){
	assert.equal(bytes.readUInt16BE(0),0xffd8,'Not a JPEG');
	let offset=2;
	while(offset<bytes.length){
		assert.equal(bytes[offset++],0xff,'Invalid JPEG marker');
		while(bytes[offset]===0xff)offset++;
		const marker=bytes[offset++];
		if(marker===0xd9||marker===0xda)break;
		if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
		const length=bytes.readUInt16BE(offset);
		assert(length>=2&&offset+length<=bytes.length,'Invalid JPEG segment');
		if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {height:bytes.readUInt16BE(offset+3),width:bytes.readUInt16BE(offset+5)};
		offset+=length;
	}
	throw Error('Missing JPEG dimensions');
}
const hashes=new Set();let totalBytes=0;
for(const page of pages){
	const file=path.join(root,'src/assets',page.image);
	const bytes=fs.readFileSync(file);
	assert.deepEqual(dimensions(bytes),{width:1200,height:630},page.image);
	assert(bytes.length<250000,`Oversized cover: ${page.image}`);
	const hash=createHash('sha256').update(bytes).digest('hex');
	assert(!hashes.has(hash),`Duplicate artwork: ${page.image}`);hashes.add(hash);totalBytes+=bytes.length;
	if(process.argv.includes('--built')){
		const html=fs.readFileSync(path.join(root,'dist/app/browser',page.route,'index.html'),'utf8');
		for(const name of ['og:image','twitter:image']){
			const tag=html.match(new RegExp('<meta[^>]+(?:property|name)="'+name+'"[^>]*>','i'))?.[0];
			assert(tag,`Missing ${name}: ${page.route}`);
			assert(tag.includes('content="https://trainup.work'+page.image+'"'),`Wrong ${name}: ${page.route}: ${tag}`);
		}
		const built=fs.readFileSync(path.join(root,'dist/app/browser',page.image));
		assert(bytes.equals(built),`Built image mismatch: ${page.image}`);
		assert(html.includes('https://trainup.work'+page.route),`Missing canonical: ${page.route}`);
	}
}
console.log(`Verified ${pages.length} distinct 1200x630 JPEG covers (${(totalBytes/1024/1024).toFixed(2)} MiB total)${process.argv.includes('--built')?', published assets and all Open Graph/Twitter image tags':''}.`);
