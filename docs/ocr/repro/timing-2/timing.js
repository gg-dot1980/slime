/* timing-2: optional local diagnostic, no network, pixels or object records retained. */
(function(root){
'use strict';
function create(clock=()=>performance.now(),limit=512){
 let enabled=false,seq=0,lastHash=null,rows=[],dropped=0;
 function add(kind,data={}){if(!enabled)return;const row={kind,at:clock(),seq,...data};if(rows.length===limit){rows.shift();dropped++;}rows.push(row);}
 return {
 enable(on){enabled=!!on;if(on){seq=0;lastHash=null;rows=[];dropped=0;}},
 capture(image,start,end){if(!enabled)return;seq++;let hash=2166136261;for(let i=0;i<image.data.length;i++)hash=Math.imul(hash^image.data[i],16777619)>>>0;
 add('capture',{start,end,signatureChanged:lastHash===null?null:hash!==lastHash,frameIdentity:'pixel-change-only; render time unknown'});lastHash=hash;},
 decision(d){add('decisionComplete',{requestedHeading:{x:d.x,y:d.y},signedScreenDisplacement:null,displacementStatus:'unknown; requires independent background measurement'});},
 dispatch(type,key,send){add('dispatchBefore',{type,key});try{return send();}finally{add('dispatchAfter',{type,key,receiverAcknowledged:false});}},
 stop(){add('stop');},
 snapshot(){return {version:'timing-2',clock:'parent performance.now',enabled,dropped,rows:JSON.parse(JSON.stringify(rows))};}
 };
}
const api={create};if(typeof module!=='undefined')module.exports=api;else root.OCRTiming=api;
})(typeof window==='undefined'?globalThis:window);
