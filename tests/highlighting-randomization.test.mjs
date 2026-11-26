import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildScreens} from '../plan.mjs';
const cfg=JSON.parse(readFileSync(new URL('../study-config.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../stimuli.json',import.meta.url)));
test('all participants see identical trials while graph, method and condition order vary',()=>{
 const orders=new Set(),methods=new Set(),conditions=new Set();
 for(let seed=0;seed<256;seed++){
  const built=buildScreens(cfg,seed),qs=built.screens.filter(q=>/^part[123]$/.test(q.type));assert.equal(qs.length,41);
  orders.add(qs.map(q=>q.graph).join(','));methods.add(built.methodOrder.join(','));conditions.add(built.conditionOrder.join(','));
  for(let i=1;i<qs.length;i++)assert.notEqual(qs[i-1].graph,qs[i].graph);
  for(const graph of cfg.part2.graphs){const pair=qs.filter(q=>q.type==='part2'&&q.graph===graph);assert.equal(pair.length,2);assert.deepEqual(new Set(pair.map(q=>q.condition)),new Set(['ARCOL','DARCOL']));assert.deepEqual(pair[0].target,pair[1].target);}
  const left=qs.filter(q=>q.type==='part3'&&q.leftMethod==='DARCOL').length;assert.ok(left===2||left===3);
 }
 assert.ok(orders.size>200);assert.equal(methods.size,2);assert.equal(conditions.size,2);
});
test('Part 2 mixes ARCOL and DARCOL animated trials without subsections and spaces repeats by two other trials',()=>{
 for(let seed=0;seed<512;seed++){
  const plan=buildScreens(cfg,seed).screens;assert.equal(plan.filter(q=>q.type==='condition-intro').length,0);
  const trials=plan.filter(q=>q.type==='part2');assert.equal(trials.length,18);
  for(let i=0;i<trials.length;i++){
   for(let j=Math.max(0,i-2);j<i;j++)assert.notEqual(trials[i].graph,trials[j].graph);
   if(i>=3)assert.ok(!trials.slice(i-3,i+1).every(q=>q.condition===trials[i].condition));
  }
 }
});
test('Part 2 includes strong tall/wide transitions rather than mild aspect-ratio steps',()=>{
 let opposite=0;
 const ratio=tag=>Number(tag.slice(2).replace('p','.'));
 for(const g of cfg.part2.graphs){const item=manifest.items.find(i=>i.graphId===g);const a=ratio(item.sourceAspectTag),b=ratio(item.destinationAspectTag);assert.ok(Math.max(a/b,b/a)>=3-0.01);if((a>2&&b<.5)||(b>2&&a<.5))opposite++;}
 assert.ok(opposite>=2);
});

test('Part 1 mixes nine ARCOL and nine DARCOL trials without adjacent repeated graphs',()=>{
 const sequences=new Set(),first={ARCOL:0,DARCOL:0};
 for(let seed=0;seed<1024;seed++){
  const q=buildScreens(cfg,seed).screens.filter(q=>q.type==='part1');assert.equal(q.length,18);first[q[0].method]++;sequences.add(q.map(q=>q.graph+':'+q.method).join(','));
  for(const method of ['ARCOL','DARCOL'])assert.equal(q.filter(q=>q.method===method).length,9);
  for(let i=1;i<q.length;i++)assert.notEqual(q[i].graph,q[i-1].graph);
  for(let i=3;i<q.length;i++)assert.ok(!q.slice(i-3,i+1).every(p=>p.method===q[i].method));
  for(const graph of cfg.part1.graphs){const pair=q.filter(q=>q.graph===graph);assert.equal(pair.length,2);assert.notEqual(pair[0].method,pair[1].method);assert.deepEqual(pair[0].target,pair[1].target);}
 }
 assert.equal(first.ARCOL,512);assert.equal(first.DARCOL,512);assert.equal(sequences.size,1024);
});

test('Part 1 retains its graph pool while all trial counts stay fixed',()=>{
 const provenance=JSON.parse(readFileSync(new URL('../selection-provenance-v23.json',import.meta.url)));
 for(const part of ['part1']){
  for(const g of provenance.restoredOriginalGroups[part])assert.ok(cfg[part].graphs.includes(g));
  assert.equal(cfg[part].graphs.length,provenance.restoredOriginalGroups[part].length+provenance.additions[part].length);
  for(const g of provenance.additions[part])assert.ok(cfg[part].graphs.includes(g));
 }
 assert.equal(new Set(manifest.items.map(i=>i.sourceGraph)).size,cfg.graphs.length);
 for(let seed=0;seed<256;seed++){
  const q=buildScreens(cfg,seed).screens.filter(q=>/^part[123]$/.test(q.type));assert.deepEqual([1,2,3].map(p=>q.filter(q=>q.type==='part'+p).length),[18,18,5]);
  for(let i=1;i<q.length;i++)assert.notEqual(cfg.graphFamilies[q[i].graph],cfg.graphFamilies[q[i-1].graph]);
 }
});

test('Wien remains in Part 2 and Sydney is excluded',()=>{
 assert.ok(!cfg.part2.graphs.includes('sydney'));assert.ok(!cfg.graphs.includes('sydney'));assert.ok(cfg.part3.graphs.includes('grafo5838.35'));assert.ok(cfg.part2.graphs.includes('wien-kurz'));assert.ok(cfg.part3.graphs.includes('wien-kurz'));
 assert.deepEqual([cfg.part1.graphs.length,cfg.part2.graphs.length,cfg.part3.graphs.length],[9,9,5]);
});
