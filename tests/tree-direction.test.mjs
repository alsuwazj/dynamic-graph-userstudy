import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawingSvg} from '../graph-view.mjs';
const cfg=JSON.parse(readFileSync(new URL('../study-config.json',import.meta.url)));
const m=JSON.parse(readFileSync(new URL('../stimuli.json',import.meta.url)));
const direction=(a,tree)=>{const by=new Map(a.hitboxes.map(n=>[n.id,n]));const center=id=>{const n=by.get(id);return [n.x+n.width/2,n.y+n.height/2];};const root=center(tree.attachment);const delta=[0,1].map(axis=>tree.nodes.reduce((sum,id)=>sum+center(id)[axis],0)/tree.nodes.length-root[axis]);return Math.abs(delta[0])>Math.abs(delta[1])?(delta[0]>0?'right':'left'):(delta[1]>0?'down':'up');};
test('static methods use the same attached tree but method-specific direction answers',()=>{
 assert.equal(cfg.part2.taskType,'tree-direction');assert.equal(cfg.part2.presentationMode,'static');assert.equal(cfg.part2.graphs.length,5);
 for(const g of cfg.part2.graphs){const i=m.items.find(i=>i.graphId===g);
  assert.deepEqual(cfg.part2.conditions.ARCOL.targets[g],cfg.part2.conditions.DARCOL.targets[g]);
  for(const method of ['ARCOL','DARCOL']){const tree=cfg.part2.conditions[method].trees[g],ns=new Set(tree.nodes),o=i.original.staticLayouts[method];
   const links=i.edges.filter(([u,v])=>ns.has(u)&&ns.has(v));assert.equal(links.length,ns.size-1);
   const seen=new Set([tree.nodes[0]]);for(let k=0;k<ns.size;k++)for(const [u,v] of links)if(seen.has(u)||seen.has(v)){seen.add(u);seen.add(v);}assert.equal(seen.size,ns.size);
   const external=i.edges.filter(([u,v])=>ns.has(u)!==ns.has(v));assert.equal(external.length,1);assert.ok(external[0].includes(tree.attachment));
   assert.equal(direction(o.initial,tree),tree.correctDirection);assert.equal(direction(o.final,tree),tree.finalDirection);
   assert.ok(!drawingSvg(o.initial).includes('node-highlight'));
   assert.ok(drawingSvg(o.final,{highlight:tree.nodes,highlightTree:true,treeAttachment:tree.attachment}).includes('tree-highlight'));
  }
 }
});
test('Part 3 compares paired DARCOL-only clips with identical endpoints',()=>{
 assert.deepEqual(cfg.part3.methods,['animation','baseline']);assert.equal(cfg.part3.ratingScale,'keyframes-positive');
 for(const pair of m.comparisons){assert.equal(pair.animation.durationMs,2000);assert.equal(pair.baseline.durationMs,2000);assert.equal(pair.protocol.endpointMethod,'DARCOL');assert.equal(pair.protocol.keyframes.length,28);assert.equal(pair.protocol.aspectRatioStep,.1);for(let j=1;j<28;j++)assert.ok(Math.abs(Math.abs(pair.protocol.keyframes[j].targetAspect-pair.protocol.keyframes[j-1].targetAspect)-.1)<1e-9);assert.deepEqual(pair.protocol.baselineHighlightNodes,[]);assert.ok(pair.protocol.highlightNodes.length);assert.equal(pair.ARCOL,undefined);}
});
