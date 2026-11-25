import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {drawingSvg,cropBox} from '../graph-view.mjs';
const config=JSON.parse(readFileSync(new URL('../study-config.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../stimuli.json',import.meta.url)));
test('static task hides the first drawing before revealing the tree and starting answer timing',async()=>{
 const source=readFileSync(new URL('../study.mjs',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('async function part2Question('),source.indexOf('async function part3Question('));
 const graph=config.part2.graphs[0],item=manifest.items.find(i=>i.graphId===graph),o=item.original;
 let clock=0;const countdowns=[],timers=[];const elements=new Map();
 const $=id=>{if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',hidden:true,disabled:true,append(node){this.child=node;},querySelectorAll(){return ['left','right','up','down'].map(value=>({value}));}});return elements.get(id);};
 const video={load(){this.oncanplaythrough();},play(){return Promise.resolve();},pause(){this.paused=true;}};
 const trial={flags:{},timers:new Set(),cleanup(){}};
 const context={config,graphs:{[graph]:{staticLayouts:o.staticLayouts}},screen:{graph,condition:'ARCOL',method:'ARCOL'},
  questionNumber:()=>({index:1,total:10}),cropBox,drawingSvg,$,main:{innerHTML:''},document:{createElement:()=>{throw Error('Static Part 2 must not create a video');}},watchTrial:()=>trial,activeTrial:trial,
  preload:async()=>{},withTimeout:async p=>p,performance:{now:()=>clock},nowIso:()=>'',
  countdown:(t,el,ms,format,done)=>countdowns.push({ms,done}),ResizeObserver:class{observe(){}disconnect(){}},fitVideo(){},
  setTimeout:(fn,delay)=>{const timer={fn,delay};timers.push(timer);return timer;},technicalProblem(){throw Error('Unexpected playback failure');}};
 await vm.runInNewContext(fn+';part2Question(screen)',context);
 assert.ok(!$('#stage').innerHTML.includes('node-highlight'));assert.equal(countdowns.length,1);
 clock=6000;countdowns[0].done();assert.equal($('#stage').innerHTML,'');assert.equal(countdowns.length,1);assert.equal($('#direction-options').innerHTML,'');
 const reveal=timers.find(t=>t.delay===config.timing.part2BlankMs);assert.ok(reveal);clock=6250;reveal.fn();
 assert.ok($('#stage').innerHTML.includes('node-highlight'));assert.ok($('#stage').innerHTML.includes('tree-highlight'));assert.equal(countdowns[1].ms,40000);
});
