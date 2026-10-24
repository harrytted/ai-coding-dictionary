import assert from 'node:assert/strict';
import {terms,related} from '../src/data.js';
import {ForceGraph} from '../src/force.js';
const create=()=>new ForceGraph(terms,t=>related(t).map(t=>t.id));
const sim=create();sim.configure('agent',related(terms.find(t=>t.id==='agent')).map(t=>t.id),800,500);
for(let i=0;i<120;i++)sim.step(16);
const before=sim.nodes.map(n=>[n.x,n.y,n.vx,n.vy]);
sim.configure('model',related(terms.find(t=>t.id==='model')).map(t=>t.id),800,500);
assert.deepEqual(sim.nodes.map(n=>[n.x,n.y,n.vx,n.vy]),before,'切换不得重置位置或速度');
sim.step(16);
assert.ok(sim.nodes.every((n,i)=>Math.hypot(n.x-before[i][0],n.y-before[i][1])<16),'单帧位移有界');
for(const id of ['spec','agent','model','mcp','context-window']){
 sim.configure(id,related(terms.find(t=>t.id===id)).map(t=>t.id),800,500);
 for(let i=0;i<100;i++)sim.step(16);
 assert.ok(sim.nodes.every(n=>[n.x,n.y,n.vx,n.vy].every(Number.isFinite)));
}
const center=sim.byId.get('context-window'),distances=[...sim.neighbors].map(id=>{const n=sim.byId.get(id);return Math.hypot(n.x-center.x,n.y-center.y);});
assert.ok(Math.max(...distances)-Math.min(...distances)>25,'关联节点不得落在固定半径上');
const paused=sim.nodes.map(n=>[n.x,n.y]);sim.step(16,true);assert.deepEqual(sim.nodes.map(n=>[n.x,n.y]),paused);
const resized=sim.nodes.map(n=>[n.x,n.y]);sim.configure('context-window',[...sim.neighbors],580,260);assert.deepEqual(sim.nodes.map(n=>[n.x,n.y]),resized,'尺寸变化不应立即改写坐标');
sim.settle();assert.ok(sim.nodes.every(n=>n.x>=0&&n.x<=580&&n.y>=0&&n.y<=260));
console.log('通过：切换时位置与速度连续、单帧移动有界、快速切换稳定、非固定半径、悬停暂停、尺寸适应。');
