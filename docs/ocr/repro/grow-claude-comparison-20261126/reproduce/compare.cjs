'use strict';
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {hash,games,pages,modes,seeds,withSources}=require('./sources.cjs');
const {createCanvas}=require('@napi-rs/canvas');
const canvasVersion=require('@napi-rs/canvas/package.json').version;
const expectedBitmap={
  standard:'fce3c7ddcb411059b4e8161b0e54c620e5752e8a59b094f92671d454826e95d7',
  qhd:'41f6ae4e6e623e91ae892637094fefe41fdf039196e9b6f4a990e2fff23b3cfa',
};
const expectedOutcomes={
  standard:'e8b84d30073cf8c29a9a835a3698af84977b4344c4843d9852455ec199503e75',
  qhd:'9d3af3ed31188d3bcbc6ffc3b570f6fde42cda60b9eaefd899f7ad8df7ca682d',
};
// Each tuple lists wins, deaths and deadlines, first v2.13, then v2.22.
const expectedCounts={
  standard:{Grow42:[[0,1,1],[0,1,1]],Claude22:[[0,0,2],[0,0,2]],ClaudeDefault:[[0,1,1],[0,2,0]],
    LiveGrow26:[[0,0,2],[0,2,0]],LiveClaudeDefault:[[0,1,1],[0,2,0]],LiveClaude21:[[0,0,2],[0,1,1]]},
  qhd:{Grow38:[[2,0,0],[1,0,1]],Claude22:[[0,1,1],[0,1,1]]},
};
const versions=Object.keys(games);
function fontProbe(){
  const ctx=createCanvas(260,42).getContext('2d');
  ctx.fillStyle='#101a17';ctx.fillRect(0,0,260,42);ctx.fillStyle='#d3eee1';
  ctx.font='600 12px system-ui';ctx.fillText('SLIME ARENA 史萊姆 219',4,18);
  ctx.font='10px system-ui';ctx.fillText('NPC v2.22',4,35);
  return hash(ctx.getImageData(0,0,260,42).data);
}
function collect(mode, work){
  const names=modes[mode];
  const counts=Object.fromEntries(names.map(name=>[name,Object.fromEntries(versions.map(v=>
    [v,{starts:0,wins:0,deaths:0,deadlines:0}]))]));
  const firstFrames=[], outcomeRows=[];
  for (const seed of seeds) for (const version of versions){
    const block=new Set();
    for (const arm of names){
      const result=execFileSync(process.execPath,['--expose-gc',path.join(__dirname,'simulate.cjs'),work,mode,arm,version,String(seed)],{encoding:'utf8'});
      const row=JSON.parse(result);
      if(row.mode!==mode||row.arm!==arm||row.version!==version||row.seed!==seed)throw Error('wrong slot');
      block.add(row.initialPixelsSha256);
      outcomeRows.push(JSON.stringify([arm,version,seed,row.outcome,row.displaySeconds,row.size]));
      const totals=counts[arm][version];
      if(!['wins','deaths','deadlines'].includes(row.outcome))throw Error('unexpected outcome');
      totals.starts++;totals[row.outcome]++;
    }
    if(block.size!==1)throw Error(`initial picture differed between matching arms for ${version} seed ${seed}`);
    firstFrames.push([...block][0]);
  }
  const rasterFingerprint=hash(firstFrames.join('\n')+'\n');
  const referenceCountsMatch=names.every(arm=>versions.every((version,i)=>{
    const t=counts[arm][version];
    return t.starts===2&&[t.wins,t.deaths,t.deadlines].every((n,j)=>n===expectedCounts[mode][arm][i][j]);
  }));
  const referenceRasterMatches=rasterFingerprint===expectedBitmap[mode];
  const outcomesFingerprint=hash(outcomeRows.join('\n')+'\n');
  const referenceOutcomesMatch=outcomesFingerprint===expectedOutcomes[mode];
  console.log(JSON.stringify({mode,seeds,counts,rasterFingerprint,outcomesFingerprint,referenceRasterMatches,
    referenceCountsMatch,referenceOutcomesMatch},null,2));
  if(!referenceRasterMatches||!referenceCountsMatch||!referenceOutcomesMatch)process.exitCode=2;
}
const mode=process.argv[2]||'--check';
if(mode!=='--check'&&!Object.hasOwn(modes,mode))throw Error('usage: node compare.cjs [--check|standard|qhd]');
if(canvasVersion!=='0.1.100')throw Error('requires @napi-rs/canvas@0.1.100');
withSources(work=>{
  if(mode==='--check'){
    console.log(JSON.stringify({starts:0,node:process.version,canvas:canvasVersion,platform:process.platform,
      fontProbe:fontProbe(),fontProbeMatchesReference:fontProbe()==='9b87adc1be07a526bdcb657eaca9815c076e58a00f0864d62104d31a999c86de',seeds,sourcesVerified:Object.keys(pages),gameVersions:versions,modes},null,2));
  }else collect(mode,work);
});
