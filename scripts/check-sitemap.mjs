import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import current from '../dist/server/index.js';
const baseline=process.argv[2];
const env=new Proxy({}, {get(){throw new Error('Unexpected environment access')}});
const get=(w,p,method='GET')=>w.fetch(new Request('https://slime.gameson.cc'+p,{method}),env,{});
const s=await get(current,'/sitemap.xml');assert.equal(s.status,200);assert.match(s.headers.get('content-type'),/^application\/xml/);const xml=await s.text();
const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,10);assert.equal(new Set(urls).size,10);assert(!xml.includes('lastmod'));
for(const u of urls){const x=new URL(u);assert.equal(x.origin,'https://slime.gameson.cc');assert(!/api|ocr-test|ocr-grow|ocr4/.test(x.pathname));const r=await get(current,x.pathname);assert.equal(r.status,200);assert(!/noindex/i.test(r.headers.get('x-robots-tag')||''));const html=await r.text();assert(!/<meta[^>]+noindex/i.test(html));}
assert.equal(await (await get(current,'/robots.txt')).text(),'Sitemap: https://slime.gameson.cc/sitemap.xml\n');assert.equal(await (await get(current,'/sitemap.xml','HEAD')).text(),'');
let unchanged=0;if(baseline){const code=execFileSync('git',['show',baseline+':dist/server/index.js'],{encoding:'utf8',maxBuffer:20e6});const old=(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default;for(const p of [...urls.map(u=>new URL(u).pathname),'/ocr-test','/ocr-grow','/ocr4','/v2.22','/controller.html']){const a=await get(old,p),b=await get(current,p);assert.equal(a.status,b.status);assert.deepEqual([...a.headers],[...b.headers]);assert.equal(await a.text(),await b.text());unchanged++;}}
console.log(JSON.stringify({sitemapUrls:urls.length,unchangedRoutes:unchanged,environmentAccess:0,result:'pass'}));
