import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {drawingSvg} from '../graph-view.mjs';
import {buildScreens} from '../plan.mjs';
const config=JSON.parse(readFileSync(new URL('../study-config.json',import.meta.url)));
const manifest=JSON.parse(readFileSync(new URL('../stimuli.json',import.meta.url)));
test('all restored graphs and real-graph additions have matching assets, four connected targets and no response cue leakage',()=>{
 const groups=[config.part1.graphs,config.part2.graphs,config.part3.graphs];assert.deepEqual(groups.map(g=>g.length),[9,5,5]);assert.equal(new Set(groups.flat()).size,19);
 for(const [part,graphs] of groups.entries())for(const graph of graphs){
  const i=manifest.items.find(x=>x.graphId===graph);assert.ok(i);
  if(part===2)continue;
  const target=part===0?config.part1.targets[graph]:config.part2.conditions.animation.targets[graph];assert.equal(new Set(target).size,4);
  for(let j=1;j<target.length;j++)assert.ok(i.edges.some(([u,v])=>(u===target[j-1]&&v===target[j])||(v===target[j-1]&&u===target[j])));
  const asset=i.original[part===0?'initialA':'initial'];
  const svg=drawingSvg(asset,{highlight:target});assert.equal((svg.match(/class="node-highlight"/g)||[]).length,4);assert.ok(!svg.includes('path-highlight'));
  assert.ok(!drawingSvg(i.original.finalB,{selectable:true}).includes('class="node-highlight"'));
  for(const a of Object.values(i.original).filter(a=>a?.url&&a.hitboxes)){assert.ok(existsSync(new URL('../'+a.url,import.meta.url)));for(const id of target)assert.ok(a.hitboxes.some(b=>b.id===id));}
 }
});
test('every participant sees all 33 trials, with repeated graphs separated',()=>{
 for(let seed=0;seed<100;seed++){
 const q=buildScreens(config,seed).screens.filter(x=>/^part[123]$/.test(x.type));assert.equal(q.length,33);assert.equal(q.filter(x=>x.type==='part1').length,18);for(let j=1;j<q.length;j++)assert.notEqual(q[j].graph,q[j-1].graph);
 }
});
