const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const h=fs.readFileSync('src/ocr3.html','utf8'),code=h.slice(h.indexOf('let runCount=0;'),h.indexOf('\nfunction tick('));
(async()=>{for(const [title,time,expected] of [['成功過關！','01:49',true],['成功過關！','01:50',false],['被大史萊姆吞掉了','01:49',false],['成功過關！','',false]]){
const fields=new Map(),rows=[],$=id=>{if(!fields.has(id))fields.set(id,{textContent:'',append:x=>rows.push(x.textContent)});return fields.get(id)};
const c=vm.createContext({$,game:{src:'https://slime.gameson.cc/v2.13',contentDocument:{getElementById:id=>({textContent:id==='title'?title:'遊玩時間 '+time})}},document:{createElement:()=>({textContent:''})},URL,active:true,challenging:true,epoch:3,attempt:5,release(){},startAttempt(){throw Error('must stop')},setTimeout,location:{href:'https://slime.gameson.cc/ocr3'}});
vm.runInContext(code+';runCount=5;',c);await c.finish(3);assert.equal($('status').textContent.startsWith('已達標'),expected);assert.equal(rows.length,1);assert.equal(c.challenging,false);
}console.log('PASS result gate: 1:49 win, reject 1:50, reject defeat, reject missing clock; bounded stop');})();
