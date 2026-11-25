import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawingSvg} from '../graph-view.mjs';
const cfg=JSON.parse(readFileSync(new URL('../study-config.json',import.meta.url)));
const m=JSON.parse(readFileSync(new URL('../stimuli.json',import.meta.url)));
const direction=(a,tree)=>{const by=new Map(a.hitboxes.map(n=>[n.id,n]));const center=id=>{const n=by.get(id);return [n.x+n.width/2,n.y+n.height/2];};const root=center(tree.attachment);const delta=[0,1].map(axis=>tree.nodes.reduce((sum,id)=>sum+center(id)[axis],0)/tree.nodes.length-root[axis]);return Math.abs(delta[0])>Math.abs(delta[1])?(delta[0]>0?'right':'left'):(delta[1]>0?'down':'up');};
test('five attached branched trees have clear changed directions and matched conditions',()=>{
 assert.equal(cfg.part2.taskType,'tree-direction');assert.equal(cfg.part2.graphs.length,5);
 for(const g of cfg.part2.graphs){const i=m.items.find(i=>i.graphId===g),tree=cfg.part2.trees[g],ns=new Set(tree.nodes);
  const links=i.edges.filter(([u,v])=>ns.has(u)&&ns.has(v));assert.equal(links.length,ns.size-1);
  const seen=new Set([tree.nodes[0]]);for(let k=0;k<ns.size;k++)for(const [u,v] of links)if(seen.has(u)||seen.has(v)){seen.add(u);seen.add(v);}assert.equal(seen.size,ns.size);
  const external=i.edges.filter(([u,v])=>ns.has(u)!==ns.has(v));assert.equal(external.length,1);assert.ok(external[0].includes(tree.attachment));
  assert.ok(tree.nodes.some(n=>i.edges.filter(e=>e.includes(n)).length>=3));
  assert.equal(direction(i.original.initial,tree),tree.correctDirection);assert.equal(direction(i.original.finalB,tree),tree.finalDirection);assert.notEqual(tree.correctDirection,tree.finalDirection);
  assert.deepEqual(cfg.part2.conditions.animation.targets[g],cfg.part2.conditions.baseline.targets[g]);
  assert.ok(!drawingSvg(i.original.initial).includes('class="node-highlight"'));
  const final=drawingSvg(i.original.finalB,{highlight:tree.nodes,highlightTree:true,treeAttachment:tree.attachment});assert.equal((final.match(/class="node-highlight"/g)||[]).length,ns.size);assert.ok(final.includes('class="tree-highlight"'));assert.ok(!final.includes('node-choice'));
 }
});
