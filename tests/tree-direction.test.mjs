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
test('Part 3 compares ARCOL and DARCOL from a shared start for one second',()=>{
 assert.equal(cfg.part3.ratingScale,'DARCOL-positive');assert.deepEqual(cfg.part3.methods,['DARCOL','ARCOL']);
 for(const p of m.comparisons){
  assert.equal(p.protocol.sharedStartingLayout,true);assert.equal(p.protocol.keyframeCount,2);
  assert.equal(p.ARCOL.durationMs,1000);assert.equal(p.DARCOL.durationMs,1000);
  assert.equal(p.protocol.ARCOL.interpolation,'direct-linear');assert.equal(p.protocol.ARCOL.separateTreeRotation,false);
  assert.deepEqual(p.protocol.ARCOL.highlightNodes,[]);
  assert.equal(p.protocol.DARCOL.interpolation,'endpoint-tree-chain-rotation');assert.deepEqual(p.protocol.DARCOL.highlightNodes,[]);assert.equal(p.protocol.DARCOL.animationHighlighting,'none');assert.equal(cfg.part3.highlightingPolicy,'none-both-methods');
  assert.notEqual(p.endpointLayouts.ARCOL.source,p.endpointLayouts.DARCOL.source);
  assert.deepEqual(p.protocol.ARCOL.camera,p.protocol.DARCOL.camera);
 }
});

test('Part 3 endpoint exports preserve orthogonal long edge segments and offset ports',()=>{
 for(const pair of m.comparisons)for(const method of ['ARCOL','DARCOL']){
  assert.match(pair.protocol[method].ink.portAttachment,/preserve supporting/);
  assert.equal(pair.protocol[method].ink.playbackEdgeGeometry,'straight');
  assert.equal(pair.protocol[method].ink.maxPlaybackBendCount,0);
  for(const asset of [pair.initial,pair.endpointLayouts[method]])for(const edge of asset.routes){
   for(let k=1;k<edge.points.length;k++){
    const dx=Math.abs(edge.points[k][0]-edge.points[k-1][0]),dy=Math.abs(edge.points[k][1]-edge.points[k-1][1]);
    assert.ok(Math.hypot(dx,dy)<=15||Math.min(dx,dy)<1e-5,`${pair.graphId} ${method} edge ${edge.u}-${edge.v}`);
   }
  }
 }
});
test('Wien highlights both complete branches and their shared root',()=>{for(const method of ['ARCOL','DARCOL']){const t=cfg.part2.conditions[method].trees['wien-kurz'];assert.deepEqual(t.nodes,[0,1,2,3,4,5,6,7,20,21,22,23,24,25,26,27]);assert.equal(t.attachment,7);}});


test('reviewed set excludes rejected graphs and records preservation cases honestly',()=>{
 for(const g of ['sydney','grafo1529.73','grafo2869.37','grafo5399.35','grafo2519.37','grafo1244.26'])assert.ok(!cfg.graphs.includes(g));
 assert.ok(cfg.part3.graphs.includes('grafo5838.35'));
 for(const condition of Object.values(cfg.part2.conditions))for(const t of Object.values(condition.trees))assert.equal(t.directionChanged,t.correctDirection!==t.finalDirection);
});
test('the 2069 target is a complete branching tree that turns under both methods',()=>{
 for(const method of ['ARCOL','DARCOL']){const t=cfg.part2.conditions[method].trees['grafo2069.32'];assert.deepEqual(t.nodes,[1,2,10,19,22,23,26]);assert.equal(t.attachment,2);assert.equal(t.correctDirection,'down');assert.equal(t.finalDirection,method==='DARCOL'?'left':'right');}
});

test('Part 2 contains no near-rigid whole-graph ARCOL quarter-turns',()=>{
 for(const g of cfg.part2.graphs){
  const i=m.items.find(i=>i.graphId===g),L=i.original.directionLayouts.ARCOL;
  const pose=a=>a.hitboxes.map(n=>[n.x+n.width/2,n.y+n.height/2]);
  const center=p=>{const mean=[0,1].map(k=>p.reduce((s,q)=>s+q[k],0)/p.length);return p.map(q=>q.map((v,k)=>v-mean[k]));};
  const x=center(pose(L.initial)),y=center(pose(L.final));let A=0,B=0,xx=0,yy=0;
  x.forEach((p,k)=>{const q=y[k];A+=p[0]*q[0]+p[1]*q[1];B+=p[0]*q[1]-p[1]*q[0];xx+=p[0]**2+p[1]**2;yy+=q[0]**2+q[1]**2;});
  const angle=Math.atan2(B,A),scale=Math.hypot(A,B)/xx,c=Math.cos(angle),s=Math.sin(angle);
  const residual=Math.sqrt(x.reduce((v,p,k)=>v+(scale*(c*p[0]-s*p[1])-y[k][0])**2+(scale*(s*p[0]+c*p[1])-y[k][1])**2,0)/yy);
  assert.ok(!(Math.abs(angle)>Math.PI/6&&residual<.1),g+' is mainly a rigid rotation');
  if(g==='grafo445.22'){assert.equal(i.sourceAspectTag,'AR1p00');assert.ok(Math.abs(angle)<Math.PI/9);assert.ok(residual>.4);}
 }
});
