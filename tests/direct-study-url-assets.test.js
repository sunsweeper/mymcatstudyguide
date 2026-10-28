'use strict';
// Opening or refreshing a /study/... link must load the study stylesheet and scripts (they're referenced relatively).
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const create = require('../tools/preview-server');
const mock = `(()=>{const user={id:'u',email:'u@example.invalid',user_metadata:{}};window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:{user}}}},async getUser(){return {data:{user}}}},from(){return {select(){return this},eq(){return this},async maybeSingle(){return {data:null,error:null}},async upsert(){return {error:null}}}},async rpc(){return {data:null,error:null}}})};})();`;
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch();
  try {
    const ctx = await browser.newContext(); await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: mock }));
    for(const path of ['/study/bio-biochem', '/study/chem-phys/start', '/study/all-topics/missed-cards']){
      const p = await ctx.newPage(), missing = [];
      p.on('response', r => { if(r.status() >= 400 && /\.(css|js)$/.test(r.url())) missing.push(r.url()); });
      await p.goto(base + path); await p.waitForTimeout(800);
      assert.deepEqual(missing, [], `${path}: assets failed to load`);
      assert.ok(await p.evaluate(() => [...document.styleSheets].some(s => /study-ui\.css$/.test(s.href || '') && s.cssRules.length > 0)), `${path}: study stylesheet applied`);
      console.log('PASS', path, 'loads study styles and scripts'); await p.close();
    }
    console.log('Direct study URL asset checks passed.');
  } catch(e){ console.error(e); process.exitCode = 1; } finally { await browser.close(); server.close(); }
})();
