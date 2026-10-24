// One page load is one visit; SPA term switches do not send another event.
export function anonymousId(){
 return [...crypto.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
export async function recordVisit(endpoint,{fetchImpl=fetch,storage,randomId=anonymousId}={}){
 let visitor;
 try{visitor=storage?.getItem('dictionary-visitor');}catch{}
 if(!/^[a-f0-9]{32}$/.test(visitor||'')){
  visitor=randomId();
  try{storage?.setItem('dictionary-visitor',visitor);}catch{}
 }
 const event=randomId();
 const request=async(path,options={})=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
  try{
   const response=await fetchImpl(`${endpoint.replace(/\/$/,'')}/${path}`,{...options,signal:controller.signal,cache:'no-store',credentials:'same-origin'});
   if(!response.ok)throw new Error('Statistics unavailable');
   const data=await response.json();
   if(!Number.isSafeInteger(data.visits)||!Number.isSafeInteger(data.visitors)||data.visitors<0||data.visits<data.visitors)throw new Error('Invalid statistics');
   return data;
  }finally{clearTimeout(timer);}
 };
 try{return await request('visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor_id:visitor,event_id:event})});}
 catch{return request('stats');}
}
export async function showStats(element,endpoint){
 if(!endpoint)return;
 element.hidden=false;
 element.textContent='访问统计加载中…';
 try{
  let storage;try{storage=localStorage;}catch{}
  const stats=await recordVisit(endpoint,{storage}),number=new Intl.NumberFormat('zh-CN');
  element.textContent=`累计访问 ${number.format(stats.visits)} 次 · 累计访客 ${number.format(stats.visitors)} 位`;
 }catch{element.textContent='访问统计暂不可用';}
}
