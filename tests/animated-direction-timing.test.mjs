import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const config=JSON.parse(readFileSync(new URL('../study-config.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../stimuli.json',import.meta.url)));
const source=readFileSync(new URL('../study.mjs',import.meta.url),'utf8');
test('target appears only after playback and final hold; answer time excludes both',async()=>{
 const g=config.part2.graphs[0],item=manifest.items.find(i=>i.graphId===g);let clock=0;const timers=[],countdowns=[],elements=new Map();
 const $=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',hidden:true,disabled:true,append(v){this.video=v;},querySelectorAll(){return this.buttons||=(['left','right','up','down'].map(value=>({dataset:{direction:value}}))); }});return elements.get(id);};
 const video={ended:false,paused:true,load(){this.readyState=2;this.onloadeddata();},play(){this.playing=true;this.paused=false;return Promise.resolve();},pause(){this.paused=true;this.playing=false;}};const trial={flags:{},timers:new Set(),cleanup(){}};
 const context={config,graphs:{[g]:{directionLayouts:item.original.directionLayouts,directionVideos:item.original.directionVideos}},screen:{graph:g,method:'ARCOL',condition:'ARCOL'},questionNumber:()=>({index:1,total:18}),cropBox:()=>[0,0,960,540],drawingSvg:(a,o)=>o.highlight?'TARGET':'UNMARKED',$,main:{innerHTML:''},document:{createElement:()=>video},watchTrial:()=>trial,activeTrial:trial,preload:async()=>{},withTimeout:p=>p,performance:{now:()=>clock},nowIso:()=>'',countdown:(t,e,ms,format,done)=>countdowns.push({ms,done}),setTimeout:(fn,delay)=>{timers.push({fn,delay});return timers.length;},fitVideo(){},technicalProblem(){throw Error('Unexpected playback problem');}};
 const fn=source.slice(source.indexOf('async function part2Question('),source.indexOf('async function part3Question('));await vm.runInNewContext(fn+';part2Question(screen)',context);
 assert.equal($('#stage').innerHTML,'UNMARKED');assert.equal(countdowns.length,1);clock=6000;await countdowns[0].done();assert.ok(video.playing);assert.ok(!$('#stage').innerHTML.includes('TARGET'));assert.equal(countdowns.length,1);
 clock=6900;video.onended();assert.equal(timers.length,0);assert.equal(countdowns.length,1);
 clock=7000;video.ended=true;video.onended();assert.equal(video.paused,true);assert.equal($('#stage').innerHTML,'UNMARKED');assert.equal(countdowns.length,1);video.onended();assert.equal(timers.length,1);const reveal=timers.find(t=>t.delay===150);assert.ok(reveal);clock=7150;reveal.fn();assert.equal($('#stage').innerHTML,'TARGET');assert.equal(countdowns[1].ms,40000);
 context.session={answers:[]};context.describe=()=>({part:2,method:'ARCOL',graph:g});context.logEvent=()=>{};context.save=()=>{};context.next=()=>{};clock=8000;$('#give-up').onclick();const answer=context.session.answers[0];assert.equal(answer.gaveUp,true);assert.equal(answer.timeout,false);assert.equal(answer.outcome,'give-up');assert.equal(answer.selectedDirection,null);assert.equal(answer.responseMs,850);
});
test('Part 1 records node toggles, clear and submit against the fully loaded display time',async()=>{
 let clock=0,callback,selection,answer;const elements=new Map();const $=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',disabled:true});return elements.get(id);};const screen={graph:config.part1.graphs[0],method:'ARCOL',target:[1,2,3,4]};
 const trial={flags:{}};const context={activeTrial:trial,escapeHtml:String,screen,graphs:{[screen.graph]:{arcolInitial:{url:'a'},arcol:{url:'b'}}},config,questionNumber:()=>({index:1,total:18}),Set,main:{innerHTML:''},$,watchTrial:()=>trial,preload:async()=>{},withTimeout:p=>p,drawingSvg:()=>'',selectionLabel:s=>String(s.size),bindSelection:(root,s,cb)=>{selection=s;callback=cb;},clearSelection:(root,s)=>s.clear(),performance:{now:()=>clock},nowIso:()=>'',recordAnswer:(s,selected,extra)=>{answer=extra;},next(){},countdown(){}};
 const fn=source.slice(source.indexOf('async function part1Question('),source.indexOf('// ---------------------------------------------------------------- Part 2'));await vm.runInNewContext(fn+';part1Question(screen)',context);
 clock=100;selection.add(1);callback({nodeId:1,selected:true,inputType:'pointer'});clock=250;selection.delete(1);callback({nodeId:1,selected:false,inputType:'keyboard'});clock=400;$('#clear').onclick();clock=900;$('#submit').onclick();
 assert.deepEqual(Array.from(answer.clickEvents,e=>e.action),['select','deselect','clear','submit']);assert.deepEqual(Array.from(answer.clickEvents,e=>e.elapsedMs),[100,250,400,900]);assert.deepEqual(Array.from(answer.clickEvents,e=>e.intervalMs),[100,150,150,500]);assert.equal(answer.clickCount,2);assert.equal(answer.responseMs,900);
});
