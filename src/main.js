import './style.css';
import { createClickSound } from './sound.js';
import { approach, along, spring } from './motion.js';
import { ForceGraph } from './force.js';
import { placeLabels, selectHomeLabels } from './layout.js';
import { categories, terms, related } from './data.js';

const $ = s => document.querySelector(s);
const icon = (type) => ({sound:'<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',muted:'<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="m16 9 6 6m0-6-6 6"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',prev:'<path d="m14 5-7 7 7 7"/>',next:'<path d="m10 5 7 7-7 7"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.1M3 12h.1M3 18h.1"/>',graph:'<circle cx="12" cy="12" r="3"/><circle cx="4" cy="4" r="2"/><circle cx="20" cy="5" r="2"/><circle cx="5" cy="20" r="2"/><path d="m6 6 4 4m4-1 4-3M7 18l3-4"/>',palette:'<circle cx="8" cy="8" r=".7"/><circle cx="14" cy="6" r=".7"/><circle cx="18" cy="10" r=".7"/><path d="M12 22a10 10 0 1 1 10-10c0 4-5 1-6 4-1 2 2 6-4 6Z"/>',link:'<path d="m9 15 6-6M8 17l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2-1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0" transform="translate(1 0) scale(.92)"/>',pause:'<path d="M9 5v14M15 5v14"/>',play:'<path d="m8 5 11 7-11 7V5Z"/>',reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',shuffle:'<path d="M3 6h3l12 12h3m-4-4 4 4-4 4M3 18h3l4-4m4-4 4-4h3m-4-4 4 4-4 4"/>'}[type] || '') ;
const svgIcon = type => `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon(type)}</svg>`;
const clickSound=createClickSound();
let current = terms.find(t => t.id === new URLSearchParams(location.search).get('term')) || null;
let category = 'all';
let view = 'graph';
let theme = 'paper';
try { theme = localStorage.getItem('dictionary-theme') || 'paper'; } catch {}
if (!['paper','ink','color'].includes(theme)) theme = 'paper';
document.documentElement.dataset.theme = theme;

$('#app').innerHTML = `
<a class="skip" href="#network">跳至关系图</a>
<main class="workspace ${current ? 'has-detail' : ''}">
 <section class="explore" aria-label="术语探索">
  <header class="toolbar"><button class="round" id="open-search" aria-label="搜索术语" title="搜索术语（/）">${svgIcon('search')}</button><button class="brand" id="home">AI 编程词典</button><button class="round" id="sound" aria-label="关闭点击音效" title="关闭点击音效" aria-pressed="true">${svgIcon('sound')}</button><button class="round" id="motion" aria-label="暂停节点运动" title="暂停节点运动" aria-pressed="false">${svgIcon('pause')}</button><button class="round" id="about" aria-label="关于词典">i</button></header>
  <div class="intro"><span class="eyebrow">从一个词，理解整个系统</span><h1>AI 编程，<br>有迹可循。</h1><p>71 个概念，7 个主题。</p></div>
  <div id="graph" class="graph"><svg id="network" tabindex="-1" viewBox="0 0 1000 800" role="group" aria-label="AI 编程术语关系图" aria-keyshortcuts="+ - 0"><g id="edges"></g><g id="nodes"></g><g id="labels" aria-hidden="true"></g></svg></div>
  <div id="list-view" class="list-view" hidden></div>
  <footer class="explore-footer"><div class="graph-hint">点击探索<span> · </span>滚动缩放<span> · </span>拖动平移</div><div class="view-tools"><button class="round" id="reset-view" aria-label="复位画板" title="复位画板">${svgIcon('reset')}</button><button class="round" id="random" aria-label="随机探索一个术语" title="随机探索">${svgIcon('shuffle')}</button><button class="round" id="toggle-view" aria-label="切换列表视图" title="图谱 / 列表">${svgIcon('list')}</button><button class="round" id="theme" aria-label="切换配色" title="纸白 / 墨黑 / 分类色">${svgIcon('palette')}</button></div></footer>
  <nav class="categories" aria-label="术语分类"><button data-category="all" class="active" aria-pressed="true">全部 <span>71</span></button>${categories.map(c => `<button data-category="${c.id}" aria-pressed="false"><i style="--dot:${c.color}"></i>${c.name}</button>`).join('')}</nav>
 </section>
 <aside class="detail" id="definition" aria-label="词条释义" tabindex="-1" hidden></aside>
</main>
<dialog id="search-dialog" aria-label="搜索词条"><div class="search-head">${svgIcon('search')}<input id="search-input" name="term-search" spellcheck="false" aria-label="搜索中英文术语" placeholder="搜索中文、英文或概念…" autocomplete="off"><button class="text-button" id="close-search" aria-label="关闭搜索">ESC</button></div><div class="search-meta">探索词典 <span id="result-count" aria-live="polite"></span></div><div id="results"></div><div class="search-foot">↑ ↓ 选择 <span>↵ 打开词条</span></div></dialog>
<dialog id="about-dialog" aria-labelledby="about-title"><button class="round about-close" aria-label="关闭关于">${svgIcon('close')}</button><span class="eyebrow">关于这份词典</span><h2 id="about-title">把概念，连成理解。</h2><p>这是一份面向 AI 编程学习者的中文词典。用关系图浏览概念，也可以直接搜索中英文术语。</p><p>术语范围与分类参考 <a href="https://www.aicodingdictionary.com/" target="_blank" rel="noreferrer">The AI Coding Dictionary ↗</a>。中文释义、例子及关系图由本项目独立编写与实现，并非官方译本。部分用语属于经验性比喻，具体能力和限制取决于工具实现。</p><div class="about-numbers"><span><b>71</b>核心词条</span><span><b>7</b>知识主题</span><span><b>中文</b>理解优先</span></div><p class="muted">快捷键：/ 搜索 · Esc 关闭 · ← → 切换词条（页面焦点）<br>画板快捷键：+ / − 缩放 · 0 复位<br>关系表示概念联系，不代表严格的技术依赖。</p></dialog>
<div class="toast" role="status" aria-live="polite"></div>`;

const ns = 'http://www.w3.org/2000/svg';
let transform = {x:0,y:0,k:1};
function nodeElement(tag, attrs) {
 const el = document.createElementNS(ns, tag);
 for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
 return el;
}
const nodeViews = new Map();
const edgeViews = new Map();
const simulation=new ForceGraph(terms,term=>related(term).map(t=>t.id));
let previousLabels=new Map(),labelTime=0;
let homeRoster=new Set(),homeRosterKey='';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let cameraTarget = {...transform};
let frame = 0, lastFrame = 0, motionTime = 0;
let graphInitialized = false;
let motionPaused = false;
let hovered=null,scene={width:800,height:540};
const labelCanvas=document.createElement('canvas').getContext('2d');
function refreshLabels(){
 const active=hovered||current?.id;
 const connected=new Set(active?related(terms.find(t=>t.id===active)).map(t=>t.id):[]);
 const selectedRelated=new Set(current?related(current).map(t=>t.id):[]);
 const rosterKey=`${category}:${Math.floor(scene.width*scene.height/18000)}`;
 if(!current&&homeRosterKey!==rosterKey){
  homeRoster=new Set(selectHomeLabels([...nodeViews.values()].map(item=>item.target),scene.width,scene.height,category));
  homeRosterKey=rosterKey;
 }
 const nodes=[...nodeViews.values()].map(item=>{
  const id=item.target.term.id,primary=id===current?.id||id===hovered;
  const selectedNeighbor=selectedRelated.has(id),neighbor=connected.has(id);
  const overview=!current&&homeRoster.has(id);
  const required=primary||selectedNeighbor||neighbor||overview;
  labelCanvas.font=`${primary?600:500} ${primary?16:13}px "PingFang SC", sans-serif`;
  const showEnglish=true;
  const chineseWidth=labelCanvas.measureText(item.target.term.name).width;
  labelCanvas.font='500 11px ui-monospace, monospace';
  const englishWidth=labelCanvas.measureText(item.target.term.en.toUpperCase()).width+item.target.term.en.length*.28;
  const labelWidth=Math.max(chineseWidth,englishWidth)+10;
  return {...item.target,showLabel:required,priority:id===current?.id?100:id===hovered?90:selectedNeighbor?70:overview?60:neighbor?50:1,labelWidth,labelHeight:37,primary,showEnglish};
 });
 const labels=placeLabels(nodes,scene.width,scene.height,previousLabels);
 previousLabels=labels;
 for(const [id,item]of nodeViews){
  item.labelBox=labels.get(id);item.primary=id===current?.id||id===hovered;item.showEnglish=true;
  if(item.labelBox)item.labelOffset={x:item.labelBox.x+item.labelBox.width/2-item.target.x,y:item.labelBox.y-item.target.y};
  item.g.classList.toggle('hover-related',!!hovered&&(id===hovered||connected.has(id)));
  item.g.classList.toggle('hover-muted',!!hovered&&id!==hovered&&!connected.has(id));
  item.g.classList.toggle('hovered',id===hovered);
  item.g.classList.toggle('label-primary',item.primary);
  item.labelG.setAttribute('class',['node-labels',...item.g.classList].filter(name=>name!=='node').join(' '));
 }
 for(const edge of edgeViews.values()){
  const linked=active&&(edge.a===active&&connected.has(edge.b)||edge.b===active&&connected.has(edge.a));
  const relevant=category==='all'||[edge.a,edge.b].every(id=>nodeViews.get(id).target.term.category===category);
  edge.targetOpacity=relevant?(linked?1:active?.035:.25):.015;
  edge.targetDots=linked?1:0;
  edge.line.setAttribute('class',linked?'edge focused':'edge');
  edge.g.classList.toggle('hover-edge',!!hovered&&!!linked);
 }
 $('#network').classList.toggle('is-hovering',!!hovered);
}
function hoverNode(id){
 if(hovered===id)return;hovered=id;
 refreshLabels();

 if(reducedMotion.matches||motionPaused)paintGraph(64);
}

function renderGraph() {
 const connections = current ? related(current).map(t => t.id) : [];
 const rect=$('#graph').getBoundingClientRect();
 if(rect.width>0&&rect.height>0)scene={width:rect.width,height:rect.height};
 $('#network').setAttribute('viewBox',`0 0 ${scene.width} ${scene.height}`);
 const configured=simulation.configure(current?.id,connections,scene.width,scene.height);
 if(reducedMotion.matches&&configured.changed)simulation.settle();
 const positions=configured.nodes;
 // Keep every SVG node alive: selection changes only its target and visual state.
 for (const p of positions) {
  let item = nodeViews.get(p.term.id);
  if (!item) {
   const g = nodeElement('g',{class:'node',tabindex:'0',role:'button','aria-label':`${p.term.name} ${p.term.en}`,'data-id':p.term.id,style:`--category-color:${categories.find(c=>c.id===p.term.category).color}`});
   const title=nodeElement('title',{});title.textContent=`${p.term.name} · ${p.term.en}`;g.append(title);
   const hit=nodeElement('circle',{class:'hit-area'});
   const ring=nodeElement('circle',{class:'selection-ring'});
   const circle=nodeElement('circle',{class:'node-circle'});
   const labelG=nodeElement('g',{'data-label-for':p.term.id,class:'node-labels'});
   const backing=nodeElement('rect',{class:'label-backing',rx:3});
   const leader=nodeElement('line',{class:'label-leader','aria-hidden':'true'});
   const label=nodeElement('text',{'text-anchor':'middle',class:'node-label'});label.textContent=p.term.name;
   const en=nodeElement('text',{'text-anchor':'middle',class:'node-en'});en.textContent=p.term.en.toUpperCase();
   g.append(hit,ring,circle);
   labelG.append(leader,backing,label,en);
   $('#labels').append(labelG);
   g.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')hoverNode(p.term.id);});
   g.addEventListener('pointerleave',()=>hoverNode(null));
   g.addEventListener('focus',()=>hoverNode(p.term.id));
   g.addEventListener('blur',()=>hoverNode(null));
   g.addEventListener('click',()=>{if(!wasDragged)select(p.term.id);});
   g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(p.term.id,true);}});
   $('#nodes').append(g);
   item={g,labelG,backing,hit,ring,circle,leader,label,en,i:p.i,x:p.x,y:p.y,r:p.r,draw:{x:p.x,y:p.y},velocity:{x:0,y:0,r:0}};
   nodeViews.set(p.term.id,item);
  }
  const selected=current?.id===p.term.id, neighbor=connections.includes(p.term.id);
  const visible=category==='all'||p.term.category===category;
  item.target=p;item.strength=selected||neighbor?0:.2;
  item.g.setAttribute('class',`node ${selected?'selected':''} ${neighbor?'neighbor':''} ${current&&!selected&&!neighbor?'faded':''} ${!visible?'filtered':''}`);
  item.g.setAttribute('tabindex',visible?'0':'-1');
  item.g.setAttribute('aria-hidden',String(!visible));
 }
 // Old edges remain while fading out; new ones fade in and follow the same live endpoints.
 for (const edge of edgeViews.values()) edge.targetOpacity=0;
 for (const p of positions) {
  const rel=related(p.term);
  for (const q of rel) {
   const key=[p.term.id,q.id].sort().join(':');
   let edge=edgeViews.get(key);
   if (!edge) {
    const g=nodeElement('g',{'data-edge':key,'aria-hidden':'true'});
    const line=nodeElement('line',{class:'edge'});g.append(line);
    const seed=[...key].reduce((a,c)=>a+c.charCodeAt(0),0);
    const dots=Array.from({length:6+seed%4},(_,j)=>nodeElement('circle',{r:.65+(Math.sin(j*2.1+seed)+1)*.9,class:'edge-dot'}));
    g.append(...dots);$('#edges').append(g);
    edge={g,line,dots,a:p.term.id,b:q.id,opacity:0,dotsOpacity:0,seed};edgeViews.set(key,edge);
   }
   edge.targetOpacity=.2;edge.targetDots=0;
   edge.line.setAttribute('class',current?'edge focused':'edge');
  }
 }
 refreshLabels();
 $('.intro').hidden=!!current || category!=='all' || view==='list';
 graphInitialized=true;
 startMotion();
}
function applyTransform(lockTarget=true){
 if(lockTarget)cameraTarget={...transform};
 for(const id of ['#edges','#nodes','#labels']) $(id).setAttribute('transform',`translate(${transform.x} ${transform.y}) scale(${transform.k})`);
}
function boxOpacity(item){return item.labelBox?1:0;}
function paintGraph(delta) {
 const immediate=reducedMotion.matches||motionPaused;
 if(!immediate)simulation.step(delta,!!hovered||!!drag);
 labelTime+=delta;
 // Re-evaluate live label collisions, preserving each label's previous side when possible.
 if(labelTime>=(simulation.alpha>.15?16:65)){refreshLabels();labelTime=0;}
 for(const item of nodeViews.values()) {
  item.x=item.target.x;item.y=item.target.y;
  if(immediate)item.r=item.target.r;
  else{const state=spring(item.r,item.velocity.r,item.target.r,delta);item.r=state.value;item.velocity.r=state.velocity;}
  item.draw={x:item.x,y:item.y};
  item.g.setAttribute('transform',`translate(${item.x.toFixed(3)} ${item.y.toFixed(3)})`);
  item.labelG.setAttribute('transform',`translate(${item.x.toFixed(3)} ${item.y.toFixed(3)})`);
  item.labelG.style.opacity=boxOpacity(item);
  item.circle.setAttribute('r',item.r);item.hit.setAttribute('r',item.r+9);item.ring.setAttribute('r',item.r+5);
  const box=item.labelBox;
  item.label.style.opacity=box?1:0;item.en.style.opacity=box&&item.showEnglish?1:0;
  item.leader.style.opacity=box&&Math.hypot(item.labelOffset.x,item.labelOffset.y+9)>item.r+32?.3:0;
  item.backing.style.opacity=box?1:0;
  if(box){
   item.backing.setAttribute('x',item.labelOffset.x-box.width/2);item.backing.setAttribute('y',item.labelOffset.y-1);
   item.backing.setAttribute('width',box.width);item.backing.setAttribute('height',box.height+2);
   const dx=item.labelOffset.x,dy=item.labelOffset.y+9,d=Math.hypot(dx,dy)||1;
   item.leader.setAttribute('x1',dx/d*(item.r+3));item.leader.setAttribute('y1',dy/d*(item.r+3));
   item.leader.setAttribute('x2',dx);item.leader.setAttribute('y2',dy);
   item.label.setAttribute('x',item.labelOffset.x);item.label.setAttribute('y',item.labelOffset.y+14);
   item.en.setAttribute('x',item.labelOffset.x);item.en.setAttribute('y',item.labelOffset.y+32);
  }
 }
 for(const [key,edge] of edgeViews) {
  edge.opacity=immediate?edge.targetOpacity:approach(edge.opacity,edge.targetOpacity,delta,180);
  edge.dotsOpacity=immediate?edge.targetDots:approach(edge.dotsOpacity,edge.targetDots,delta,180);
  if(edge.targetOpacity===0&&edge.opacity<.008){edge.g.remove();edgeViews.delete(key);continue;}
  const a=nodeViews.get(edge.a).draw,b=nodeViews.get(edge.b).draw;
  edge.g.setAttribute('opacity',edge.opacity);
  edge.line.setAttribute('x1',a.x);edge.line.setAttribute('y1',a.y);edge.line.setAttribute('x2',b.x);edge.line.setAttribute('y2',b.y);
  edge.dots.forEach((dot,j)=>{
   const progress=(j/edge.dots.length+Math.sin(j*1.7+edge.seed)*.045+(immediate?0:motionTime*.00004*(.7+(edge.seed%9)/12))+1)%1;
   const p=along(a,b,progress);
   dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);
   dot.setAttribute('opacity',edge.dotsOpacity*Math.sin(progress*Math.PI));
  });
 }
 for(const key of ['x','y','k'])transform[key]=immediate?cameraTarget[key]:approach(transform[key],cameraTarget[key],delta);
 applyTransform(false);
}
function startMotion(){
 if(frame||!graphInitialized)return;
 // No background animation while the tab is hidden or the list replaces the graph.
 if(document.hidden||view!=='graph'){paintGraph(64);return;}
 if(reducedMotion.matches||motionPaused){paintGraph(64);return;}
 lastFrame=0;frame=requestAnimationFrame(tick);
}
function tick(time){
 frame=0;
 if(document.hidden||view!=='graph'||motionPaused)return;
 const delta=lastFrame?Math.min(time-lastFrame,64):16;lastFrame=time;motionTime+=delta;
 paintGraph(delta);
 if(!reducedMotion.matches&&!motionPaused)frame=requestAnimationFrame(tick);
}
function restartMotion(){
 cancelAnimationFrame(frame);frame=0;lastFrame=0;startMotion();
}
document.addEventListener('visibilitychange',restartMotion);
reducedMotion.addEventListener('change',restartMotion);
function select(id, focus=false, push=true){
 if(id&&push&&navigator.userActivation?.isActive)void clickSound.play();
 hovered=null;
 current=terms.find(t=>t.id===id)||null;
 if (current && category!=='all' && current.category!==category) setCategory('all',false);
 cameraTarget={x:0,y:0,k:1};
 if(push){const url=new URL(location.href);current?url.searchParams.set('term',current.id):url.searchParams.delete('term');history.pushState({},'',url);}
 $('.workspace').classList.toggle('has-detail',!!current);
 renderGraph();renderDetail();renderList();
 document.title=current?`${current.name} · ${current.en} | AI 编程词典`:'AI 编程词典 · 中文版';
 $('.skip').href=current?'#definition':'#network';$('.skip').textContent=current?'跳至词条内容':'跳至关系图';
 if(focus&&current){const focusedId=current.id;$('#definition').focus({preventScroll:true});requestAnimationFrame(()=>{if(current?.id===focusedId&&!document.querySelector('dialog[open]'))$('#definition').focus({preventScroll:true});});}
}
function renderDetail(){
 const panel=$('#definition');panel.hidden=!current;if(!current){panel.innerHTML='';return;}
 const index=terms.indexOf(current), cat=categories.find(c=>c.id===current.category);
 const prev=terms[(index-1+terms.length)%terms.length],next=terms[(index+1)%terms.length];
 panel.innerHTML=`<div class="detail-scroll"><header class="detail-top"><span>${cat.name}<small>${cat.en}</small></span><span class="counter">${String(index+1).padStart(2,'0')} <em>/ 71</em></span><button class="round" id="close-detail" aria-label="关闭词条">${svgIcon('close')}</button></header><article><p class="term-english">${current.en}</p><h2>${current.name}</h2><p class="summary">${current.summary}</p><section class="definition-section"><h3>进一步理解 <span>IN DETAIL</span></h3><p>${current.detail}</p></section><section class="example"><h3>举个例子 <span>EXAMPLE</span></h3><p>${current.example}</p></section><section class="related"><h3>关联词条 <span>CONNECTED TERMS</span></h3><div>${related(current).map(t=>`<button data-term="${t.id}" aria-label="查看${t.name} ${t.en}"><span class="related-label"><strong>${t.name}</strong><small>${t.en}</small></span><span class="related-arrow" aria-hidden="true">↗</span></button>`).join('')}</div></section><button id="copy-link" class="copy-link">${svgIcon('link')}复制词条链接</button></article></div><nav class="detail-nav" aria-label="前后词条"><button data-term="${prev.id}">${svgIcon('prev')}<span><small>上一个</small>${prev.name}</span></button><button data-term="${next.id}"><span><small>下一个</small>${next.name}</span>${svgIcon('next')}</button></nav>`;
 $('#close-detail').onclick=()=>{select(null);$('#home').focus();};
 panel.querySelectorAll('[data-term]').forEach(el=>el.onclick=()=>select(el.dataset.term,true));
 $('#copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);toast('词条链接已复制');}catch{toast('复制未完成，请从地址栏复制链接');}};
}
function renderList(){
 $('#list-view').innerHTML=categories.filter(c=>category==='all'||category===c.id).map(c=>`<section><h2><i style="--dot:${c.color}"></i>${c.name}<span>${terms.filter(t=>t.category===c.id).length}</span></h2>${terms.filter(t=>t.category===c.id).map(t=>`<button data-term="${t.id}" class="list-term ${current?.id===t.id?'active':''}"><span>${t.name}<small>${t.en}</small></span><p>${t.summary}</p><span class="arrow">↗</span></button>`).join('')}</section>`).join('');
 $('#list-view').querySelectorAll('[data-term]').forEach(b=>b.onclick=()=>select(b.dataset.term,true));
}
function setCategory(id,render=true){hovered=null;if(render&&current&&id!=='all'&&current.category!==id)select(null);category=id;document.querySelectorAll('[data-category]').forEach(b=>{b.classList.toggle('active',b.dataset.category===id);b.setAttribute('aria-pressed',String(b.dataset.category===id));});if(render){renderGraph();renderList();}}
function toast(text){$('.toast').textContent=text;$('.toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('.toast').classList.remove('show'),2300);}
$('#motion').onclick=()=>{motionPaused=!motionPaused;const label=motionPaused?'继续节点运动':'暂停节点运动';$('#motion').innerHTML=svgIcon(motionPaused?'play':'pause');$('#motion').setAttribute('aria-label',label);$('#motion').title=label;$('#motion').setAttribute('aria-pressed',String(motionPaused));restartMotion();};
$('#reset-view').onclick=()=>{transform={x:0,y:0,k:1};applyTransform();};
$('#home').onclick=()=>{setCategory('all',false);select(null);};
$('.categories').querySelectorAll('button').forEach(b=>b.onclick=()=>setCategory(b.dataset.category));
$('#random').onclick=()=>{const pool=terms.filter(t=>(category==='all'||t.category===category)&&t.id!==current?.id);select(pool[Math.floor(Math.random()*pool.length)].id);};
$('#toggle-view').onclick=()=>{view=view==='graph'?'list':'graph';$('#graph').hidden=view==='list';$('#list-view').hidden=view==='graph';$('.graph-hint').hidden=view==='list';$('#toggle-view').innerHTML=svgIcon(view==='graph'?'list':'graph');$('#toggle-view').setAttribute('aria-label',view==='graph'?'切换列表视图':'切换关系图视图');renderGraph();restartMotion();};
$('#theme').onclick=()=>{theme=['paper','ink','color'][(['paper','ink','color'].indexOf(theme)+1)%3];document.documentElement.dataset.theme=theme;try{localStorage.setItem('dictionary-theme',theme);}catch{}toast({paper:'纸白配色',ink:'墨黑配色',color:'分类配色'}[theme]);};
$('#about').onclick=()=>$('#about-dialog').showModal();$('.about-close').onclick=()=>$('#about-dialog').close();
let resultIndex=0, searchResults=[], searchSelection=null;
function chooseSearchResult(id){searchSelection=id;$('#search-dialog').close();select(id);}
$('#search-dialog').addEventListener('close',()=>{const id=searchSelection;searchSelection=null;if(id)requestAnimationFrame(()=>{if(current?.id===id&&!document.querySelector('dialog[open]'))$('#definition').focus({preventScroll:true});});});
function renderResults(){
 const query=$('#search-input').value.trim().toLowerCase();
 searchResults=terms.filter(t=>[t.name,t.en,t.summary,...(t.aliases||[])].some(s=>s.toLowerCase().includes(query)));resultIndex=0;
 $('#result-count').textContent=`${searchResults.length} 个词条`;
 $('#results').innerHTML=searchResults.length?searchResults.map((t,i)=>`<button class="result ${i===0?'highlight':''}" data-term="${t.id}"><span>${t.name}<small>${t.en}</small></span><em>${categories.find(c=>c.id===t.category).name}</em>${svgIcon('next')}</button>`).join(''):'<div class="empty">没有找到相关词条<p>试试“上下文”“Agent”或“工具”。</p></div>';
 $('#results').querySelectorAll('button').forEach(b=>b.onclick=()=>chooseSearchResult(b.dataset.term));
}
function openSearch(){$('#search-dialog').showModal();renderResults();$('#search-input').focus();}
$('#open-search').onclick=openSearch;$('#close-search').onclick=()=>$('#search-dialog').close();$('#search-input').oninput=renderResults;
$('#search-input').onkeydown=e=>{
 if(['ArrowDown','ArrowUp'].includes(e.key)&&searchResults.length){e.preventDefault();resultIndex=(resultIndex+(e.key==='ArrowDown'?1:-1)+searchResults.length)%searchResults.length;const buttons=$('#results').querySelectorAll('button');buttons.forEach((b,i)=>b.classList.toggle('highlight',i===resultIndex));buttons[resultIndex].scrollIntoView({block:'nearest'});}
 if(e.key==='Enter'&&searchResults.length){e.preventDefault();chooseSearchResult(searchResults[resultIndex].id);}
};
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.addEventListener('keydown',e=>{
 if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||document.activeElement.isContentEditable||document.querySelector('dialog[open]')||['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;
 if(e.key==='/'){e.preventDefault();openSearch();}
 if(e.key==='Escape'&&current){select(null);$('#home').focus();}
 if(current&&document.activeElement===document.body&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();select(terms[(terms.indexOf(current)+(e.key==='ArrowRight'?1:-1)+terms.length)%terms.length].id);}
});
window.addEventListener('popstate',()=>select(new URLSearchParams(location.search).get('term'),false,false));
let drag=null,wasDragged=false;
$('#network').addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,tx:transform.x,ty:transform.y};wasDragged=false;});
window.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5){wasDragged=true;const r=$('#network').getBoundingClientRect();const scale=Math.max(scene.width/r.width,scene.height/r.height);transform.x=drag.tx+dx*scale;transform.y=drag.ty+dy*scale;applyTransform();}});
window.addEventListener('pointercancel',()=>{drag=null;wasDragged=false;});
window.addEventListener('pointerup',()=>{drag=null;setTimeout(()=>wasDragged=false,0);});
$('#network').addEventListener('keydown',e=>{if(!['+','=','-','0'].includes(e.key)||e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();if(e.key==='0'){transform={x:0,y:0,k:1};applyTransform();return;}const old=transform.k;transform.k=Math.max(.65,Math.min(2.5,old*(e.key==='-'?.9:1.1)));transform.x=scene.width/2-(scene.width/2-transform.x)*transform.k/old;transform.y=scene.height/2-(scene.height/2-transform.y)*transform.k/old;applyTransform();if(motionPaused||reducedMotion.matches)paintGraph(64);});
$('#network').addEventListener('wheel',e=>{e.preventDefault();const old=transform.k;transform.k=Math.max(.65,Math.min(2.5,old*(e.deltaY>0?.93:1.07)));transform.x=scene.width/2-(scene.width/2-transform.x)*transform.k/old;transform.y=scene.height/2-(scene.height/2-transform.y)*transform.k/old;applyTransform();},{passive:false});
select(current?.id,false,false);

// Reflow after the panel finishes resizing; do not restart layout on every transition frame.
let resizeTimer;
const graphObserver=new ResizeObserver(()=>{
 clearTimeout(resizeTimer);
 resizeTimer=setTimeout(()=>{if(view==='graph'){renderGraph();}},100);
});
graphObserver.observe($('#graph'));

function updateSoundButton(){
 const label=clickSound.enabled?'关闭点击音效':'开启点击音效';
 $('#sound').innerHTML=svgIcon(clickSound.enabled?'sound':'muted');
 $('#sound').setAttribute('aria-label',label);$('#sound').title=label;
 $('#sound').setAttribute('aria-pressed',String(clickSound.enabled));
}
$('#sound').onclick=()=>{const enabled=clickSound.toggle();updateSoundButton();if(enabled)void clickSound.play();};
updateSoundButton();
