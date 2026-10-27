#!/usr/bin/env node
// Visual regression checks for the existing card interface (Package 1, section 9).
// 1) Rendered markup of every card, both sides, must match the baseline (hash per card side).
// 2) Key computed styles of the card interface (both themes, desktop and phone) must match.
// 3) Screenshots of sample cards must match the approved reference build (protected/visual/reference-index.html),
//    rendered in the same run on the same machine, so font rendering differences between computers don't matter.
// Usage: node tools/visual-check.js            (check)
//        node tools/visual-check.js --update --approved-by "Name" --reason "why"
//          Rewrites the visual baseline. Only for an owner-approved change to how cards look; the approval is
//          appended to protected/visual-approvals.json. Card text is protected separately and can't be changed this way.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch').default || require('pixelmatch');
const root = path.join(__dirname, '..'), dir = path.join(root, 'protected', 'visual');
const UPDATE = process.argv.includes('--update');
const sha = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const SAMPLES = [['1A-001', false], ['1A-038', true], ['5D-011', false], ['S4-003', true]];   // [card, show answer side]
const VIEWS = [[1280, 900, 'desktop'], [390, 844, 'phone']], THEMES = ['dark', 'light'];
const STYLE_PROPS = ['font-family', 'font-size', 'font-weight', 'line-height', 'color', 'background-color', 'border-top-width', 'border-top-color', 'border-radius', 'padding-top', 'padding-left', 'text-align', 'box-shadow'];
const STYLE_SELECTORS = ['#card', '#card .meta', '#card .face', '#card .bm', '#card .side', '#reveal', '#prev', '#activeRecallSwitch', '#recallEntry', '#curAnswer', '#studyNext', '#studyTools', '#studyRatingDialog'];
async function openPage(browser, w, h, theme, file = path.join(root, 'index.html')){
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.route('**/supabase.js', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));   // run without accounts
  // Reference assets are frozen with the approved HTML; never share mutable candidate CSS/JS.
  for(const asset of ['study-ui.js','study-ui.css'])await p.route('**/'+asset,r=>r.fulfill({contentType:asset.endsWith('.js')?'text/javascript':'text/css',body:fs.readFileSync(file===path.join(dir,'reference-index.html')?path.join(dir,'reference-'+asset):path.join(root,asset),'utf8')}));
  await p.addInitScript(t => { try { localStorage.setItem('mcat-progress-v2', JSON.stringify({ bg: t, tips: false })); } catch(e){} }, theme);
  await p.goto('file://' + file);
  await p.evaluate(() => { pick('all'); start(true); });
  // Imported homepage fonts must settle before style/geometry/pixel comparisons.
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: '*{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  return p;
}
const showCard = (p, key, back) => p.evaluate(([key, back]) => {
  deck[pos] = key.replace('~r', ''); resetCard(); curKey = key; if(back){ flipped = true; revealed = true; }
  render(); return document.getElementById('card').outerHTML;
}, [key, back]);
async function interactionShots(pg,dest,key){
  await showCard(pg,'1A-001',false);dest['workspace-'+key]=await pg.locator('#study').screenshot();
  await showCard(pg,'1A-001',true);await pg.evaluate(()=>window.MCATStudyUI.openRating());
  dest['rating-'+key]=await pg.locator('#studyRatingDialog').screenshot();await pg.evaluate(()=>window.MCATStudyUI.closeRating(false));
}
(async () => {
  const browser = await chromium.launch(); const problems = [];
  if(UPDATE) fs.mkdirSync(dir, { recursive: true });
  // 1) markup of every card side (theme and width don't change markup)
  const p = await openPage(browser, 1280, 900, 'dark');
  const keys = await p.evaluate(() => CARDS.flatMap(c => REVERSE[c[3]] ? [c[3], c[3] + '~r'] : [c[3]]));
  const dom = {};
  for(const k of keys){ dom[k + '|front'] = sha(await showCard(p, k, false)); dom[k + '|back'] = sha(await showCard(p, k, true)); }
  await p.close();
  // 2) computed styles, 3) screenshots
  const styles = {}, shots = {}, refShots = {};
  const refFile = path.join(dir, 'reference-index.html');
  if(!UPDATE && fs.existsSync(refFile)) for(const [w, h, vname] of VIEWS) for(const theme of THEMES){
    const pg = await openPage(browser, w, h, theme, refFile);
    for(const [id, back] of SAMPLES){ await showCard(pg, id, back); refShots[`${id}-${back ? 'back' : 'front'}-${vname}-${theme}`] = await pg.locator('#card').screenshot(); }
    await interactionShots(pg,refShots,`${vname}-${theme}`);
    await pg.close();
  }
  for(const [w, h, vname] of VIEWS) for(const theme of THEMES){
    const pg = await openPage(browser, w, h, theme);
    await showCard(pg, '1A-001', false);
    styles[`${vname}-${theme}`] = await pg.evaluate(([sels, props]) => Object.fromEntries(sels.map(s => { const el = document.querySelector(s); if(!el) return [s, null]; const cs = getComputedStyle(el); return [s, Object.fromEntries(props.map(x => [x, cs.getPropertyValue(x)]))]; })), [STYLE_SELECTORS, STYLE_PROPS]);
    for(const [id, back] of SAMPLES){
      await showCard(pg, id, back);
      shots[`${id}-${back ? 'back' : 'front'}-${vname}-${theme}`] = await pg.locator('#card').screenshot();
    }
    await interactionShots(pg,shots,`${vname}-${theme}`);
    await pg.close();
  }
  await browser.close();
  if(UPDATE){
    const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : ''; };
    const by = arg('--approved-by'), why = arg('--reason');
    if(!by || !why){ console.error('Updating the visual baseline needs --approved-by "Name" and --reason "..." (an owner-approved change to how cards look).'); process.exit(1); }
    const logf = path.join(root, 'protected', 'visual-approvals.json');
    let log = { approvals: [] }; try { log = JSON.parse(fs.readFileSync(logf, 'utf8')); } catch(e){}
    log.approvals.push({ date: new Date().toISOString().slice(0, 10), approved_by: by, reason: why });
    fs.writeFileSync(logf, JSON.stringify(log, null, 1));
    fs.writeFileSync(path.join(dir, 'card-markup-hashes.json'), JSON.stringify(dom, null, 0));
    fs.writeFileSync(path.join(dir, 'card-styles.json'), JSON.stringify(styles, null, 1));
    fs.copyFileSync(path.join(root, 'index.html'), refFile);
    for(const asset of ['study-ui.js','study-ui.css'])fs.copyFileSync(path.join(root,asset),path.join(dir,'reference-'+asset));
    for(const f of fs.readdirSync(dir)) if(f.endsWith('.png')) fs.unlinkSync(path.join(dir, f));
    console.log(`Visual baseline written: ${Object.keys(dom).length} card sides, ${Object.keys(styles).length} style sets, reference build for ${Object.keys(shots).length} screenshots.`);
    return;
  }
  const baseDom = JSON.parse(fs.readFileSync(path.join(dir, 'card-markup-hashes.json'), 'utf8'));
  for(const [k, h] of Object.entries(baseDom)){ if(dom[k] === undefined) problems.push(`${k}: card side no longer renders`); else if(dom[k] !== h) problems.push(`${k}: rendered card markup changed`); }
  const baseStyles = JSON.parse(fs.readFileSync(path.join(dir, 'card-styles.json'), 'utf8'));
  for(const [view, sels] of Object.entries(baseStyles)) for(const [sel, props] of Object.entries(sels)) for(const [prop, val] of Object.entries(props || {})){
    const now = styles[view] && styles[view][sel] && styles[view][sel][prop];
    if(now !== val) problems.push(`${view} ${sel} ${prop}: "${val}" became "${now}"`);
  }
  if(!fs.existsSync(refFile)) problems.push('protected/visual/reference-index.html is missing');
  for(const [k, buf] of Object.entries(shots)){
    if(!refShots[k]) continue;
    const a = PNG.sync.read(refShots[k]), b = PNG.sync.read(buf);
    if(a.width !== b.width || a.height !== b.height){ problems.push(`${k}: card size changed (${a.width}x${a.height} -> ${b.width}x${b.height})`); continue; }
    const diff = pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.15 });
    const pct = diff / (a.width * a.height) * 100;
    if(pct > 0.5) problems.push(`${k}: ${pct.toFixed(2)}% of pixels differ from the approved reference build`);
  }
  if(problems.length){
    console.error(`VISUAL CHECK FAILED: ${problems.length} problem(s)`); problems.forEach(x => console.error(' -', x));
    if(process.env.GITHUB_ACTIONS) problems.slice(0, 10).forEach(x => console.log(`::error title=Visual check::${x}`));   // shown on the GitHub check
    process.exit(1);
  }
  console.log(`Visual check passed: ${Object.keys(baseDom).length} card sides, ${Object.keys(baseStyles).length} style sets, ${Object.keys(shots).length} screenshots match.`);
})().catch(e => { console.error(e); process.exit(1); });
