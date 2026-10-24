import assert from 'node:assert/strict';
import {terms,related} from '../src/data.js';
import {placeLabels} from '../src/layout.js';
import {ForceGraph} from '../src/force.js';
import {spring} from '../src/motion.js';
let total=0,minimum=100;
for(const [width,height]of [[900,520],[580,280],[360,280]])for(const selected of terms){
 const neighbors=related(selected).map(t=>t.id);
 const simulation=new ForceGraph(terms,t=>related(t).map(t=>t.id));
 simulation.configure(selected.id,neighbors,width,height);simulation.settle(180);
 const nodes=simulation.nodes.map(n=>({...n,showLabel:n.term.id===selected.id||neighbors.includes(n.term.id),priority:n.term.id===selected.id?100:50,labelWidth:Math.max(n.term.name.length*(n.term.id===selected.id?16:13),n.term.en.length*7.1)+8,labelHeight:37}));
 const labelMap=placeLabels(nodes,width,height);
 for(const id of [selected.id,...neighbors])assert.ok(labelMap.has(id),`当前与关联词条应完整可见：${id}（${selected.id} @ ${width}x${height}）`);
 const boxes=[...labelMap.values()];minimum=Math.min(minimum,boxes.length);
 assert.ok(boxes.length>0,`${selected.id} @ ${width}x${height}: ${JSON.stringify(simulation.byId.get(selected.id))}`);
 for(const box of boxes)assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height,`标签越界 ${selected.id}`);
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
  const a=boxes[i],b=boxes[j];assert.ok(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y));
 }
 for(const box of boxes)for(const n of nodes){const x=Math.max(box.x,Math.min(n.x,box.x+box.width)),y=Math.max(box.y,Math.min(n.y,box.y+box.height));if(Math.hypot(n.x-x,n.y-y)<n.r+3.99)assert.ok(box.backed,'拥挤处标签必须有衬底保护');}
 total++;
}
let value=0,velocity=0;
for(let i=0;i<90;i++){const s=spring(value,velocity,100,16);value=s.value;velocity=s.velocity;assert.ok(value<=100);}
assert.ok(Math.abs(value-100)<.001);
const continued=spring(value,velocity,-50,16);assert.ok(continued.value<value&&continued.value>-50);
console.log(`通过：${total} 种词条与屏幕组合，当前与关联标签完整可见且彼此无重叠，拥挤处有衬底；弹性移动收敛。最小可见标签数 ${minimum}。`);
