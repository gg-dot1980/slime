import {readFile,readdir,mkdir,writeFile,cp,rm} from 'node:fs/promises';
const html=await readFile('src/game.html','utf8'),current=html.match(/SLIME ARENA · (v[\d.]+)/)[1];
const games={};
for(const file of await readdir('src')){const match=file.match(/^game-(v[\d.]+)\.html$/);if(match)games[match[1]]=await readFile('src/'+file,'utf8');}
games[current]=html;
const versions=Object.keys(games).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true})).map(version=>({version,path:'/'+version,current:version===current}));
const manifest={currentVersion:current,currentPath:'/',versions};
let worker=await readFile('src/worker.js','utf8');
for(const [token,value] of [['__GAME_HTML__',html],['__GAMES__',games],['__VERSIONS__',manifest],['__CONTROLLER_HTML__',await readFile('src/controller.html','utf8')],['__RELEASE_HTML__',await readFile('src/release.html','utf8')],['__OCR1_HTML__',await readFile('src/ocr1.html','utf8')],['__OCR_HTML__',await readFile('src/ocr.html','utf8')],['__OCR_TEST_HTML__',await readFile('src/ocr-test.html','utf8')],['__OCR3_HTML__',await readFile('src/ocr3.html','utf8')],['__OCR2_HTML__',await readFile('src/ocr2.html','utf8')]])worker=worker.replace(token,JSON.stringify(value));
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',worker);
await cp('.openai/hosting.json','dist/.openai/hosting.json');
