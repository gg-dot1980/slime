import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const current=(await import('../dist/server/index.js')).default;
let old=execFileSync('git',['show','135d9db56ef98685ecf08061e3e016a7dd371f8c:dist/server/index.js'],{maxBuffer:50*1024*1024}).toString();const before=(await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'))).default;
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),paths=['/','/v2.13','/v2.20','/v2.21','/v2.22','/ocr','/ocr3','/ocr4','/ocr-test','/api/versions'];let checks=[];
const env={get DB(){throw Error('Unexpected DB access')}};
for(const path of paths){const req=new Request('https://test.invalid'+path);const a=await before.fetch(req,env),b=await current.fetch(req,env);assert.equal(a.status,b.status);let x=await a.text(),y=await b.text();assert.equal(hash(x),hash(y));checks.push({path,status:b.status,hash:hash(y)});}
for(const path of ['/ocr-grow','/ocr-grow/']){const r=await current.fetch(new Request('https://test.invalid'+path),env);assert.equal(r.status,200);const h=await r.text();assert(h.includes('OCR Grow · grow-1'));assert(!h.includes('__GROW_GAME_HTML__'));assert(h.includes("connect-src 'none'"));}
fs.writeFileSync('grow-route-results.json',JSON.stringify({unchanged:checks,newRoutes:2,dbAccess:0},null,2));console.log(JSON.stringify({unchangedRoutes:checks.length,newRoutes:2,dbAccess:0}));
