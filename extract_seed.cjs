const fs=require('fs');
const s=fs.readFileSync('index.html','utf8');
const m=s.match(/const initial=(\[[\s\S]*?\]);\s*const CATS=/);
if(!m)throw new Error('initial array not found');
const entries=Function('TODAY','return '+m[1])('2026-10-26');
fs.mkdirSync('data',{recursive:true});
fs.writeFileSync('data/catalog_seed.json',JSON.stringify(entries,null,2)+'\n');
console.log('Seeded',entries.length,'entries');
