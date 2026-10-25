import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { terms } from '../src/data.js';
const titles=new Set();
for(const t of terms){
 const html=await readFile(`dist/terms/${t.id}/index.html`,'utf8');
 const title=html.match(/<title>(.*?)<\/title>/)?.[1];
 assert(title?.includes(t.name)&&title.includes(t.en));assert(!titles.has(title));titles.add(title);
 assert(html.includes(t.summary));assert(html.includes(t.detail));assert(html.includes(t.example));
 const canonical=html.match(/rel="canonical" href="([^"]+)"/)?.[1];
 assert(canonical?.endsWith(`/terms/${t.id}/`));
 const json=html.match(/id="term-schema">(.*?)<\/script>/)?.[1];assert.equal(JSON.parse(json).url,canonical);
 assert(html.includes('<h1>'));assert(html.includes('<a href='));
}
const sitemap=await readFile('dist/sitemap.xml','utf8');assert.equal((sitemap.match(/<loc>/g)||[]).length,terms.length+1);
console.log(`通过：${terms.length} 个静态正文、独立标题、规范链接、结构化数据和 sitemap。`);
