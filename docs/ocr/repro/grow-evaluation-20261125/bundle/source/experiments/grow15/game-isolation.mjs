// Build-only isolation: keep each version's physics/rendering; disable online persistence.
export function isolateGrowGame(source,version){
 const replacements={api:"async function api(){throw Error('OCR Grow：排行榜與網路停用')}",beginOnlineRun:'async function beginOnlineRun(){return null}',pendingScores:'function pendingScores(){return []}',persistPending:'function persistPending(){}',flushScores:'function flushScores(){return Promise.resolve()}',recordDailyScore:'async function recordDailyScore(){}'};
 let html=growMapVisualCompatibility(source,version);
 for(const [name,replacement] of Object.entries(replacements)){
  const re=new RegExp('^(?:async )?function '+name+'\\([^\\n]*$','gm');const matches=html.match(re);if(matches?.length!==1)throw Error('Unsupported isolation source: '+version+' '+name);html=html.replace(re,replacement);
 }
 html=html.replace('<head>',`<head><meta name="ocr-grow-version" content="${version}"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">`).replace(/<link rel="icon"[^>]*>/g,'').replaceAll('slimeArena','ocrGrow'+version.replaceAll('.','_')+'Arena').replace('</body>','<style>#openLeaderboard,#leaderboard{display:none!important}</style></body>');
 if(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|slimePendingScores/.test(html))throw Error('Unexpected network/pending persistence: '+version);
 return html;
}
export function makeGrowBundle(games,current){
 const versions=Object.keys(games).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true}));
 const entries=Object.fromEntries(versions.map(v=>['/'+v,{version:v,html:isolateGrowGame(games[v],v)}]));entries['/']=entries['/'+current];
 return {entries,options:[{value:'/',label:'目前版本（'+current+'）'},...versions.map(v=>({value:'/'+v,label:v+(v===current?'（目前版本）':'')}))]};
}

// Grow-only visual compatibility: camera bounds below NPC markers and neutral color.
// No new marker, hidden controller input, geometry or game physics change.
export function growMapVisualCompatibility(source,version){
 const loop="for(const s of slimes){ctx.beginPath();ctx.arc(mx+s.x/W*miniW,my+s.y/H*miniH,Math.max(1.2,Math.min(3,s.r/38)),0,7);ctx.fillStyle=s.r>player.r*1.12?'#ff8a7e':'#d3eee1';ctx.fill()}";
 const camera="ctx.fillStyle='#a3f3d116';ctx.fillRect(vx,vy,vwMini,vhMini);ctx.strokeStyle='#a3f3d1';ctx.lineWidth=2;ctx.strokeRect(vx,vy,vwMini,vhMini);";
 if(source.split(loop).length!==2||source.split(camera).length!==2)throw Error('Unverified Grow map rendering: '+version);
 return source.replace(loop,'').replace(camera,camera.replaceAll('#a3f3d116','#8ba3aa16').replaceAll("'#a3f3d1'","'#8ba3aa'")+loop);
}
