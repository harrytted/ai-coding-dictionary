import assert from 'node:assert/strict';
import {recordVisit,showStats,readStats,statsMarkup} from '../src/stats.js';
const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
let sequence=0;const randomId=()=>String(++sequence).padStart(32,'0');
const stats=(visits,visitors)=>({visits,visitors,today_visits:visits,today_visitors:visitors,date:'2026-10-25',timezone:'Asia/Shanghai'});
const visitors=new Set(),events=new Set(),calls=[];
const fetchImpl=async(url,options)=>{
 calls.push({url,options});
 const {visitor_id,event_id}=JSON.parse(options.body);
 visitors.add(visitor_id);events.add(event_id);
 return {ok:true,json:async()=>stats(events.size,visitors.size)};
};
assert.deepEqual(await recordVisit('/api/',{fetchImpl,storage,randomId}),stats(1,1));
assert.deepEqual(await recordVisit('/api/',{fetchImpl,storage,randomId}),stats(2,1));
assert.equal(calls[0].url,'/api/visit');
assert.equal(calls[0].options.cache,'no-store');
assert.notEqual(JSON.parse(calls[0].options.body).event_id,JSON.parse(calls[1].options.body).event_id);
const fallback=await recordVisit('/api',{storage,randomId,fetchImpl:async(url)=>{
 if(url.endsWith('/visit'))throw new Error('offline');
 return {ok:true,json:async()=>stats(12,7)};
}});
assert.equal(fallback.visits,12);
await recordVisit('/api',{storage:{getItem(){throw Error();},setItem(){throw Error();}},randomId,fetchImpl});
await assert.rejects(()=>recordVisit('/api',{randomId,fetchImpl:async()=>({ok:true,json:async()=>({visits:1,visitors:3})})}));
let method;await readStats('/api',{fetchImpl:async(_url,options)=>{method=options.method;return {ok:true,json:async()=>stats(2,1)};}});assert.equal(method,undefined,'定时读取不能使用 POST 增加计数');
const markup=statsMarkup({...stats(1234,56),today_visits:8,today_visitors:3});
for(const label of ['今日访问','今日访客','累计访问','累计访客','1,234'])assert.ok(markup.includes(label));
const element={hidden:true,textContent:''};await showStats(element,undefined);assert.equal(element.hidden,true);
console.log('通过：重复浏览去重、页面事件区分、无缓存读取、离线回退和浏览器存储受限处理。');
