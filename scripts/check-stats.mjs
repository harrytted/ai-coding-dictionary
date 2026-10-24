import assert from 'node:assert/strict';
import {recordVisit,showStats} from '../src/stats.js';
const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
let sequence=0;const randomId=()=>String(++sequence).padStart(32,'0');
const visitors=new Set(),events=new Set(),calls=[];
const fetchImpl=async(url,options)=>{
 calls.push({url,options});
 const {visitor_id,event_id}=JSON.parse(options.body);
 visitors.add(visitor_id);events.add(event_id);
 return {ok:true,json:async()=>({visits:events.size,visitors:visitors.size})};
};
assert.deepEqual(await recordVisit('/api/',{fetchImpl,storage,randomId}),{visits:1,visitors:1});
assert.deepEqual(await recordVisit('/api/',{fetchImpl,storage,randomId}),{visits:2,visitors:1});
assert.equal(calls[0].url,'/api/visit');
assert.equal(calls[0].options.cache,'no-store');
assert.notEqual(JSON.parse(calls[0].options.body).event_id,JSON.parse(calls[1].options.body).event_id);
const fallback=await recordVisit('/api',{storage,randomId,fetchImpl:async(url)=>{
 if(url.endsWith('/visit'))throw new Error('offline');
 return {ok:true,json:async()=>({visits:12,visitors:7})};
}});
assert.equal(fallback.visits,12);
await recordVisit('/api',{storage:{getItem(){throw Error();},setItem(){throw Error();}},randomId,fetchImpl});
await assert.rejects(()=>recordVisit('/api',{randomId,fetchImpl:async()=>({ok:true,json:async()=>({visits:1,visitors:3})})}));
const element={hidden:true,textContent:''};await showStats(element,undefined);assert.equal(element.hidden,true);
console.log('通过：重复浏览去重、页面事件区分、无缓存读取、离线回退和浏览器存储受限处理。');
