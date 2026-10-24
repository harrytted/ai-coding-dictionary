import assert from 'node:assert/strict';
import { approach, drift, along } from '../src/motion.js';
// Equal elapsed time at different frame rates must yield the same position.
const simulate = (dt, n) => {let x=0;for(let i=0;i<n;i++)x=approach(x,100,dt);return x;};
assert.ok(Math.abs(simulate(16,60)-simulate(32,30))<1e-9);
assert.ok(simulate(16,60)>99 && simulate(16,60)<100);
// A second target continues from the current position without a teleport or overshoot.
let x=simulate(16,10),previous=x;
x=approach(x,-100,16);
assert.ok(x<previous && x>-100);
for(let i=0;i<100;i++)x=approach(x,-100,16);
assert.ok(Math.abs(x+100)<.01);
assert.equal(approach(10,20,0),10);
assert.ok(Object.values(drift(1,200,0)).every(v=>Math.abs(v)===0));
for(let i=0;i<71;i++) {const d=drift(i,50000);assert.ok(Math.abs(d.x)<=9 && Math.abs(d.y)<=7);}
const a={x:14,y:80},b={x:212,y:-50};
assert.deepEqual(along(a,b,0),a);assert.deepEqual(along(a,b,1),b);
assert.deepEqual(along(a,b,.5),{x:113,y:15});
console.log('通过：帧率一致性、动画中途改向、渐近收敛、漂浮边界、连线端点与粒子插值。');
