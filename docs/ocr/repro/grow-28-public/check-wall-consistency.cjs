'use strict';
// Two bounded follow-up cases: keep the NPC body inside the observed south wall.
// The original 60-case matrix is retained unchanged, including its inconsistent
// observed wall/body geometry. These are public synthetic numbers, not snapshots.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {build,plannerText,hash}=require('./build-candidate.cjs');
const {fixtures}=require('./make-fixtures.cjs');
const {compile}=require('./check-visible-progress.cjs');
const {parent,candidate,manifest}=build();
const before=compile(plannerText(parent),true),after=compile(plannerText(candidate),true);
let assertions=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);assertions++;};
const rows=[];
for(const version of ['v2.13','v2.22']){
  const base=fixtures().cases.find(c=>c.name==='visible-npc-south-wall'&&c.input.gameVersion===version);
  const input=JSON.parse(JSON.stringify(base.input));input.objects[0].y=160;
  assert(input.objects[0].y+input.objects[0].r<=input.map.visibleWalls[3]);assertions++;
  const a=before(input,base.clock),b=after(input,base.clock);
  const core=d=>({trajectory:d.audit.map(p=>p.trajectory),captures:d.audit.map(p=>p.captures),
    safety:d.paths.map(({score,approach,target,...rest})=>rest)});
  eq(core(a.diagnostic),core(b.diagnostic),'64 path dynamics/capture/safety invariants '+version);
  eq(a.output.escaping,b.output.escaping,'escape availability '+version);
  const target=input.objects[0],d0=a.output.x*target.x+a.output.y*target.y,d1=b.output.x*target.x+b.output.y*target.y;
  rows.push({id:'consistent-south-wall-'+version,input,clock:base.clock,parentOutput:a.output,candidateOutput:b.output,
    directionChanged:a.output.first!==b.output.first,parentInitialTargetDot:d0,candidateInitialTargetDot:d1,
    invariantPaths:64,invariantTrajectorySha256:hash(JSON.stringify(core(a.diagnostic))),
    parentSelectedFirstSegment:a.diagnostic.audit.find(p=>p.first===a.output.first&&p.second===a.output.second).trajectory[5],
    candidateSelectedFirstSegment:b.diagnostic.audit.find(p=>p.first===b.output.first&&p.second===b.output.second).trajectory[5]});
}
const output={schemaVersion:1,kind:'two explicit wall/body-consistent follow-up fixtures; original matrix unchanged',
  reason:'The original south-wall fixture has target y210+r45>wall225 and therefore represents inconsistent observed geometry. These variants change only y to160; both remain in the public record.',
  parentSha256:manifest.parent.sha256,candidateSha256:manifest.candidateSha256,assertions,plannerCalls:4,browserRuns:0,naturalStarts:0,rows,
  maxRssKiB:process.resourceUsage().maxRSS};
assert(output.maxRssKiB<=192*1024,'RSS budget');
if(process.argv.includes('--write'))fs.writeFileSync(path.join(__dirname,'wall-consistency-results.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...output,rows:rows.map(r=>({id:r.id,before:r.parentOutput.name,after:r.candidateOutput.name,
  parentInitialTargetDot:r.parentInitialTargetDot,candidateInitialTargetDot:r.candidateInitialTargetDot,gain:r.candidateOutput.gain}))},null,2));
