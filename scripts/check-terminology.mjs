import assert from 'node:assert/strict';
import {terms} from '../src/data.js';
for(const term of terms){
 assert.ok(!term.name.includes('Token'),'中文标题统一使用词元');
 for(const field of ['summary','detail','example'])assert.ok(!term[field].includes('词元（词元）'));
 assert.ok(Array.isArray(term.aliases));
}
for(const [id,name]of Object.entries({'input-tokens':'输入词元','output-tokens':'输出词元','next-token-prediction':'下一词元预测','inference':'模型推理','harness':'智能体运行框架','mcp':'模型上下文协议','agents':'AGENTS.md 指令文件'}))assert.equal(terms.find(t=>t.id===id).name,name);
assert.ok(terms.find(t=>t.id==='inference').detail.includes('reasoning'));
assert.ok(terms.find(t=>t.id==='smart-zone').detail.includes('比喻')||terms.find(t=>t.id==='smart-zone').summary.includes('比喻'));
console.log('通过：词元命名、关键概念区分与搜索别名格式。');
