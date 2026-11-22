import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../study.mjs',import.meta.url),'utf8');
const finishSource=source.slice(source.indexOf('async function finish(status)'),source.indexOf("$('#withdraw').onclick"));
function setup(failed){
  const storage=new Map(),handlers={},elements=new Map();
  const context={activeTrial:null,session:{id:'test-session',answers:[{correct:true}],uploadFailed:failed},service:'https://results.example',
    STORAGE_KEY:'test',nowIso:()=>new Date().toISOString(),logEvent:()=>{},uploadQueue:Promise.resolve(),
    main:{innerHTML:''},escapeHtml:String,downloadJson:()=>{},
    sessionStorage:{setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    $:selector=>{if(!elements.has(selector))elements.set(selector,{hidden:false,addEventListener:(event,fn)=>{handlers[selector]=fn;}});return elements.get(selector);},
    save:()=>{storage.set('test',JSON.stringify(context.session));},
  };
  vm.createContext(context);vm.runInContext(finishSource,context);
  return {context,storage,handlers};
}
test('failed final upload retains the response backup and offers a retry',async()=>{
  const {context,storage,handlers}=setup(true);
  await context.finish('complete');
  assert.equal(JSON.parse(storage.get('test')).answers.length,1);
  assert.equal(typeof handlers['#retry-save'],'function');
  context.session.uploadFailed=false;
  await handlers['#retry-save']();
  assert.equal(storage.has('test'),false);
});
test('confirmed final save clears the temporary backup',async()=>{
  const {context,storage}=setup(false);
  await context.finish('complete');
  assert.equal(storage.has('test'),false);
});
