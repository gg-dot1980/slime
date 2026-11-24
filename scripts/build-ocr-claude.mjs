// Standalone static build for the ocr-claude experiment. Reads existing sources
// read-only and writes site/ocr-claude/index.html; does not touch dist/ or the Worker.
import {makeGrowBundle} from './grow-games.mjs';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
const html=await readFile('src/game.html','utf8'),current=html.match(/SLIME ARENA · (v[\d.]+)/)[1];
const games={};
for(const file of await readdir('src')){const m=file.match(/^game-(v[\d.]+)\.html$/);if(m)games[m[1]]=await readFile('src/'+file,'utf8');}
games[current]=html;
const page=(await readFile('src/ocr-claude.html','utf8')).replace('__GROW_GAMES__',JSON.stringify(makeGrowBundle(games,current)).replaceAll('<','\\u003c'));
const out=process.argv[2]||'site/ocr-claude';
await mkdir(out,{recursive:true});await writeFile(out+'/index.html',page);
console.log(JSON.stringify({out:out+'/index.html',bytes:Buffer.byteLength(page),versions:Object.keys(games).sort()}));
