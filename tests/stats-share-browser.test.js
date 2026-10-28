'use strict';
// Stats panel numbers come from the engine's own records; the share image is a branded 1080x1350 PNG.
const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const create = require('../tools/preview-server');
const mock = `(()=>{const user={id:'stats-fixture',email:'fixture@example.invalid',user_metadata:{first_name:'Fixture'}};window.supabase={createClient:()=>({auth:{onAuthStateChange(){},async getSession(){return {data:{session:{user}}}},async getUser(){return {data:{user}}}},from(t){return {select(){return this},eq(){return this},async maybeSingle(){return {data:t==='profiles'?{first_name:'Fixture',is_admin:false}:null,error:null}},async upsert(){return {error:null}}}},async rpc(){return {data:null,error:null}}})};})();`;
let count = 0; const check = (name, v) => { assert.ok(v, name); count++; console.log('PASS', name); };
(async () => {
  const server = create(); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`, browser = await chromium.launch(), errors = [];
  try {
    for(const width of [390, 1280]){
      const ctx = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', acceptDownloads: true });
      await ctx.route('**/supabase.js', r => r.fulfill({ contentType: 'text/javascript', body: mock }));
      await ctx.route('**/api/grade', r => r.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
      const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
      await p.goto(base + '/login'); await p.waitForURL('**/dashboard'); await p.click('[data-k=bb]'); await p.click('#toQuote'); await p.waitForFunction(() => mode === 'cards');
      check(`${width}: Stats pill beside the timer`, await p.isVisible('#statsOpen'));
      // Lifetime history from before this session, plus a known amount of study time.
      await p.evaluate(() => { progress.cards['9Z-old'] = { history: [{ r: 'good' }, { r: 'good' }, { r: 'again' }, { r: 'hard' }] }; progress.stats.ms = 3 * 3600e3; progress.open.bb.ms = 120000; });
      for(const r of ['good', 'again']){
        await p.evaluate(() => { resetCard(); render(); });
        await p.fill('#curAnswer', 'an answer from memory'); await p.click('#reveal'); await p.waitForFunction(() => revealed && !flipping);
        await p.click('#studyNext'); await p.waitForSelector('#rateRow:not([hidden])'); await p.click(`#rateRow [data-r=${r}]`);
        if(r !== 'good'){ await p.fill('#curAnswer', 'A reinforcement answer that is long enough.'); await p.click('#studyNext'); }
        await p.waitForFunction(n => Object.keys(progress.open.bb.results || {}).length === n, r === 'good' ? 1 : 2);
      }
      await p.click('#statsOpen');
      const txt = await p.textContent('#statsBody');
      const s = await p.evaluate(() => TabiStats.stats());
      check('Session counts from the engine: 2 cards, 1 correct, 1 incorrect', s.session.cards === 2 && s.session.good === 1 && s.session.again === 1 && s.session.hard === 0);
      check('Session average per card = active time / cards', Math.abs(s.session.avg - s.session.ms / 2) < 1 && s.session.ms >= 120000);
      check('Lifetime includes earlier history and this session', s.life.cards === 6 && s.life.good === 3 && s.life.again === 2 && s.life.hard === 1);
      check('Lifetime time is the engine total', s.life.ms >= 3 * 3600e3);
      check('Panel shows session and all-time sections', txt.includes('This session') && txt.includes('All time with TabiPrep') && txt.includes('3h'));
      await p.click('#statsShare'); await p.waitForFunction(() => document.getElementById('shareImg').naturalWidth > 0);
      check('Share image is 1080x1350', await p.evaluate(() => { const i = document.getElementById('shareImg'); return i.naturalWidth === 1080 && i.naturalHeight === 1350; }));
      const x = await p.getAttribute('[data-share=x]', 'href');
      check('X post carries the stats text and site link', x.startsWith('https://twitter.com/intent/tweet') && decodeURIComponent(x).includes('1 correct') && decodeURIComponent(x).includes('tabiprep.com'));
      check('Facebook, LinkedIn, Reddit and Save image offered', await p.locator('[data-share=facebook],[data-share=linkedin],[data-share=reddit],[data-share=save]').count() === 4);
      check('Instagram explained when the device has no share sheet', (await p.textContent('#shareTip')).includes('Instagram'));
      const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-share=save]')]);
      const file = await dl.path(), buf = fs.readFileSync(file);
      check('Saved file is a PNG', buf.slice(1, 4).toString() === 'PNG');
      if(width === 1280 && process.env.STATS_IMAGE) fs.copyFileSync(file, process.env.STATS_IMAGE);
      await p.click('#shareBack'); check('Back returns to stats', await p.isVisible('#statsBody'));
      await p.keyboard.press('Escape'); check('Escape closes', await p.isHidden('#statsModal'));
      check('No horizontal overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await ctx.close();
    }
    check('No JavaScript errors', errors.length === 0);
    console.log(`${count} stats and share checks passed.`);
  } catch(e){ console.error(e); if(errors.length) console.error(errors); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
