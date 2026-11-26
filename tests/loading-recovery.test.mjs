import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {readStudyJson} from '../study-json.mjs';

test('startup recovers when HTML is returned before valid JSON',async()=>{
 let calls=0;
 const data=await readStudyJson('study-config.json',{wait:async()=>{},fetcher:async()=>new Response(++calls===1?' <!DOCTYPE html><title>Error</title>':'{"version":"ok"}')});
 assert.deepEqual(data,{version:'ok'});assert.equal(calls,2);
});
test('permanent HTML failures identify the file without exposing a JSON parse exception',async()=>{
 let calls=0;
 await assert.rejects(readStudyJson('stimuli.json',{wait:async()=>{},fetcher:async()=>{calls++;return new Response('<!DOCTYPE html>');}}),/Could not load stimuli.json.*web page.*try again/);
 assert.equal(calls,3);
});
test('HTTP failures are retried and truncated JSON is reported clearly',async()=>{
 let calls=0;
 await assert.rejects(readStudyJson('response-service.json',{wait:async()=>{},fetcher:async()=>new Response(++calls===1?'missing':'{',{status:calls===1?503:200})}),/incomplete study data/);
 assert.equal(calls,3);
});
test('Part 2 loading failure uses its stage and retries without losing answers',()=>{
 const source=readFileSync(new URL('../study.mjs',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('function technicalProblem('),source.indexOf('// ---------------------------------------------------------------- Part 1'));
 const elements=new Map();const $=id=>id==='#stage-area'?null:(elements.get(id)||elements.set(id,{}).get(id));
 const earlier={position:1,correct:true};let retries=0,advanced=0;
 const context={session:{position:5,answers:[earlier]},activeTrial:{cleanup(){}},main:{},$,escapeHtml:String,describe:()=>({part:2}),logEvent(){},save(){},next(){advanced++;},part2Question:s=>{assert.equal(s.type,'part2');retries++;},part1Question(){throw Error('Wrong part');}};
 vm.runInNewContext(fn+';technicalProblem({type:"part2"},"Video failed")',context);
 assert.match($('#stage').innerHTML,/Try again/);assert.equal($('#phase').textContent,'Loading failed');
 $('#retry-question').onclick();assert.equal(retries,1);assert.equal(advanced,0);assert.deepEqual(context.session.answers,[earlier]);
 vm.runInNewContext('technicalProblem({type:"part2"},"Video failed again")',context);
 $('#skip').onclick();$('#skip').onclick();assert.equal(advanced,1);assert.equal(context.session.answers.length,2);assert.equal(context.session.answers[1].technicalInvalid,true);
});
