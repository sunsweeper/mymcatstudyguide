/* Study stats and a branded share image. Reads the engine's own records (session time, grades, lifetime time and card
   history); writes nothing. Loaded after study-ui.js. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const SITE = 'https://www.tabiprep.com', TAGLINE = 'More learning per card, not more cards.';

  // ---- Numbers ----
  const tally = rs => rs.reduce((t, r) => (t[r] !== undefined && t[r]++, t), { good: 0, hard: 0, again: 0 });
  function stats(){
    const o = progress.open && progress.open[filter];
    const sRes = o ? Object.values(o.results || {}).concat(Object.values(o.retryResults || {})) : [];
    const session = { ms: o ? o.ms || 0 : 0, cards: sRes.length, ...tally(sRes) };
    session.avg = session.cards ? session.ms / session.cards : 0;
    const all = [];
    Object.values(progress.cards || {}).forEach(s => (s.history || []).forEach(h => all.push(h.r)));
    const life = { ms: progress.stats.ms || 0, cards: all.length, sessions: progress.stats.sessions || 0, ...tally(all) };
    life.avg = life.cards ? life.ms / life.cards : 0;
    return { session, life, topic: (byId('topicname') && byId('topicname').textContent.trim()) || '' };
  }
  const dur = ms => { const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
    return h ? `${h}h ${m}m` : m ? `${m}m ${String(r).padStart(2, '0')}s` : `${r}s`; };
  const pct = (n, d) => d ? Math.round(n / d * 100) + '%' : '—';

  // ---- Stats panel (opened from the Stats pill next to the session timer) ----
  const tools = byId('sessionStats');
  tools.removeAttribute('aria-hidden');
  const pill = document.createElement('button'); pill.type = 'button'; pill.id = 'statsOpen'; pill.className = 'stats-pill'; pill.textContent = '📊 Stats';
  pill.setAttribute('aria-haspopup', 'dialog'); tools.append(pill);
  const bg = document.createElement('div'); bg.className = 'study-modal-bg'; bg.id = 'statsModal'; bg.hidden = true;
  bg.innerHTML = `<div class="study-modal stats-modal" role="dialog" aria-modal="true" aria-labelledby="statsTitle" tabindex="-1">
    <button class="study-close" id="statsClose" aria-label="Close stats">×</button>
    <div id="statsView"><span class="study-eyebrow">YOUR STATS</span><h2 id="statsTitle">How you're doing</h2><div id="statsBody"></div>
      <button class="btn stats-share" id="statsShare" type="button">Share my stats</button></div>
    <div id="shareView" hidden><span class="study-eyebrow">SHARE</span><h2>Share your progress</h2>
      <img id="shareImg" alt="Your TabiPrep study stats, ready to share">
      <div class="share-buttons" id="shareButtons"></div><p class="share-tip" id="shareTip"></p>
      <button class="link" id="shareBack" type="button">← Back to stats</button></div></div>`;
  document.body.append(bg);
  const row = (label, value, cls = '') => `<div class="stat ${cls}"><span>${label}</span><b>${value}</b></div>`;
  function renderStats(){
    const { session: s, life: l } = stats();
    byId('statsBody').innerHTML =
      `<h3>This session</h3><div class="stat-grid">${row('Study time', dur(s.ms))}${row('Cards', s.cards)}${row('Avg per card', s.cards ? dur(s.avg) : '—')}` +
      `${row('Correct', s.good, 'good')}${row('Struggled', s.hard, 'hard')}${row('Incorrect', s.again, 'again')}</div>` +
      `<h3>All time with TabiPrep</h3><div class="stat-grid">${row('Time studying', dur(l.ms))}${row('Cards reviewed', l.cards)}${row('Avg per card', l.cards ? dur(l.avg) : '—')}` +
      `${row('Correct', l.good, 'good')}${row('Struggled', l.hard, 'hard')}${row('Incorrect', l.again, 'again')}</div>` +
      `<p class="stat-note">Time counts only while you're actively studying. Correct = Got it, Incorrect = Didn't know.</p>`;
  }
  let returnTo = null;
  function open(){ returnTo = document.activeElement; renderStats(); byId('statsView').hidden = false; byId('shareView').hidden = true; bg.hidden = false; byId('study').inert = true; byId('statsShare').focus(); }
  function close(){ bg.hidden = true; byId('study').inert = false; if(returnTo && returnTo.isConnected) returnTo.focus(); }
  pill.onclick = open; byId('statsClose').onclick = close; bg.onclick = e => { if(e.target === bg) close(); };
  addEventListener('keydown', e => { if(e.key === 'Escape' && !bg.hidden) close(); });
  byId('shareBack').onclick = () => { byId('shareView').hidden = true; byId('statsView').hidden = false; byId('statsShare').focus(); };

  // ---- Branded share image (1080x1350: fits Instagram feed and works on X and Facebook) ----
  function roundRect(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  let logoImg = null;
  const brandLogo = () => logoImg || (logoImg = new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = e => { logoImg = null; bad(e); }; im.src = '/brand/tabiprep-logo.png'; }));
  async function makeImage(){
    const { session: s, life: l, topic } = stats();
    await (document.fonts && document.fonts.ready);
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const serif = '"Playfair Display", Georgia, serif', sans = '"DM Sans", "Atkinson Hyperlegible", Arial, sans-serif';
    // Fit text to a width by shrinking the font (big totals from heavy users must not overflow).
    const fit = (text, weight, size, family, maxW) => { let px = size; c.font = `${weight} ${px}px ${family}`; while(px > 20 && c.measureText(text).width > maxW){ px -= 2; c.font = `${weight} ${px}px ${family}`; } };
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b3a2b'); g.addColorStop(1, '#0f2018'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Header: logo + wordmark
    c.textBaseline = 'alphabetic';
    try { const img = await brandLogo(); const h = 150, w = img.width * h / img.height; c.drawImage(img, 60, 40, w, h); }
    catch(e){ c.font = `700 62px ${serif}`; c.fillStyle = '#f8f2e8'; c.fillText('TabiPrep.com', 72, 128); }   // logo file unavailable
    // Title
    c.fillStyle = '#f8f2e8'; fit('MCAT study session', 700, 74, serif, W - 144); c.fillText('MCAT study session', 72, 278);
    c.font = `500 30px ${sans}`; c.fillStyle = '#b9cdbf';
    c.fillText([topic, new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })].filter(Boolean).join('  ·  '), 74, 318);
    // Session card
    c.fillStyle = '#f8f2e8'; roundRect(c, 60, 362, W - 120, 560, 34); c.fill();
    const cell = (x, y, label, value, color) => { c.fillStyle = '#6b7d71'; c.font = `700 24px ${sans}`; c.fillText(label.toUpperCase(), x, y);
      c.fillStyle = color || '#1d3326'; fit(String(value), 700, 72, sans, 280); c.fillText(String(value), x, y + 84); };
    const cols = [108, 418, 728];
    cell(cols[0], 450, 'Study time', dur(s.ms)); cell(cols[1], 450, 'Cards', s.cards); cell(cols[2], 450, 'Avg / card', s.cards ? dur(s.avg) : '—');
    c.strokeStyle = '#ded4c2'; c.lineWidth = 2; c.beginPath(); c.moveTo(108, 616); c.lineTo(W - 108, 616); c.stroke();
    cell(cols[0], 690, 'Correct', s.good, '#2f7a4f'); cell(cols[1], 690, 'Struggled', s.hard, '#9a6a2e'); cell(cols[2], 690, 'Incorrect', s.again, '#a65370');
    c.fillStyle = '#6b7d71'; c.font = `500 26px ${sans}`; c.fillText(s.cards ? `${pct(s.good, s.cards)} correct this session` : 'Session just started', 108, 870);
    // All time band
    c.fillStyle = '#f0adbd'; c.font = `700 24px ${sans}`; c.fillText('ALL TIME WITH TABIPREP', 72, 1000);
    c.fillStyle = '#f8f2e8';
    const lifeLine = [`${dur(l.ms)} studying`, `${l.cards.toLocaleString()} cards`, `${pct(l.good, l.cards)} correct`];
    fit(lifeLine.join('  ·  '), 700, 50, sans, W - 144);
    let x = 72; lifeLine.forEach((t, i) => { if(i){ const dot = '  ·  '; c.fillStyle = '#5f7a69'; c.fillText(dot, x, 1072); x += c.measureText(dot).width; c.fillStyle = '#f8f2e8'; } c.fillText(t, x, 1072); x += c.measureText(t).width; });
    // Footer
    c.fillStyle = '#f0adbd'; c.font = `italic 500 40px ${serif}`; c.fillText(TAGLINE, 72, 1210);
    c.fillStyle = '#b9cdbf'; c.font = `700 30px ${sans}`; c.fillText('tabiprep.com', 72, 1272);
    return new Promise(ok => cv.toBlob(b => ok({ blob: b, url: cv.toDataURL('image/png') }), 'image/png'));
  }
  const shareText = () => { const { session: s } = stats();
    return s.cards ? `Just studied ${s.cards} MCAT flashcards in ${dur(s.ms)} on TabiPrep: ${s.good} correct, ${s.hard} struggled, ${s.again} to review. ${TAGLINE}` : `Studying for the MCAT with TabiPrep. ${TAGLINE}`; };

  byId('statsShare').onclick = async () => {
    const { blob, url } = await makeImage(), file = new File([blob], 'tabiprep-stats.png', { type: 'image/png' });
    byId('shareImg').src = url;
    const text = shareText(), enc = encodeURIComponent, canNative = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    const links = [
      ['X', `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(SITE)}`],
      ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${enc(SITE)}`],
      ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${enc(SITE)}`],
      ['Reddit', `https://www.reddit.com/submit?url=${enc(SITE)}&title=${enc(text)}`]];
    byId('shareButtons').innerHTML = (canNative ? '<button class="btn share-native" type="button" data-share="native">Share… (Instagram, Facebook, X, Messages)</button>' : '') +
      `<a class="btn" data-share="save" download="tabiprep-stats.png" href="${url}">Save image</a>` +
      links.map(([n, href]) => `<a class="btn" data-share="${n.toLowerCase()}" href="${href}" target="_blank" rel="noopener">${n}</a>`).join('') +
      '<button class="btn" type="button" data-share="copy">Copy text</button>';
    byId('shareTip').textContent = canNative ? 'Share… sends the picture straight to the app you choose.'
      : 'Instagram has no website share link: save the image and post it from your phone. X, Facebook, LinkedIn and Reddit open a post with your text and link; attach the saved image to show your stats.';
    const nat = byId('shareButtons').querySelector('[data-share=native]');
    if(nat) nat.onclick = () => navigator.share({ files: [file], text, url: SITE }).catch(() => {});
    byId('shareButtons').querySelector('[data-share=copy]').onclick = e => navigator.clipboard.writeText(`${text} ${SITE}`).then(() => { e.target.textContent = 'Copied'; }, () => { e.target.textContent = 'Copy failed'; });
    byId('statsView').hidden = true; byId('shareView').hidden = false; (nat || byId('shareButtons').firstElementChild).focus();
  };
  window.TabiStats = { stats, makeImage, open };
})();
