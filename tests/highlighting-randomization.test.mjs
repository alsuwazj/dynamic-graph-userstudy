import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildScreens} from '../plan.mjs';
const cfg=JSON.parse(readFileSync(new URL('../study-config.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../stimuli.json',import.meta.url)));
test('all participants see identical trials while graph, method and condition order vary',()=>{
 const orders=new Set(),methods=new Set(),conditions=new Set();
 for(let seed=0;seed<256;seed++){
  const built=buildScreens(cfg,seed),qs=built.screens.filter(q=>/^part[123]$/.test(q.type));assert.equal(qs.length,33);
  orders.add(qs.map(q=>q.graph).join(','));methods.add(built.methodOrder.join(','));conditions.add(built.conditionOrder.join(','));
  for(let i=1;i<qs.length;i++)assert.notEqual(qs[i-1].graph,qs[i].graph);
  for(const graph of cfg.part2.graphs){const pair=qs.filter(q=>q.type==='part2'&&q.graph===graph);assert.equal(pair.length,2);assert.deepEqual(new Set(pair.map(q=>q.condition)),new Set(['structural','movement']));assert.deepEqual(pair[0].target,pair[1].target);}
  const left=qs.filter(q=>q.type==='part3'&&q.leftMethod==='DARCOL').length;assert.ok(left===2||left===3);
 }
 assert.ok(orders.size>200);assert.equal(methods.size,2);assert.equal(conditions.size,2);
});
test('highlighting pairs share linear geometry, endpoint images, duration and target path',()=>{
 for(const graph of cfg.part2.graphs){const item=manifest.items.find(i=>i.graphId===graph);const p=item.highlightingProtocol;assert.equal(p.interpolation,'linear');assert.equal(p.durationMs,3000);assert.ok(p.highlightNodes.structural.length>0);assert.ok(p.highlightNodes.movement.length>0);assert.equal(p.keyframes,2);assert.equal(item.original.videos.structural.durationMs,item.original.videos.movement.durationMs);assert.ok(item.original.videos.structural.url!==item.original.videos.movement.url);}
 const src=readFileSync(new URL('../study.mjs',import.meta.url),'utf8');assert.ok(src.includes("['structural', 'movement', 'landmarks_precomputed'].includes(screen.condition)"));
});
