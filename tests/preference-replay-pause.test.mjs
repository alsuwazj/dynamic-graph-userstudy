import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync(new URL('../study-config.json',import.meta.url)));
const source=readFileSync(new URL('../study.mjs',import.meta.url),'utf8');
test('paired clips hold for two seconds; Pause and Restart cancel the scheduled replay',async()=>{
 const elements=new Map(),timers=[];const video=()=>({currentTime:0,plays:0,load(){this.oncanplaythrough();},play(){this.plays++;return Promise.resolve();},pause(){}});
 const a=video(),b=video();elements.set('#pref-a',a);elements.set('#pref-b',b);const $=id=>{if(!elements.has(id))elements.set(id,{textContent:'',disabled:true});return elements.get(id);};
 const trial={flags:{},timers:new Set(),cleanup(){}};const context={escapeHtml:String,config,comparisons:{g:{animation:{url:'a'},baseline:{url:'b'}}},screen:{graph:'g',leftMethod:'animation',rightMethod:'baseline'},questionNumber:()=>({index:1,total:5}),watchTrial:()=>trial,activeTrial:trial,main:{innerHTML:'',querySelectorAll:()=>[]},$,withTimeout:p=>p,performance:{now:()=>0},setTimeout:(fn,delay)=>{const timer={fn,delay};timers.push(timer);return timer;},clearTimeout:timer=>{timer.cancelled=true;}};
 const fn=source.slice(source.indexOf('async function part3Question('),source.indexOf('// ---------------------------------------------------------------- end'));
 await vm.runInNewContext(fn+';part3Question(screen)',context);assert.equal(a.plays,1);assert.equal(b.plays,1);
 a.currentTime=2;b.currentTime=2;a.onended();b.onended();assert.equal(a.plays,1);assert.equal(a.currentTime,2);assert.equal(timers[0].delay,2000);
 timers[0].fn();await Promise.resolve();assert.equal(a.plays,2);assert.equal(b.plays,2);assert.equal(a.currentTime,0);
 a.onended();b.onended();const pending=timers.at(-1);$('#pref-play').onclick();assert.ok(pending.cancelled);pending.fn();assert.equal(a.plays,2);
 $('#pref-restart').onclick();await Promise.resolve();assert.equal(a.plays,3);assert.equal(b.plays,3);assert.equal(a.currentTime,0);
});
