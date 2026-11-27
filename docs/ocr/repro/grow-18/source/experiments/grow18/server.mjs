import http from 'node:http';
import {readFile,appendFile,mkdir} from 'node:fs/promises';
const dir='experiments/grow18/';await mkdir(dir+'results',{recursive:true});
const uniqueKey=row=>row.kind==='batch_start'?'batch:'+row.batch:['start','final'].includes(row.kind)?row.kind+':'+row.runId:null;
const recorded=new Set();
try{for(const line of (await readFile(dir+'results/events.jsonl','utf8')).split('\n').filter(Boolean)){const key=uniqueKey(JSON.parse(line));if(key)recorded.add(key);}}catch(e){if(e.code!=='ENOENT')throw e;}
const files={'/':['index.html','text/html; charset=utf-8'],'/lab/harness.js':['harness.js','text/javascript; charset=utf-8'],'/lab/planner.js':['planner.js','text/javascript; charset=utf-8'],'/lab/manifest.json':['manifest.json','application/json'],'/lab/results':['results/events.jsonl','application/x-ndjson']};
http.createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/lab/event'&&req.method==='POST'){
   let body='';for await(const chunk of req){body+=chunk;if(body.length>500000)throw Error('Record too large');}
   const row=JSON.parse(body);
   if(!['slot','start','progress','final','batch_start','batch_end','batch_error'].includes(row.kind))throw Error('Invalid kind');
   if(/data:image|base64,|"pixels"\s*:|"rgba"\s*:|__dbg/.test(body))throw Error('Prohibited evidence');
   const key=uniqueKey(row);
   if(key&&recorded.has(key)){res.writeHead(409);res.end('Duplicate identity; reconcile existing record, never replace');return;}
   if(key)recorded.add(key);
   try{await appendFile(dir+'results/events.jsonl',JSON.stringify(row)+'\n');}catch(e){if(key)recorded.delete(key);throw e;}
   res.writeHead(201,{'Content-Type':'application/json'});res.end('{"saved":true}');return;
  }
  const file=files[path];if(!file){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-store'});res.end(await readFile(dir+file[0]));
 }catch(e){res.writeHead(500);res.end(String(e));}
}).listen(Number(process.env.PORT||4173),'0.0.0.0');
