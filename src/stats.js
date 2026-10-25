// One page load is one visit; SPA term switches only change the selected term.
export function anonymousId(){
 return [...crypto.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
}
async function requestStats(endpoint,path,fetchImpl,options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{
  const response=await fetchImpl(`${endpoint.replace(/\/$/,'')}/${path}`,{...options,signal:controller.signal,cache:'no-store',credentials:'same-origin'});
  if(!response.ok)throw new Error('Statistics unavailable');
  const data=await response.json();
  if(!['visits','visitors','today_visits','today_visitors'].every(key=>Number.isSafeInteger(data[key])&&data[key]>=0)
   ||data.visits<data.visitors||data.today_visits<data.today_visitors||data.today_visits>data.visits||data.today_visitors>data.visitors
   ||!/^\d{4}-\d{2}-\d{2}$/.test(data.date)||data.timezone!=='Asia/Shanghai')throw new Error('Invalid statistics');
  return data;
 }finally{clearTimeout(timer);}
}
export function readStats(endpoint,{fetchImpl=fetch}={}){
 return requestStats(endpoint,'stats',fetchImpl);
}
export async function recordVisit(endpoint,{fetchImpl=fetch,storage,randomId=anonymousId}={}){
 let visitor;
 try{visitor=storage?.getItem('dictionary-visitor');}catch{}
 if(!/^[a-f0-9]{32}$/.test(visitor||'')){
  visitor=randomId();
  try{storage?.setItem('dictionary-visitor',visitor);}catch{}
 }
 const event=randomId();
 try{return await requestStats(endpoint,'visit',fetchImpl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor_id:visitor,event_id:event})});}
 catch{return readStats(endpoint,{fetchImpl});}
}
export function statsMarkup(stats){
 const number=new Intl.NumberFormat('zh-CN');
 return `<dl class="stats-grid">${[['今日访问',stats.today_visits,'次'],['今日访客',stats.today_visitors,'位'],['累计访问',stats.visits,'次'],['累计访客',stats.visitors,'位']].map(([label,value,unit])=>`<div><dt>${label}</dt><dd>${number.format(value)}<span>${unit}</span></dd></div>`).join('')}</dl>`;
}
export async function showStats(element,endpoint){
 if(!endpoint)return;
 element.hidden=false;
 element.innerHTML='<span class="stats-status">访问统计加载中…</span>';
 const render=stats=>{const html=statsMarkup(stats);if(element.innerHTML!==html)element.innerHTML=html;};
 const unavailable=()=>{element.innerHTML='<span class="stats-status">访问统计暂不可用</span>';};
 try{
  let storage;try{storage=localStorage;}catch{}
  render(await recordVisit(endpoint,{storage}));
 }catch{unavailable();}
 // GET refreshes never increment visits. This also updates the date after Beijing midnight.
 let pending=false;
 const refresh=async()=>{
  if(document.hidden||pending)return;
  pending=true;
  try{render(await readStats(endpoint));}catch{unavailable();}finally{pending=false;}
 };
 const timer=setInterval(refresh,60000);
 document.addEventListener('visibilitychange',refresh);
 return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
}
