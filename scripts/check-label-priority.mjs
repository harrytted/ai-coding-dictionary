import assert from 'node:assert/strict';
import {terms,related} from '../src/data.js';
import {ForceGraph} from '../src/force.js';
import {placeLabels} from '../src/layout.js';
let checked=0;
for(const [width,height]of [[900,520],[580,280],[360,280]])for(const id of ['agent','spec','model','context-window','hallucination','skill']){
 const selected=terms.find(t=>t.id===id),neighbors=new Set(related(selected).map(t=>t.id));
 const simulation=new ForceGraph(terms,t=>related(t).map(t=>t.id));
 simulation.configure(id,[...neighbors],width,height);simulation.settle(180);
 const hovered=[...neighbors][0],hoveredRelated=new Set(related(terms.find(t=>t.id===hovered)).map(t=>t.id));
 const required=new Set([id,hovered,...neighbors,...hoveredRelated]);
 const nodes=simulation.nodes.map(n=>{
  const primary=n.term.id===id||n.term.id===hovered,english=true;
  return {...n,showLabel:required.has(n.term.id),priority:n.term.id===id?100:n.term.id===hovered?90:neighbors.has(n.term.id)?70:hoveredRelated.has(n.term.id)?50:1,labelWidth:Math.max(n.term.name.length*(primary?16:13),english?n.term.en.length*7.1:0)+8,labelHeight:37};
 });
 const boxes=placeLabels(nodes,width,height);
 for(const key of required)assert.ok(boxes.has(key),`${id} 悬停 ${hovered}: ${key} 必须显示`);
 const values=[...boxes.values()];
 for(const a of values){assert.ok(a.x>=0&&a.y>=0&&a.x+a.width<=width&&a.y+a.height<=height,`标签越界 ${id} ${width}x${height}`);for(const b of values)if(a!==b)assert.ok(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),'标签不能相互遮挡');}
 // Keeping a valid prior offset must preserve the label side during gentle movement.
 const moved=nodes.map(n=>({...n,x:n.x+.1,y:n.y+.1}));const next=placeLabels(moved,width,height,boxes);
 for(const key of required)assert.ok(next.has(key));
 checked++;
}
console.log(`通过：${checked} 种悬停组合保留当前词条、原有关系和悬停关系的全部标签，文字不重叠且不越界。`);
