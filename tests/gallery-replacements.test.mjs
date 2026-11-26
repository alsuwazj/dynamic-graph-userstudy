import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>JSON.parse(readFileSync(new URL('../'+name,import.meta.url)));
const cfg=read('study-config.json'),manifest=read('stimuli.json'),selection=read('part3-gallery-selection-v52.json');
test('five replacement comparisons use recorded gallery destinations and retain all nine neutral one-second pairs',()=>{
 assert.equal(cfg.part3.graphs.length,9);assert.equal(selection.replacements.length,5);assert.equal(selection.retainedComparisons.length,4);
 assert.equal(selection.representativeSample,false);assert.match(selection.gallerySha256,/^[a-f0-9]{64}$/);
 for(const [oldGraph,newGraph] of Object.entries(selection.replacementMap)){
  assert.ok(!cfg.part3.graphs.includes(oldGraph));assert.ok(cfg.part3.graphs.includes(newGraph));
  const row=selection.replacements.find(r=>r.graphId===newGraph),pair=manifest.comparisons.find(p=>p.graphId===newGraph);
  assert.equal(row.galleryDestinationMatched,true);assert.equal(pair.destinationAspectTag,row.destinationAspectTag);assert.equal(pair.inputSha256,row.inputSha256);
  assert.ok(row.galleryRow>0);assert.notEqual(pair.sourceAspectTag,pair.destinationAspectTag);
  assert.ok(pair.protocol.DARCOL.treeTurns.some(t=>Math.abs(t.angleDegrees)>15));
  for(const audit of row.endpointAudits){assert.equal(audit.node_overlaps,0);assert.equal(audit.edge_through_node,0);assert.equal(audit.nonorthogonal_segments,0);}
 }
 for(const pair of manifest.comparisons)for(const method of ['ARCOL','DARCOL']){
  assert.equal(pair[method].durationMs,1000);assert.deepEqual(pair.protocol[method].highlightNodes,[]);assert.equal(pair.protocol[method].ink.playbackEdgeGeometry,'straight');
 }
});
