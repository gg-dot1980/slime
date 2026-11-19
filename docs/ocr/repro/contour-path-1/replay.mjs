import fs from 'node:fs';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {analyze,compare} from './surface.mjs';
const hash=x=>createHash('sha256').update(x).digest('hex');
export function decode(b){
 if(b.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('PNG signature');
 let w,h,channels,parts=[];
 for(let o=8;o<b.length;){const n=b.readUInt32BE(o),type=b.toString('ascii',o+4,o+8),d=b.subarray(o+8,o+8+n);o+=n+12;if(type==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);if(d[8]!==8||![2,6].includes(d[9])||d[12]!==0)throw Error('Unsupported PNG');channels=d[9]===6?4:3;}if(type==='IDAT')parts.push(d);}
 const raw=inflateSync(Buffer.concat(parts)),stride=w*channels,out=Buffer.alloc(h*stride);if(raw.length!==(stride+1)*h)throw Error('PNG length');
 const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
 for(let y=0;y<h;y++){let filter=raw[y*(stride+1)];if(filter>4)throw Error('PNG filter');for(let x=0;x<stride;x++){let i=y*stride+x,a=x>=channels?out[i-channels]:0,b=y?out[i-stride]:0,c=y&&x>=channels?out[i-stride-channels]:0;out[i]=(raw[y*(stride+1)+x+1]+[0,a,b,(a+b)>>1,paeth(a,b,c)][filter])&255;}}
 const rgba=channels===4?out:Buffer.alloc(w*h*4);if(channels===3)for(let i=0;i<w*h;i++){out.copy(rgba,i*4,i*3,i*3+3);rgba[i*4+3]=255;}return {width:w,height:h,data:rgba};
}
const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('node replay.mjs samples-local.json result-noimages.json');
const samples=JSON.parse(fs.readFileSync(input)),rows=[];
for(const s of samples){if(s.group==='window')continue;const b=Buffer.from(s.png.split(',')[1],'base64'),p=decode(b);rows.push({...analyze(s,p),pngSha256:hash(b),rgbaSha256:hash(p.data)});}
const result=compare(rows);fs.writeFileSync(output,JSON.stringify(result,null,2));console.log(JSON.stringify(result.summary));
