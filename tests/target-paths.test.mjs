import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {drawingSvg} from '../graph-view.mjs';
const manifest=JSON.parse(readFileSync(new URL('../stimuli.json',import.meta.url)));
test('all reference paths join four targets with three real routed edges and do not leak into answers',()=>{
 for(const item of manifest.items){
  const keys=item.part===1?['initialA','initialB']:['initial'];
  for(const key of keys){
   const asset=item.original[key],path=asset.targetPath;
   assert.equal(new Set(path.nodes).size,4);assert.equal(path.segments.length,3);
   for(const [i,segment] of path.segments.entries()){
    assert.deepEqual([segment.u,segment.v],path.nodes.slice(i,i+2));
    assert.ok(item.edges.some(([u,v])=>(u===segment.u&&v===segment.v)||(v===segment.u&&u===segment.v)));
    assert.ok(segment.points.length>=2&&segment.points.flat().every(Number.isFinite));
   }
   const source=drawingSvg(asset,{highlight:path.nodes});assert.equal((source.match(/class="path-highlight"/g)||[]).length,3);
   assert.equal(drawingSvg(asset,{selectable:true}).includes('class="path-highlight"'),false);
  }
 }
});
