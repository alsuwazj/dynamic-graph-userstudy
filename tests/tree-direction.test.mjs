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
   const external=i.edges.filter(([u,v])=>ns.has(u)!==ns.has(v));if(tree.groupMode==='shared-core-root'){assert.ok(ns.has(tree.attachment));assert.ok(external.every(e=>e.includes(tree.attachment)));const outside=new Set(external.flat().filter(n=>!ns.has(n)));assert.ok(outside.size>=1);}else{assert.equal(external.length,1);assert.ok(external[0].includes(tree.attachment));}
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

test('Part 3 uses the five requested graphs and larger non-overlapping symbols',()=>{
 assert.deepEqual(cfg.part3.graphs,['wien-kurz','grafo2069.32','grafo2774.26','grafo2869.37','grafo2519.37']);assert.ok(!cfg.part2.graphs.includes('sydney'));
 for(const p of m.comparisons){if(p.graphId==='grafo2869.37')continue;assert.equal(p.protocol.nodeSizing.targetPx,16);for(const a of p.protocol.keyframes){for(let j=0;j<a.hitboxes.length;j++)for(let k=j+1;k<a.hitboxes.length;k++){const u=a.hitboxes[j],v=a.hitboxes[k];assert.ok(u.x+u.width<=v.x||v.x+v.width<=u.x||u.y+u.height<=v.y||v.y+v.height<=u.y,p.graphId+' '+a.aspectTag);}}}
});

test('Wien highlights both complete branches and their shared root',()=>{for(const method of ['ARCOL','DARCOL']){const t=cfg.part2.conditions[method].trees['wien-kurz'];assert.deepEqual(t.nodes,[0,1,2,3,4,5,6,7,20,21,22,23,24,25,26,27]);assert.equal(t.attachment,7);}});


test('Sydney excluded and replacement contains visible tree turns',()=>{assert.ok(!cfg.graphs.includes('sydney'));assert.ok(cfg.part3.graphs.includes('grafo2869.37'));for(const condition of Object.values(cfg.part2.conditions))for(const g of cfg.part2.graphs)assert.notEqual(condition.trees[g].correctDirection,condition.trees[g].finalDirection,g);});
