import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { terms, categories, related } from '../src/data.js';
const origin = 'https://agent.harrylab.cn';
const template = await readFile('dist/index.html', 'utf8');
const base = template.match(/src="([^"]+)assets\//)?.[1];
if (!base || !base.startsWith('/')) throw new Error('Cannot determine build base');
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url = t => origin + base + (t ? `terms/${t.id}/` : '');
const link = t => `<a href="${url(t)}">${esc(t.name)} · ${esc(t.en)}</a>`;
function page(t) {
 const title = t ? `${t.name} · ${t.en} | AI 编程词典` : 'AI 编程词典 · 中文版';
 const description = t ? `${t.name}（${t.en}）：${t.summary}` : '用中文理解 AI 编程的 71 个核心术语。探索模型、智能体、上下文、工具、记忆与协作之间的联系。';
 const body = t ? `<article><h1>${esc(t.name)} · ${esc(t.en)}</h1><p>${esc(t.summary)}</p><h2>详细说明</h2><p>${esc(t.detail)}</p><h2>使用示例</h2><p>${esc(t.example)}</p><h2>关联词条</h2><ul>${related(t).map(x=>`<li>${link(x)}</li>`).join('')}</ul><p><a href="${url()}">浏览全部词条</a></p></article>` : `<h1>AI 编程词典 · 中文版</h1><p>${esc(description)}</p>${categories.map(c=>`<section><h2>${esc(c.name)}</h2><ul>${terms.filter(t=>t.category===c.id).map(t=>`<li>${link(t)}<p>${esc(t.summary)}</p></li>`).join('')}</ul></section>`).join('')}`;
 const schema = t ? {'@context':'https://schema.org','@type':'DefinedTerm',name:t.name,alternateName:t.en,description:t.summary,url:url(t),inDefinedTermSet:{'@type':'DefinedTermSet',name:'AI 编程词典',url:url()}} : {'@context':'https://schema.org','@type':'DefinedTermSet',name:'AI 编程词典',url:url(),description};
 return template.replace(/<title>.*?<\/title>/,`<title>${esc(title)}</title>`).replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${esc(description)}">`).replace('</head>',`<link rel="canonical" href="${url(t)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url(t)}"><meta property="og:type" content="website"><script type="application/ld+json" id="term-schema">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head>`).replace('<div id="app"></div>',`<div id="app"><main style="max-width:760px;margin:40px auto;padding:24px;font:16px/1.9 system-ui">${body}</main></div>`);
}
await writeFile('dist/index.html',page());
for (const t of terms) {await mkdir(`dist/terms/${t.id}`,{recursive:true});await writeFile(`dist/terms/${t.id}/index.html`,page(t));}
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[null,...terms].map(t=>`<url><loc>${esc(url(t))}</loc></url>`).join('')}</urlset>`);
await writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${origin}${base}sitemap.xml\n`);
console.log(`SEO: generated ${terms.length} term pages and sitemap`);
