import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawingSvg} from '../graph-view.mjs';
const cfg=JSON.parse(readFileSync(new URL('../study-config.json',import.meta.url)));
const m=JSON.parse(readFileSync(new URL('../stimuli.json',import.meta.url)));
const direction=(a,tree)=>{const by=new Map(a.hitboxes.map(n=>[n.id,n]));const center=id=>{const n=by.get(id);return [n.x+n.width/2,n.y+n.height/2];};const root=center(tree.attachment);const delta=[0,1].map(axis=>tree.nodes.reduce((sum,id)=>sum+center(id)[axis],0)/tree.nodes.length-root[axis]);return Math.abs(delta[0])>Math.abs(delta[1])?(delta[0]>0?'right':'left'):(delta[1]>0?'down':'up');};
test('static methods use the same attached tree but method-specific direction answers',()=>{
 assert.equal(cfg.part2.taskType,'tree-direction');assert.equal(cfg.part2.presentationMode,'animated');assert.equal(cfg.part2.graphs.length,9);
 for(const g of cfg.part2.graphs){const i=m.items.find(i=>i.graphId===g);
  assert.deepEqual(cfg.part2.conditions.ARCOL.targets[g],cfg.part2.conditions.DARCOL.targets[g]);
  for(const method of ['ARCOL','DARCOL']){const tree=cfg.part2.conditions[method].trees[g],ns=new Set(tree.nodes),o=i.original.staticLayouts[method];
   const links=i.edges.filter(([u,v])=>ns.has(u)&&ns.has(v));assert.equal(links.length,ns.size-1);
   const seen=new Set([tree.nodes[0]]);for(let k=0;k<ns.size;k++)for(const [u,v] of links)if(seen.has(u)||seen.has(v)){seen.add(u);seen.add(v);}assert.equal(seen.size,ns.size);
   const external=i.edges.filter(([u,v])=>ns.has(u)!==ns.has(v));if(tree.groupMode==='shared-core-root'){assert.ok(ns.has(tree.attachment));assert.ok(external.every(e=>e.includes(tree.attachment)));const outside=new Set(external.flat().filter(n=>!ns.has(n)));assert.ok(outside.size>=1);}else{assert.equal(external.length,1);assert.ok(external[0].includes(tree.attachment));}
   assert.equal(direction(o.initial,tree),tree.correctDirection);assert.equal(direction(o.final,tree),tree.finalDirection);
   assert.ok(!drawingSvg(o.initial).includes('node-highlight'));
   assert.ok(drawingSvg(o.final,{highlight:tree.nodes,highlightTree:true,treeAttachment:tree.attachment}).includes('tree-highlight'));
  }
 }
});
test('Part 3 uses endpoint-only GUI tree turns and paired equal-duration videos',()=>{
 assert.equal(cfg.part3.ratingScale,'rotation-positive');for(const p of m.comparisons){assert.equal(p.protocol.keyframeCount,2);assert.equal(p.protocol.keyframes.length,2);assert.equal(p.protocol.intermediateComputedLayouts,false);assert.equal(p.protocol.optimizationDuringPlayback,false);assert.equal(p.protocol.interpolation,'endpoint-tree-chain-rotation');assert.equal(p.protocol.separateTreeRotation,true);assert.equal(p.animation.durationMs,2000);assert.equal(p.baseline.durationMs,2000);assert.ok(p.protocol.highlightNodes.length);assert.deepEqual(p.protocol.highlightNodes,p.protocol.baselineHighlightNodes);assert.equal(p.protocol.sharedColorPolicy,true);assert.equal(p.protocol.coreArcBulge,0);assert.ok(p.protocol.maxCorePositionDifference<1e-8);assert.ok(p.protocol.treeTurns.some(t=>Math.abs(t.angleDegrees)>10));}
});
test('Wien highlights both complete branches and their shared root',()=>{for(const method of ['ARCOL','DARCOL']){const t=cfg.part2.conditions[method].trees['wien-kurz'];assert.deepEqual(t.nodes,[0,1,2,3,4,5,6,7,20,21,22,23,24,25,26,27]);assert.equal(t.attachment,7);}});


test('Sydney excluded and replacement contains visible tree turns',()=>{assert.ok(!cfg.graphs.includes('sydney'));assert.ok(cfg.part3.graphs.includes('grafo2869.37'));for(const [method,condition] of Object.entries(cfg.part2.conditions))for(const g of cfg.part2.graphs){const t=condition.trees[g];if(g==='grafo1529.73'&&method==='DARCOL')assert.equal(t.correctDirection,t.finalDirection);else assert.notEqual(t.correctDirection,t.finalDirection,g);}});

test('Q9 includes every attached branch and Q15 uses the largest rooted tree',()=>{for(const method of ['ARCOL','DARCOL']){const q9=cfg.part2.conditions[method].trees['grafo3043.36'];assert.deepEqual(q9.nodes,[3,10,19,20,21,22,23,24,25,27,28,31,35]);const q15=cfg.part2.conditions[method].trees['grafo1529.73'];assert.deepEqual(q15.nodes,[1,8,12,17,27,30,32,33,70]);assert.equal(q15.attachment,12);}});
