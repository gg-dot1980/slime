'use strict';
// Bounded request metadata; no bodies, pixels, arbitrary queries or credentials.
function createJournal({instanceId,write=()=>{},clock=()=>new Date().toISOString(),runtime=()=>({}),limit=256}){
  const entries=[];let sequence=0;
  function add(row){const safe={...row,at:clock(),instanceId};entries.push(safe);if(entries.length>limit)entries.shift();write(safe);return safe;}
  function observe(req,res){
    const url=new URL(req.url,'http://localhost');
    let reference=null;try{reference=new URL(req.headers.referer||'');}catch{}
    const load=url.searchParams.get('load')||reference?.searchParams.get('load')||null;
    if(!/^\d{13,24}$/.test(load||'')||!(/^\/candidate\/grow\d+$/.test(url.pathname)||/^\/v\d+\.\d+$/.test(url.pathname)||url.pathname==='/api/versions'))return;
    const common={requestId:++sequence,path:url.pathname,load,probe:url.searchParams.get('probe')==='1',destination:String(req.headers['sec-fetch-dest']||'').slice(0,20)};
    add({type:'request',...common});
    res.on('finish',()=>add({type:'finish',...common,status:res.statusCode,sha256:res.getHeader('x-ocr-sha256')||null}));
    res.on('close',()=>add({type:'close',...common,finished:res.writableFinished}));
  }
  return {observe,lifecycle:(type,details={})=>add({type,...details}),
    snapshot:load=>({instanceId,events:entries.filter(e=>e.load===load),runtime:runtime()})};
}
module.exports={createJournal};
