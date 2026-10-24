import assert from 'node:assert/strict';
import { categories, terms, related } from '../src/data.js';
assert.equal(terms.length, 71);
assert.equal(categories.length, 7);
assert.equal(new Set(terms.map(t=>t.id)).size, terms.length);
for (const t of terms) {
 for (const k of ['id','en','name','summary','detail','example']) assert.ok(t[k]?.trim(), `${t.id} 缺少 ${k}`);
 assert.ok(categories.some(c=>c.id===t.category));
 assert.ok(related(t).length > 0);
 assert.ok(related(t).length<=9);
 for (const r of related(t)) {assert.notEqual(r.id,t.id);assert.ok(terms.includes(r));assert.ok(related(r).some(back=>back.id===t.id),`${t.id} 与 ${r.id} 的关系必须双向一致`);}
}
assert.equal(terms.find(t=>t.id==='spec').name,'需求规格说明');
assert.ok(!related(terms.find(t=>t.id==='sycophancy')).some(t=>t.id==='attention-relationship'),'不能按分类顺序补出不明确的关联');
console.log('通过：71 个完整词条、7 个分类、唯一 URL 标识和有效关联。');
