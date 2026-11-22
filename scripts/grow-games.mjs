// Build-only isolation: keep each version's physics/rendering; disable online persistence.
export function isolateGrowGame(source,version){
 const replacements={api:"async function api(){throw Error('OCR Grow：排行榜與網路停用')}",beginOnlineRun:'async function beginOnlineRun(){return null}',pendingScores:'function pendingScores(){return []}',persistPending:'function persistPending(){}',flushScores:'function flushScores(){return Promise.resolve()}',recordDailyScore:'async function recordDailyScore(){}'};
 let html=source;
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
