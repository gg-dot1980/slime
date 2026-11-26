'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {build,hash,PARENT_SHA}=require('./build-candidate.cjs');
const {cases}=require('./fixtures.cjs');
const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
const parent=read('../grow-46-public/ocr-grow46.html'),candidate=read('ocr-grow47.html');
assert.equal(hash(parent),PARENT_SHA);assert.equal(build(),candidate);
function part(s,start,end){const a=s.indexOf(start),b=s.indexOf(end,a);assert(a>=0&&b>a);return s.slice(a,b);}
const common=part(parent,'function planGrow23(','if (typeof module');
assert.equal(part(candidate,'function planGrow23(','if (typeof module'),common,'whole v2.13 planner unchanged');
assert.equal(part(parent,'<script>','function planHunt46('),part(candidate,'<script>','// Grow47 applies Claude22'),
  'all perception, shared control helpers and chase evidence before the changed planner unchanged');
for(const m of candidate.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(m[1]);
function load(s,name) {
  let captured=null,section=part(s,'function chaseEvidence46(','let totals46=');
  const needle='  const target = chosen.target && {...chosen.target};';
  assert.equal(section.split(needle).length,2);
  section=section.replace(needle,'  capture({paths,safe,bounded,chosen,escaping});\n'+needle);
  const decide=new Function('capture',common+section+'\nreturn '+name)(x=>{captured=x;});
  return {run(args){captured=null;const decision=decide(...args);return {decision,captured};}};
}
const old=load(parent,'planGrow46'),next=load(candidate,'planGrow47');
const helper=new Function(read('wall-score.js')+'\nreturn {wallEvidence47,observeWall47};')();
const excerpt=read('claude22-wall-source.txt');
assert(excerpt.includes('if(wd<0){score-=400;break;}if(wd<150)score-=(150-wd)*.6/(t+.3);'));
assert(excerpt.includes('if(wd<600)score-=(600-wd)*.04;'));
function sourceCost(clearances) {
  // Execute the two exact statements from the saved upstream source. The input
  // trajectory is synthetic; this is not a Claude controller or renderer replay.
  const body=excerpt.match(/if\(\(opts\.v2\|\|opts\.wallOnly\)&&worldPos\)\{const wd=([^\n]+)\n/)[0];
  const terminal=excerpt.split('\n').find(l=>l.includes('if(opts.wallOnly&&!opts.v2&&ex!==null&&worldPos)'));
  const evaluate=new Function('values',
    'const opts={wallOnly:true,v2:false},worldPos={x:5000,y:3600},r=96;let score=0,x=0,y=0,ex=null,ey=null;'+
    'for(let k=1;k<=15;k++){let t=k*.1;x=10400-worldPos.x-r-values[k-1];if(k===15){ex=x;ey=y;}'+body+'}'+terminal+';return -score||0;');
  return evaluate(clearances);
}
const formulaCases=[
  {id:'at-600',values:Array(15).fill(600)},
  {id:'below-600',values:Array(15).fill(599)},
  {id:'at-150',values:Array(15).fill(150)},
  {id:'below-150',values:Array(15).fill(149)},
  {id:'constant-100',values:Array(15).fill(100)},
  {id:'at-zero',values:Array(15).fill(0)},
  {id:'cross-on-step-1',values:Array(15).fill(-1)},
  {id:'cross-on-step-15',values:[...Array(14).fill(600),-1]},
];
const formula=formulaCases.map(c=>{
  const walls=[5000,5400,3600,3600],state=helper.wallEvidence47(walls,96,true);
  for(let k=1;k<=22;k++)helper.observeWall47(state,walls,96,5400-96-c.values[Math.min(k,15)-1],0,k);
  const upstream=sourceCost(c.values);assert.equal(state.penalty,upstream,c.id);
  return {id:c.id,...state,upstreamPenalty:upstream};
});
assert.equal(helper.wallEvidence47([1,2,3,Infinity],96,true),null);
assert.equal(helper.wallEvidence47([100,100,100,100],96,false),null);
const plain=decision=>{
  const {wall47,wallTracking47,...rest}=decision;
  const {preWallFirst,preWallSecond,...tracking46}=rest.tracking46||{};
  return {...rest,strategy:'grow-46',...(rest.tracking46?{tracking46}:{} )};
};
function summarize(d){return {first:d.first??null,second:d.second??null,escaping:d.escaping,mapStatus:d.mapStatus,
  gain:d.gain,score:d.score??null,discountedGain:d.discountedGain??null,clearance:d.clearance,
  threats:d.threats,target:d.target?{x:d.target.x,y:d.target.y,r:d.target.r,npc:d.target.npc,mapOnly:!!d.target.mapOnly}:null,
  wall47:d.wall47??null,wallTracking47:d.wallTracking47??null,tracking46:d.tracking46??null};}
let pathChecks=0,otherVersionChecks=0;
const results=[];
for(const c of cases){
  const r=c.r||96,velocity=c.velocity||{x:0,y:0};let heading={x:1,y:0},now=0;
  const args=(version='v2.22')=>[c.objects,r,c.map,300,velocity,heading,version,now,false];
  if(c.parentWarmup)for(let k=0;k<c.parentWarmup;k++){now=k*100;heading=old.run(args()).decision;}
  now=c.parentWarmup?c.parentWarmup*100:0;
  const p=old.run(args()),n=next.run(args());
  assert.equal(n.decision.escaping,p.decision.escaping,c.id+' hard safety branch unchanged');
  assert.equal(n.decision.mapStatus,p.decision.mapStatus);
  if(p.captured){
    assert.equal(n.captured.paths.length,64);assert.equal(n.captured.safe.length,p.captured.safe.length);
    for(const pp of p.captured.paths){
      const np=n.captured.paths.find(q=>q.first===pp.first&&q.second===pp.second);
      const {wall47,score,...other}=np;
      const {score:parentScore,...parentOther}=pp;
      assert.deepEqual(other,parentOther,c.id+' per-path original geometry, gain, risk and hazards');
      const deducted=p.captured.safe.includes(pp)?wall47?.penalty||0:0;
      assert.equal(score,parentScore-deducted,c.id+' safe-only wall deduction');pathChecks++;
    }
    const t=n.decision.wallTracking47;
    assert.equal(t.baselineFirst,p.decision.first);assert.equal(t.baselineSecond,p.decision.second);
    assert.equal(n.decision.tracking46.firstChanged,p.decision.tracking46.firstChanged);
    assert.equal(n.decision.tracking46.routeChanged,p.decision.tracking46.routeChanged);
  }
  if(c.expect==='open'||c.expect==='inactive'||c.expect==='map-world-source'||c.expect==='lost'||c.expect==='escape')
    assert.deepEqual(plain(n.decision),p.decision,c.id+' baseline behavior');
  if(c.expect==='escape')assert.equal(n.decision.escaping,true);
  if(c.expect==='two-stages'){
    assert.equal(p.decision.tracking46.stagnant,2);
    assert(p.decision.tracking46.discountedPaths>0);
    assert(n.decision.wallTracking47.scoredPaths>0);
  }
  for(const version of ['v2.13','v2.20','v2.21']){
    assert.deepEqual(next.run(args(version)).decision,old.run(args(version)).decision,c.id+' '+version);
    otherVersionChecks++;
  }
  results.push({id:c.id,input:{objects:c.objects,r,map:c.map,speed:300,velocity,heading,now,npcToast:false},
    parent:summarize(p.decision),candidate:summarize(n.decision),
    gainDelta:n.decision.gain-p.decision.gain,firstChanged:n.decision.first!==p.decision.first,
    routeChanged:n.decision.first!==p.decision.first||n.decision.second!==p.decision.second});
}
assert(candidate.indexOf("if(d.mapStatus==='lost')release();else move(d);")<candidate.indexOf('totals47.applied++'));
assert(candidate.includes('stop(false);totals46=null;totals47=null;runGameVersion=loadedVersion;'));
const report={kind:'synthetic-controller-mechanism',naturalStarts:0,browserStarts:0,serverStarts:0,
  parentSha256:hash(parent),candidateSha256:hash(candidate),fixtureSha256:hash(read('fixtures.cjs')),
  runtime:process.version,platform:process.platform,arch:process.arch,
  counts:{formulaCases:formula.length,plannerCases:results.length,pathChecks,otherVersionChecks,
    firstChanged:results.filter(r=>r.firstChanged).length,routeChanged:results.filter(r=>r.routeChanged).length,
    lowerPredictedGain:results.filter(r=>r.gainDelta<0).length},formula,results};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(__dirname,'mechanism-results.json'),JSON.stringify(report,null,2)+'\n');
else assert.deepEqual(JSON.parse(read('mechanism-results.json')),report);
console.log(JSON.stringify({candidateSha256:report.candidateSha256,counts:report.counts,
  outcomes:results.map(r=>({id:r.id,parent:[r.parent.first,r.parent.second],candidate:[r.candidate.first,r.candidate.second],
    gainDelta:r.gainDelta,penalty:r.candidate.wallTracking47?.chosenPenalty||0,escaping:r.candidate.escaping}))},null,2));
