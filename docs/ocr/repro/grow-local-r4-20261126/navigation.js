'use strict';
// Public document/transport evidence only. This module never clicks Start.
(function(root){
  const fail=(code,message)=>Object.assign(new Error(message),{code});
  function sourceIdentity(headers,expected){
    if(headers.get('x-ocr-instance')!==expected.instanceId)throw fail('server-instance-changed','Source response came from a different server instance');
    if(headers.get('x-ocr-sha256')!==expected.sha256)throw fail('source-header-mismatch','Source response hash header differs from frozen candidate');
    if(!/^text\/html\b/i.test(headers.get('content-type')||''))throw fail('source-content-type','Candidate response is not HTML');
  }
  async function probe(url,expected,fetcher=fetch,digest=bytes=>crypto.subtle.digest('SHA-256',bytes)){
    const response=await fetcher(url+'&probe=1',{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(6000)});
    if(!response.ok)throw fail('source-http-error','Candidate source preflight HTTP '+response.status);
    sourceIdentity(response.headers,expected);
    const bytes=await response.arrayBuffer(),sha=Array.from(new Uint8Array(await digest(bytes)),b=>b.toString(16).padStart(2,'0')).join('');
    if(sha!==expected.sha256)throw fail('source-bytes-mismatch','Candidate response bytes differ from the frozen source');
    return {status:response.status,bytes:bytes.byteLength,sha256:sha,instanceId:expected.instanceId};
  }
  function attach({document,old,expected,setFrame,record,now=()=>performance.now()}){
    const fresh=document.createElement('iframe');fresh.id=old.id;fresh.title=old.title;
    const events=[];
    const note=type=>{let url=null,state=null,error=null;try{url=fresh.contentDocument?.URL||null;state=fresh.contentDocument?.readyState||null;}catch(e){error=String(e.message).slice(0,300);}
      if(events.length<12)events.push({type,at:now(),url,readyState:state,...(error?{error}:{})});};
    fresh.addEventListener('load',()=>note('load'));
    fresh.addEventListener('error',()=>note('error'));
    // Avoid connecting an iframe with an initially empty src. Event observers
    // precede both the assignment and insertion; no reload or silent retry.
    fresh.src=expected;note('src-before-insert');
    setFrame(fresh);old.replaceWith(fresh);note('inserted');record.events=events;
    return fresh;
  }
  function committed(frame,expected,events){
    if(events.some(e=>e.type==='error'))throw fail('iframe-error-event','Candidate iframe emitted an error event');
    const doc=frame.contentDocument;
    if(doc?.URL&&doc.URL!=='about:blank'&&doc.URL!==expected)throw fail('unexpected-document','Candidate committed an unexpected document URL');
    return !!doc&&doc.URL===expected&&doc.readyState==='complete'&&events.some(e=>e.type==='load'&&e.url===expected);
  }
  function verifyNavigation(proof,expected){
    if(proof.instanceId!==expected.instanceId)throw fail('server-instance-changed','Navigation diagnostic came from a different server instance');
    const rows=proof.events.filter(e=>e.path==='/candidate/'+expected.candidate&&e.load===expected.load);
    if(rows.some(e=>e.instanceId!==expected.instanceId))throw fail('server-instance-changed','Request evidence has a different server instance');
    const nav=rows.filter(e=>e.destination==='iframe'&&e.probe===false),probe=rows.filter(e=>e.probe===true);
    const request=nav.filter(e=>e.type==='request'),completed=nav.filter(e=>e.type==='finish');
    const probeRequest=probe.filter(e=>e.type==='request'),probeFinish=probe.filter(e=>e.type==='finish');
    const pair=(r,f)=>r.length===1&&f.length===1&&r[0].requestId===f[0].requestId&&f[0].status===200&&f[0].sha256===expected.sha256;
    if(!pair(request,completed)||!pair(probeRequest,probeFinish)||request[0].requestId===probeRequest[0].requestId)
      throw fail('navigation-http-unverified','Actual candidate navigation lacks one matching HTTP 200/source-hash response and separate source probe');
    if(rows.some(e=>e.type==='close'&&e.finished!==true&&(e.destination==='iframe'||e.probe===true)))throw fail('navigation-response-aborted','Candidate response closed before completion');
    return {requestId:completed[0].requestId,status:200,sha256:completed[0].sha256,instanceId:proof.instanceId};
  }
  function verifyGeometry(candidate,g,mode=candidate==='grow38'?'fhd':'native'){
    const q=g.canvas[0]/g.canvasCss[0],w=g.canvas[0],width=Math.min(144*q,w*.26),x=w-width-15*q,y=70*q;
    const map={analysisRatio:q,origin:[x,y],fractionalOrigin:[x-Math.floor(x),y-Math.floor(y)]};
    const size=(actual,w,h)=>actual?.[0]===w&&actual?.[1]===h;
    if(mode==='native'&&['grow24','grow25','grow26'].includes(candidate))return map;
    const plain=g.deviceScaleFactor===1&&g.gameDpr===1&&g.gameTransform==='none'&&g.canvasTransform==='none'&&size(g.canvasCss,...g.canvas);
    if(mode==='native'){
      if(!plain||!size(g.canvas,958,557)||x!==799||y!==70)throw fail('grow27-geometry-unsupported','Native mode requires actual Canvas/CSS 958x557, DPR1 and no transforms');
    }else if(mode==='fhd'||mode==='qhd'){
      const qhd=mode==='qhd';
      if(!plain||!size(g.outer,...(qhd?[2560,1440]:[1920,1080]))||!(qhd?size(g.canvas,2250,1308):g.canvas[0]>=1600))
        throw fail('wide-geometry-unsupported','Wide viewport, native canvas or DPR differs from the selected desktop mode');
    }else throw fail('geometry-unknown','Unknown geometry mode');
    return map;
  }
  const api={sourceIdentity,probe,attach,committed,verifyNavigation,verifyGeometry};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GrowNavigation=api;
})(typeof window==='undefined'?globalThis:window);
