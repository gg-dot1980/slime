import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {summarize} from './summarize.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const suite=process.argv[2];
if(!['doctor','smoke','regression'].includes(suite)) {console.error('Usage: node scripts/workflow-poc/runner.mjs doctor|smoke|regression');process.exit(2);}
const base=JSON.parse(fs.readFileSync(path.join(root,'scripts/workflow-poc/fixture-lock.json')));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const tests=[];
const check=(name,fn)=>{try{fn();tests.push({name,status:'pass'});}catch(e){tests.push({name,status:'fail',reason:e.code==='ERR_ASSERTION'?'assertion mismatch':String(e.message).replaceAll(root,'<checkout>')});}};
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const replay=()=>{const x=spawnSync(process.execPath,['docs/ocr/repro/r228/replay.cjs'],{cwd:root,encoding:'utf8',timeout:15000,maxBuffer:1024*1024});assert.equal(x.status,0,'replay exit');return JSON.parse(x.stdout);};
const pins=()=>{for(const[f,hash]of Object.entries(base.files))assert.equal(sha(fs.readFileSync(path.join(root,f))),hash,f);};
let observed=null;
if(suite==='doctor'){
 check('Node exact pinned version',()=>assert.equal(process.version,base.node));
 check('Tracked and untracked checkout clean (ignored output allowed)',()=>assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:root,encoding:'utf8'}).trim(),''));
 check('Pinned fixture and source hashes',pins);
 check('No package install required',()=>assert.equal(base.dependencies,'node-standard-library-only'));
 check('Workflow restricted to pull_request and hosted runner',()=>{const t=fs.readFileSync(path.join(root,'.github/workflows/ocr-workflow-poc.yml'),'utf8');assert(t.includes('pull_request:'));assert(t.includes('runs-on: ubuntu-24.04'));assert(t.includes('contents: read'));assert(t.includes('persist-credentials: false'));assert(!t.includes('pull_request_target'));assert(!t.includes('self-hosted'));assert(!t.includes('secrets.'));assert(!/permissions:\s*write-all/.test(t));});
}else if(suite==='smoke'){
 check('Pinned source before execution',pins);
 check('Standalone replay loads and exits within 15 seconds',()=>{observed=replay();assert.equal(observed.fixedFrames,18);assert.equal(observed.newGames,0);});
 check('Expected output matches full replay',()=>assert.deepEqual(observed,read('docs/ocr/repro/r228/results.json')));
}else{
 check('Pinned source before regression',pins);
 observed=replay();const expected=read('docs/ocr/repro/r228/results.json');
 for(let i=0;i<expected.cases.length;i++)check(`r228 ${expected.cases[i].id}`,()=>assert.deepEqual(observed.cases[i],expected.cases[i]));
 check('All 18 frames retained',()=>assert.equal(summarize(observed.cases.map(x=>x.id)).frames,18));
 check('A and B are independent runs: expected 3',()=>assert.equal(summarize(observed.cases.map(x=>x.id)).independentRuns,3));
 check('Empty input has zero runs',()=>assert.deepEqual(summarize([]),{frames:0,independentRuns:0}));
 check('Duplicate sample does not invent a run',()=>assert.equal(summarize(['r1/A/1','r1/A/1']).independentRuns,1));
 check('Invalid ID rejected',()=>assert.throws(()=>summarize(['broken'])));
 check('Non-array rejected',()=>assert.throws(()=>summarize(null)));
 check('No replay-to-live promotion',()=>assert.equal(observed.newGames,0));
}
const failed=tests.filter(x=>x.status==='fail').length;
const report={schemaVersion:1,suite,kind:'offline-replay',status:failed?'fail':'pass',testedCommit:commit,baseCommit:base.baseCommit,fixtureCommit:base.fixtureCommit,environment:{node:process.version,platform:process.platform,arch:process.arch,osRelease:os.release(),browser:null,viewport:null,dpr:null,execution:process.env.GITHUB_ACTIONS==='true'?'github-hosted-ci':'local-clean-checkout'},command:`node scripts/workflow-poc/runner.mjs ${suite}`,samples:{fixedFrames:18,sourceRuns:3,ids:read('docs/ocr/repro/r228/fixed-samples.json').map(x=>x.id),seed:null,seedStatus:'historical-random-unknown'},counts:{assertions:tests.length,passed:tests.length-failed,failed,liveStarts:0,liveWins:0,liveDeaths:0,liveTimeouts:0,liveAborts:0},observedSummary:observed?summarize(observed.cases.map(x=>x.id)):null,exclusions:[],tests,fixtureHashes:base.files,limits:['Not OCR4 live acceptance','No browser or hidden game state','Clean re-execution is not human approval'],at:new Date().toISOString()};
fs.mkdirSync(path.join(root,'.poc-output'),{recursive:true});fs.writeFileSync(path.join(root,'.poc-output',suite+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({suite,commit,status:report.status,...report.counts}));process.exitCode=failed?1:0;
