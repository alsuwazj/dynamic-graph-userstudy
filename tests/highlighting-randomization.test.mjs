import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildScreens} from '../plan.mjs';
const cfg=JSON.parse(readFileSync(new URL('../study-config.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../stimuli.json',import.meta.url)));
test('all participants see identical trials while graph, method and condition order vary',()=>{
 const orders=new Set(),methods=new Set(),conditions=new Set();
 for(let seed=0;seed<256;seed++){
  const built=buildScreens(cfg,seed),qs=built.screens.filter(q=>/^part[123]$/.test(q.type));assert.equal(qs.length,35);
  orders.add(qs.map(q=>q.graph).join(','));methods.add(built.methodOrder.join(','));conditions.add(built.conditionOrder.join(','));
  for(let i=1;i<qs.length;i++)assert.notEqual(qs[i-1].graph,qs[i].graph);
  for(const graph of cfg.part2.graphs){const pair=qs.filter(q=>q.type==='part2'&&q.graph===graph);assert.equal(pair.length,2);assert.deepEqual(new Set(pair.map(q=>q.condition)),new Set(['animation','baseline']));assert.deepEqual(pair[0].target,pair[1].target);}
  const left=qs.filter(q=>q.type==='part3'&&q.leftMethod==='DARCOL').length;assert.ok(left===2||left===3);
 }
 assert.ok(orders.size>200);assert.equal(methods.size,2);assert.equal(conditions.size,2);
});
test('Part 2 uses DARCOL keyframe animation versus a plain direct DARCOL baseline',()=>{
 assert.deepEqual(Object.keys(cfg.part2.conditions),['animation','baseline']);
 for(const graph of cfg.part2.graphs){
  const item=manifest.items.find(i=>i.graphId===graph),p=item.part2Protocol;
  assert.equal(p.endpointMethod,'DARCOL');assert.equal(p.durationMs,2000);assert.equal(p.interpolation,'piecewise-linear');assert.equal(p.baselineInterpolation,'direct-linear');assert.equal(p.optimizationDuringPlayback,false);assert.equal(p.separateTreeRotation,false);assert.equal(p.keyframes.length>=3,true);assert.equal(p.fixedAspectRatioGrid.length,7);assert.ok(p.highlightNodes.length>0);assert.deepEqual(p.baselineHighlightNodes,[]);
  assert.equal(p.keyframeTimes[0],0);assert.equal(p.keyframeTimes.at(-1),1);
  assert.equal(item.original.initial.url,p.keyframes[0].url);assert.equal(item.original.finalB.url,p.keyframes.at(-1).url);
  for(const k of p.keyframes){assert.ok(k.source.replaceAll('\\','/').includes('/darcol/layouts/'));assert.ok(k.layoutSha256);}
  assert.equal(item.original.videos.animation.durationMs,2000);assert.equal(item.original.videos.baseline.durationMs,2000);
  assert.deepEqual(cfg.part2.conditions.animation.targets[graph],cfg.part2.conditions.baseline.targets[graph]);
 }
 const src=readFileSync(new URL('../study.mjs',import.meta.url),'utf8');assert.ok(src.includes("['animation', 'structural', 'movement', 'landmarks_precomputed'].includes(screen.condition)"));
});
test('Part 2 mixes animation and baseline without subsections and spaces repeats by two other trials',()=>{
 for(let seed=0;seed<512;seed++){
  const plan=buildScreens(cfg,seed).screens;assert.equal(plan.filter(q=>q.type==='condition-intro').length,0);
  const trials=plan.filter(q=>q.type==='part2');assert.equal(trials.length,10);
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

test('Part 1 mixes ten ARCOL and ten DARCOL trials without adjacent repeated graphs',()=>{
 const sequences=new Set(),first={ARCOL:0,DARCOL:0};
 for(let seed=0;seed<1024;seed++){
  const q=buildScreens(cfg,seed).screens.filter(q=>q.type==='part1');assert.equal(q.length,20);first[q[0].method]++;sequences.add(q.map(q=>q.graph+':'+q.method).join(','));
  for(const method of ['ARCOL','DARCOL'])assert.equal(q.filter(q=>q.method===method).length,10);
  for(let i=1;i<q.length;i++)assert.notEqual(q[i].graph,q[i-1].graph);
  for(let i=3;i<q.length;i++)assert.ok(!q.slice(i-3,i+1).every(p=>p.method===q[i].method));
  for(const graph of cfg.part1.graphs){const pair=q.filter(q=>q.graph===graph);assert.equal(pair.length,2);assert.notEqual(pair[0].method,pair[1].method);assert.deepEqual(pair[0].target,pair[1].target);}
 }
 assert.equal(first.ARCOL,512);assert.equal(first.DARCOL,512);assert.equal(sequences.size,1024);
});

test('Part 3 highlights structural landmarks only in DARCOL, with equal paired timing',()=>{
 assert.equal(cfg.part3.highlightingPolicy,'DARCOL-structural-only');
 for(const pair of manifest.comparisons){assert.equal(pair.ARCOL.animation,'linear-screen-space');assert.ok(pair.DARCOL.highlightNodes.length>0);assert.equal(pair.DARCOL.highlighting,'structural');assert.equal(pair.DARCOL.durationMs,2000);assert.equal(pair.ARCOL.durationMs,2000);}
});

test('all previous graphs remain with Wien only in Part 1',()=>{
 const provenance=JSON.parse(readFileSync(new URL('../selection-provenance-v20.json',import.meta.url)));
 for(const part of ['part1','part2','part3']){
  for(const g of provenance.restoredOriginalGroups[part])assert.ok(cfg[part].graphs.includes(g));
  assert.equal(cfg[part].graphs.length,provenance.restoredOriginalGroups[part].length+provenance.additions[part].length);
  for(const g of provenance.additions[part])assert.ok(cfg[part].graphs.includes(g));
 }
 assert.equal(new Set(manifest.items.map(i=>i.sourceGraph)).size,20);
 for(let seed=0;seed<256;seed++){
  const q=buildScreens(cfg,seed).screens.filter(q=>/^part[123]$/.test(q.type));assert.deepEqual([1,2,3].map(p=>q.filter(q=>q.type==='part'+p).length),[20,10,5]);
  for(let i=1;i<q.length;i++)assert.notEqual(cfg.graphFamilies[q[i].graph],cfg.graphFamilies[q[i-1].graph]);
 }
});

test('Wien uses a straight connected four-node core path in both methods',()=>{
 const target=cfg.part1.targets['wien-kurz-square-tall'];assert.deepEqual(target,[33,34,35,36]);const item=manifest.items.find(i=>i.graphId==='wien-kurz-square-tall');
 for(let j=1;j<target.length;j++)assert.ok(item.edges.some(([u,v])=>(u===target[j-1]&&v===target[j])||(v===target[j-1]&&u===target[j])));
 for(const key of ['initialA','initialB','finalA','finalB']){const a=item.original[key];const points=target.map(id=>{const b=a.hitboxes.find(b=>b.id===id);return [b.x+b.width/2,b.y+b.height/2];});const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);assert.ok(Math.max(...xs)-Math.min(...xs)<2||Math.max(...ys)-Math.min(...ys)<2);}
});

test('Sydney is absent from the active study',()=>{assert.ok(manifest.items.every(i=>i.sourceGraphId!=='sydney'&&!i.graphId.includes('sydney')));assert.equal(cfg.part2.graphs.length,5);assert.ok(cfg.part1.graphs.includes('wien-kurz-square-tall'));});
