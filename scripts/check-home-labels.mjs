import assert from 'node:assert/strict';
import {terms,related} from '../src/data.js';
import {ForceGraph} from '../src/force.js';
import {placeLabels,selectHomeLabels} from '../src/layout.js';
let cases=0;
for(const [width,height]of [[900,520],[580,344],[390,280]]){
 const sim=new ForceGraph(terms,t=>related(t).map(t=>t.id));sim.configure(null,[],width,height);sim.settle(120);
 const ids=selectHomeLabels(sim.nodes,width,height),roster=new Set(ids);let previous=new Map();
 for(let frame=0;frame<80;frame++){
  sim.step(16);
  assert.deepEqual(selectHomeLabels(sim.nodes,width,height),ids,'运动不能改变首页标签集合');
  const nodes=sim.nodes.map(n=>({...n,showLabel:roster.has(n.term.id),priority:roster.has(n.term.id)?60:1,labelWidth:Math.max(n.term.name.length*13,n.term.en.length*7.1)+10,labelHeight:37}));
  const labels=placeLabels(nodes,width,height,previous);previous=labels;
  for(const id of ids)assert.ok(labels.has(id),`首页标签不能忽隐忽现：${id}`);
  const boxes=[...labels.values()];
  for(const a of boxes){assert.ok(a.x>=0&&a.y>=0&&a.x+a.width<=width&&a.y+a.height<=height);for(const b of boxes)if(a!==b)assert.ok(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y));}
  cases++;
 }
}
const cache=terms.find(t=>t.id==='cache-tokens');assert.equal(cache.name,'缓存命中词元');assert.ok(cache.aliases.includes('缓存 Token'));
console.log(`通过：${cases} 帧首页运动中标签集合稳定、完整可见、不重叠且不越界；旧译名仍可搜索。`);
