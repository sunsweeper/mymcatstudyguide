/* Spanish Foundations practice, in the same study workspace as the /mcat page (markup and styles copied from it).
   Five sample cards from the course (picked by /api/demo-cards; the full deck stays on the server). Questions First: read the English, write the Spanish. Answers First: read the Spanish, write the English.
   Spanish answers are checked on this page: capitals, punctuation (¿¡.,!?), a leading article and missing accents never cost credit;
   a wrong answer gets the reason (wrong article, spelling, word order, missing/extra word, another card's word).
   English answers that aren't an exact match are rated by the student. Place, category and mode are kept in this browser only;
   nothing is sent anywhere. */
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='tabi-spanish';
let all=[],deck=[],pos=0,mode='question',cat='',mixOrder=null,flipped=false,activeRecall=true,drafts={},ratings={},pendingRating=null,reinforcementDraft='',demoFlipping=false,done=false,seconds=0,popupView='manual',graded=null;
const store={get(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}},set(v){try{localStorage.setItem(KEY,JSON.stringify(Object.assign(store.get(),v)))}catch(e){}}};
let bookmarks=new Set(store.get().bookmarks||[]),notes=store.get().notes||{};
// ---- checking Spanish answers ----
const ARTS=['el','la','los','las','un','una','unos','unas'],MASC=['el','los','un','unos'];
const clean=s=>String(s||'').toLowerCase().replace(/[¿¡.,!?;:"“”'’()]/g,' ').replace(/\s+/g,' ').trim();
const artOf=s=>{const w=clean(s).split(' ')[0];return ARTS.includes(w)&&clean(s).includes(' ')?w:''};
const base=s=>clean(s).replace(/^(el|la|los|las|un|una|unos|unas)\s+/,'');
const plain=s=>base(s).normalize('NFD').replace(/[̀-ͯ]/g,'');
function dist(a,b){const d=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1),i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]?d[i-2][j-2]+1:99);
  return d[a.length][b.length]}
const qt=s=>`“${s}”`;
// Most specific reason first. near: close enough to count as Struggled; otherwise Didn't know.
function grade(input,card){
  const answers=[card.a,...card.alt],pi=plain(input),res=(ok,reason,near)=>({kind:ok?'ok':'no',rating:ok?'got':near?'struggled':'didnt',title:ok?'Congratulations!':'Almost got it.',reason,answer:card.a});
  if(!pi)return null;
  const hit=answers.find(a=>plain(a)===pi);
  if(hit){const ia=artOf(input),ha=artOf(hit);
    if(ia&&ha&&ia!==ha&&MASC.includes(ia)!==MASC.includes(ha))return res(false,`Right word, wrong article. ${qt(base(hit))} is ${MASC.includes(ha)?'masculine':'feminine'}, so it takes ${qt(ha)}, not ${qt(ia)}.`,true);
    if(ia&&ha&&ia!==ha)return res(false,`Right word, wrong article: it's ${qt(ha)}, not ${qt(ia)}.`,true);
    return res(true,base(hit)===base(input)?'You got it exactly.':`You got it. With accents it's written ${qt(hit)}.`)}
  const iw=pi.split(' ');let best=null;
  for(const a of answers){const pa=plain(a),d=dist(pi,pa);if(!best||d<best.d)best={a,pa,d}}
  const aw=best.pa.split(' '),realW=base(best.a).split(' ');
  if(iw.length===aw.length&&[...iw].sort().join(' ')===[...aw].sort().join(' '))return res(false,`Right words, wrong order. It's ${qt(best.a)}.`,true);
  if(best.d<=Math.max(1,Math.floor(best.pa.length/5))){
    if(iw.length===aw.length){const bad=aw.map((w,i)=>w!==iw[i]?i:-1).filter(i=>i>=0);if(bad.length===1)return res(false,`Spelling: you wrote ${qt(iw[bad[0]])}, it's spelled ${qt(realW[bad[0]])}.`,true)}
    return res(false,`Spelling slip. It's spelled ${qt(best.a)}.`,true)}
  const other=all.find(c=>c!==card&&[c.a,...c.alt].some(a=>plain(a)===pi));
  if(other)return res(false,`${qt(other.a)} means ${qt(other.q)}. For ${qt(card.q)} it's ${qt(card.a)}.`);
  const missing=realW.filter((w,i)=>!iw.includes(aw[i])),extra=iw.filter(w=>!aw.includes(w));
  if(missing.length&&missing.length<aw.length&&!extra.length)return res(false,`You're missing ${missing.map(qt).join(' and ')}. It's ${qt(best.a)}.`,true);
  if(extra.length&&extra.length<iw.length&&!missing.length)return res(false,`Drop ${extra.map(qt).join(' and ')}. It's just ${qt(best.a)}.`,true);
  if(missing.length&&missing.length<aw.length)return res(false,`Part of it is right. It's ${qt(best.a)}.`,true);
  return res(false,`Not this one. ${qt(card.q)} is ${qt(card.a)}.`)}
// English answers (Answers First): exact match after tidying, against each meaning listed on the card
const enForms=s=>String(s||'').toLowerCase().replace(/\(.*?\)/g,' ').split(/[\/;,]| or /).map(x=>x.replace(/[.!?¿¡"“”']/g,' ').replace(/\s+/g,' ').trim().replace(/^(to|the|a|an) /,'')).filter(Boolean);
const englishRight=(input,card)=>{const i=enForms(input)[0];return !!i&&enForms(card.q).includes(i)};
window.TabiSpanish={grade,base,plain,englishRight};
// ---- session ----
const current=()=>deck[pos];
const dirOf=()=>mode==='answer'?'es2en':'en2es';
const draftKey=()=>current().id+'|'+dirOf();
const draft=()=>(drafts[draftKey()]||'');
function canFlip(){return !activeRecall||!!draft().trim()}
function buildDeck(){deck=all.filter(c=>!cat||c.cat===cat);
  if(mode==='mix'){if(!mixOrder||mixOrder.length!==deck.length){mixOrder=deck.map(c=>c.id);for(let i=mixOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[mixOrder[i],mixOrder[j]]=[mixOrder[j],mixOrder[i]]}}
    const by=Object.fromEntries(deck.map(c=>[c.id,c]));deck=mixOrder.map(id=>by[id]).filter(Boolean)}
  if(pos>=deck.length)pos=0}
const persist=()=>store.set({mode});
function backHTML(c){
  if(dirOf()==='es2en')return `<span class="sp-ans">${esc(c.q)}</span>${c.ex?`<span class="sp-ex"><span lang="es">${esc(c.ex)}</span><i>${esc(c.exEn)}</i></span>`:''}`;
  return `<span class="sp-ans" lang="es">${esc(c.a)}</span>${c.alt.length?`<span class="sp-alt">Also: <span lang="es">${c.alt.map(esc).join(' · ')}</span></span>`:''}${c.ex?`<span class="sp-ex"><span lang="es">${esc(c.ex)}</span><i>${esc(c.exEn)}</i></span>`:''}`}
function nextLabel(){$('demoNext').innerHTML=(pendingRating?'Save and Next Card':draft().trim()?'Grade My Answer':'Rate My Recall')+' <span aria-hidden="true">→</span>'}
function lockedIn(){const c=current(),t=reinforcementDraft;return dirOf()==='en2es'?[c.a,...c.alt].some(a=>plain(a)===plain(t)&&!!plain(t)):englishRight(t,c)}
function render(){
  const c=current();if(!c)return;
  const es=dirOf()==='es2en';
  const right=Object.values(ratings).filter(v=>v==='got').length,seen=Object.keys(ratings).length;
  $('demoTopic').textContent=('Spanish · '+c.lvl).toUpperCase();$('demoSubtopic').textContent=c.cat;
  $('demoQuestion').textContent=es?c.a:c.q;$('demoQuestion').lang=es?'es':'en';$('demoAnswer').innerHTML=backHTML(c);
  $('demoCount').textContent=`${pos+1} / ${deck.length}`;$('spScore').textContent=`${right} of ${seen} correct`;
  $('demoFace').textContent=flipped?'Answer':'Question';$('demoAnswer').hidden=!flipped;$('demoQuestion').hidden=flipped;
  $('demoReveal').textContent='Flip Card';$('demoReveal').disabled=demoFlipping||(!flipped&&!canFlip());$('demoReveal').title=!flipped&&!canFlip()?'Write your answer first, or switch Active Recall off':'Flip card';
  $('tour-card').classList.toggle('recall-locked',!flipped&&!canFlip());$('tour-recall-entry').hidden=!activeRecall;
  $('recallDraft').value=draft();$('recallDraft').disabled=flipped;$('recallDraft').placeholder=es?'Write the English…':'Escribe tu respuesta en español…';
  $('recallRequired').textContent=flipped?'Compare your answer with the other side':'Required before flipping';
  $('recallMessage').textContent=flipped?(draft().trim()?'Compare your answer with the revealed answer. Grade My Answer checks it for you.':'Compare with the revealed answer, then rate how well you remembered.'):canFlip()?'Ready to flip. Press Enter or Flip Card.':`Active Recall is on. Write the ${es?'English':'Spanish'} before revealing the other side.`;
  const bm=bookmarks.has(c.id);$('demoBookmark').classList.toggle('is-bookmarked',bm);$('demoBookmark').setAttribute('aria-pressed',String(bm));$('demoBookmark').setAttribute('aria-label',bm?'Remove bookmark':'Bookmark this card');$('demoBookmark').title=bm?'Remove bookmark':'Bookmark this card';
  $('demoSummary').hidden=!done;$('demoNext').disabled=!flipped||demoFlipping;$('activeRecallSwitch').disabled=!!pendingRating;$('demoPrevious').disabled=pos===0;
  if(pendingRating){$('tour-recall-entry').hidden=false;$('recallDraft').disabled=false;$('recallDraft').value=reinforcementDraft;$('recallRequired').textContent='Lock it in';
    $('recallMessage').textContent=lockedIn()?'Got it. Save and Next Card when you’re ready.':`Type the answer once to lock it in: ${qt(es?c.q:c.a)}`;$('demoNext').disabled=!lockedIn()}
  nextLabel()}
function flip(){if(demoFlipping||pendingRating)return;if(!flipped&&!canFlip()){$('recallDraft').focus();$('recallMessage').textContent='Write your answer from memory to unlock Flip Card, or switch Active Recall off.';return}
  const card=$('tour-card'),apply=()=>{flipped=!flipped;render()};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!card.animate){apply();return}
  demoFlipping=true;render();const out=card.animate([{transform:'perspective(1400px) rotateY(0deg)'},{transform:'perspective(1400px) rotateY(90deg)'}],{duration:170,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
  out.onfinish=()=>{apply();const back=card.animate([{transform:'perspective(1400px) rotateY(-90deg)'},{transform:'perspective(1400px) rotateY(0deg)'}],{duration:190,easing:'cubic-bezier(0,0,.2,1)'});out.cancel();back.onfinish=back.oncancel=()=>{demoFlipping=false;render()}}}
function move(delta){
  if(delta>0&&ratings[current().id+'|'+dirOf()]===undefined&&!pendingRating){if(flipped)openRatingModal();return}
  pendingRating=null;reinforcementDraft='';closeRatingModal();
  if(delta>0&&pos===deck.length-1){finish();return}
  pos=Math.max(0,Math.min(deck.length-1,pos+delta));flipped=mode==='answer'&&!activeRecall;done=false;hideDrawer();persist();render();
  if(delta>0&&activeRecall)$('recallDraft').focus({preventScroll:true})}
function finish(){done=true;const n=Object.values(ratings).reduce((a,v)=>(a[v]=(a[v]||0)+1,a),{});
  $('demoSummaryText').textContent=`Got it: ${n.got||0} · Struggled: ${n.struggled||0} · Didn't know: ${n.didnt||0}.`;render();$('demoSummary').scrollIntoView({behavior:'smooth',block:'nearest'})}
// ---- the grade pop-up (same pop-up as /mcat) ----
const VERDICT={got:'Good job, you knew that one.',struggled:'Close. You were partly there.',didnt:'Not this time.'};
function showRatingView(){
  const m=$('tour-ratings'),T=$('ratingModalTitle'),D=$('ratingModalDescription'),E=$('ratingModalEyebrow'),c=current(),es=dirOf()==='es2en',a=draft().trim();
  graded=null;
  if(a&&!es)graded=grade(a,c);
  else if(a&&es&&englishRight(a,c))graded={kind:'ok',rating:'got',title:'Congratulations!',reason:'You got it.',answer:c.q};
  popupView=graded?'grade':'manual';m.dataset.view=popupView;m.dataset.grade=graded?graded.rating:'';
  $('demoGradeActions').hidden=popupView!=='grade';m.querySelector('.rating-modal-options').hidden=popupView!=='manual';$('demoDispute').hidden=true;
  m.querySelectorAll('[data-rating]').forEach(b=>b.disabled=false);
  if(graded){E.textContent='CHECKED';T.textContent=graded.title;D.innerHTML=`${esc(graded.reason)}<span class="sp-right" lang="${es?'en':'es'}">${esc(graded.answer)}</span>`;
    $('demoGradeAccept').textContent=graded.kind==='ok'?'Save and Next Card →':'Continue →';$('demoGradeAccept').focus()}
  else{E.textContent='YOUR RECALL';T.textContent='Did you remember the answer to the last card?';D.textContent=a?'Compare what you wrote with the answer, then choose how well you remembered.':'Choose the response that best matches how well you remembered.';m.querySelector('[data-rating]').focus()}}
function openRatingModal(){if(done||!flipped)return;$('ratingModal').hidden=false;showRatingView()}
function closeRatingModal(){$('ratingModal').hidden=true}
function rate(v){if(!flipped)return;
  if(v==='struggled'||v==='didnt'){pendingRating=v;reinforcementDraft='';closeRatingModal();render();$('recallDraft').focus();return}
  ratings[current().id+'|'+dirOf()]=v;closeRatingModal();move(1)}
$('demoGradeAccept').onclick=()=>{if(graded)rate(graded.rating)};
function hideDrawer(){$('demoDrawer').hidden=true}
function showDrawer(title,html){$('drawerTitle').textContent=title;$('drawerBody').innerHTML=html;$('demoDrawer').hidden=false;$('demoDrawer').scrollIntoView({behavior:'smooth',block:'nearest'})}
// ---- controls ----
$('tour-card').addEventListener('click',flip);$('tour-card').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}});
$('activeRecallSwitch').addEventListener('change',()=>{activeRecall=$('activeRecallSwitch').checked;$('activeRecallStatus').textContent=activeRecall?'On':'Off';render()});
$('recallDraft').addEventListener('input',e=>{if(pendingRating){reinforcementDraft=e.target.value;render();$('recallDraft').focus();return}
  drafts[draftKey()]=e.target.value;$('demoReveal').disabled=!canFlip();$('tour-card').classList.toggle('recall-locked',!canFlip());$('recallMessage').textContent=canFlip()?'Ready to flip. Press Enter or Flip Card.':'Active Recall is on. Write your answer before revealing the other side.';nextLabel()});
// Enter: flip, then grade, then (after locking it in) next card. Shift+Enter still makes a new line.
$('recallDraft').addEventListener('keydown',e=>{if(e.key!=='Enter'||e.shiftKey)return;e.preventDefault();
  if(pendingRating){if(lockedIn()){ratings[current().id+'|'+dirOf()]=pendingRating;move(1)}return}
  if(!flipped)flip();else openRatingModal()});
$('demoReveal').onclick=flip;$('demoPrevious').onclick=()=>{if(pos>0)move(-1)};
$('demoNext').onclick=()=>{if(pendingRating){if(!lockedIn())return;ratings[current().id+'|'+dirOf()]=pendingRating;move(1);return}openRatingModal()};
document.querySelectorAll('[data-rating]').forEach(b=>b.onclick=()=>rate(b.dataset.rating));
$('closeRatingModal').onclick=closeRatingModal;
$('ratingModal').addEventListener('click',e=>{if(e.target===$('ratingModal'))closeRatingModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('ratingModal').hidden)closeRatingModal()});
function setMode(m){mode=m;pendingRating=null;reinforcementDraft='';document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('selected',x.dataset.mode===m));
  if(m==='mix')mixOrder=null;pos=0;done=false;buildDeck();flipped=mode==='answer'&&!activeRecall;closeRatingModal();hideDrawer();persist();render()}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
$('demoBookmark').onclick=e=>{e.stopPropagation();const id=current().id;bookmarks.has(id)?bookmarks.delete(id):bookmarks.add(id);store.set({bookmarks:[...bookmarks]});render()};
$('demoNoteButton').onclick=()=>{const id=current().id;showDrawer('My Card Notes',`<p>Write a personal note for this card. Notes are kept in this browser only.</p><textarea id="noteInput" aria-label="Card note"></textarea><button class="btn" id="saveNote">Save note</button><p id="noteStatus" role="status"></p>`);$('noteInput').value=notes[id]||'';$('saveNote').onclick=()=>{notes[id]=$('noteInput').value;store.set({notes});$('noteStatus').textContent='Saved in this browser.'}};
$('demoReport').onclick=()=>{const id=current().id;showDrawer('Report this card',`<p>If something on this card looks wrong, tell us on the <a href="/contact" style="color:#f0adbd;text-decoration:underline">Contact Us</a> page and include the card ID: <strong>${esc(id)}</strong>.</p>`)};
$('closeDrawer').onclick=hideDrawer;
$('restartSample').onclick=()=>{closeRatingModal();pos=0;pendingRating=null;reinforcementDraft='';ratings={};done=false;drafts={};flipped=false;persist();render();$('studyWorkspace').scrollIntoView({behavior:'smooth'})};
setInterval(()=>{seconds++;$('demoTimer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`},1000);
const steps=[
{target:'tour-study-modes',title:'Choose your study mode',body:'<strong>Questions First</strong> shows the English and you write the Spanish. <strong>Answers First</strong> shows the Spanish and you write the English. <strong>Random Mix</strong> shuffles the cards.'},
{target:'tour-card',title:'Meet your flashcard',body:'Read the card and try to recall the answer from memory.'},
{target:'tour-recall-entry',title:'Your Active Recall answer',body:'Type your answer here before you flip. No Spanish keyboard? No problem: missing accents never cost you, and the card shows you the accented spelling.'},
{target:'demoReveal',highlight:['tour-card'],title:'Flip the card',body:'Press Enter, click Flip Card, or click the card itself to see the answer.'},
{target:'tour-recall-toggle',title:'Active Recall is on from the start',body:'With Active Recall on, you write your answer before you flip. Switch it off to just flip through the cards.'},
{target:'demoNext',title:'See how you did',body:'<strong>Grade My Answer</strong> checks what you wrote and tells you why if it isn’t right: a wrong article, a spelling slip, word order or a missing word. If you didn’t write anything, it says <strong>Rate My Recall</strong> and you rate yourself. When you miss one, type the answer once to lock it in, then <strong>Save and Next Card</strong>.'},
{target:'demoPrevious',title:'Return to the previous card',body:'Select Previous to look back at the card you were just studying. Your result stays as it was.'}
];
let tourIndex=-1,tourBox;
// Keep the walkthrough attached to the actual control, even while the page scrolls.
let tourAnimationFrame=0;
function endTour(){
  closeRatingModal();
  cancelAnimationFrame(tourAnimationFrame);
  document.querySelectorAll('.tour-focus,.tour-secondary-focus').forEach(e=>e.classList.remove('tour-focus','tour-secondary-focus'));
  if(tourBox)tourBox.remove();
  tourBox=null;tourIndex=-1;
}
function positionTour(){
  if(tourIndex<0||!tourBox)return;
  const el=$(steps[tourIndex].target);
  if(!el)return;
  const r=el.getBoundingClientRect();
  const vw=window.innerWidth,vh=window.innerHeight,gap=13,edge=12;
  const w=Math.min(320,vw-2*edge);
  tourBox.style.width=w+'px';
  tourBox.style.maxHeight=`calc(100vh - ${2*edge}px)`;
  const h=Math.min(tourBox.offsetHeight,vh-2*edge);
  const clamp=(n,min,max)=>Math.max(min,Math.min(n,max));
  // Prefer adjacent positions, never covering the highlighted element.
  const options=[
    {side:'below',x:clamp(r.left,edge,vw-w-edge),y:r.bottom+gap,room:vh-edge-(r.bottom+gap)},
    {side:'above',x:clamp(r.left,edge,vw-w-edge),y:r.top-gap-h,room:r.top-gap-edge},
    {side:'right',x:r.right+gap,y:clamp(r.top,edge,vh-h-edge),room:vw-edge-(r.right+gap)},
    {side:'left',x:r.left-gap-w,y:clamp(r.top,edge,vh-h-edge),room:r.left-gap-edge}
  ];
  // For the Previous / Flip Card row, the explanation belongs immediately above it.
  const preference=steps[tourIndex].target==='demoPrevious'?['above','below','right','left']:steps[tourIndex].target==='demoReveal'?['right','left','below','above']:['below','above','right','left'];
  const fits=o=>(o.side==='below'||o.side==='above')?o.room>=h:o.room>=w;
  const chosen=preference.map(side=>options.find(o=>o.side===side)).find(fits);
  if(chosen){
    tourBox.style.left=chosen.x+'px';
    tourBox.style.top=chosen.y+'px';
  }else{
    // Small screens: keep the whole popup visible and avoid the control as far as possible.
    const vertical=options.slice(0,2).sort((a,b)=>b.room-a.room)[0];
    tourBox.style.left=vertical.x+'px';
    tourBox.style.top=clamp(vertical.y,edge,vh-h-edge)+'px';
  }
}
function followTourScroll(){
  cancelAnimationFrame(tourAnimationFrame);
  let frames=0;
  function tick(){
    if(tourIndex<0)return;
    positionTour();
    if(++frames<90)tourAnimationFrame=requestAnimationFrame(tick);
  }
  tourAnimationFrame=requestAnimationFrame(tick);
}
function showTour(i){
  document.querySelectorAll('.tour-focus,.tour-secondary-focus').forEach(e=>e.classList.remove('tour-focus','tour-secondary-focus'));
  if(i>=steps.length){endTour();return}
  closeRatingModal();
  tourIndex=i;
  const st=steps[i],el=$(st.target);
  if(!tourBox){tourBox=document.createElement('div');tourBox.className='tour-popover';document.body.appendChild(tourBox)}
  tourBox.innerHTML=`<span class="tour-step-count">STEP ${i+1} OF ${steps.length}</span><br><strong>${st.title}</strong><p>${st.body}</p><div class="tour-actions"><button class="tour-muted" id="tourExit">Exit</button>${i>0?'<button class="tour-muted" id="tourBack">Back</button>':''}<button id="tourForward">${i===steps.length-1?'Finish':'Next →'}</button></div>`;
  el.classList.add('tour-focus');
  (st.highlight||[]).filter(id=>id!==st.target).forEach(id=>$(id)?.classList.add('tour-secondary-focus'));
  $('tourExit').onclick=endTour;
  if(i>0)$('tourBack').onclick=()=>showTour(i-1);
  $('tourForward').onclick=()=>showTour(i+1);
  // Move to each new control, then track its live position throughout smooth scrolling.
  if(i===0){
    const workspace=$('studyWorkspace');
    const top=window.scrollY+workspace.getBoundingClientRect().top-12;
    window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
  }else{
    el.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});
  }
  positionTour();
  followTourScroll();
}
document.querySelectorAll('[data-trial-form]').forEach(form=>form.addEventListener('submit',e=>{e.preventDefault();location.assign('/signup?course=spanish');}));
$('startTour').onclick=()=>showTour(0);document.querySelectorAll('[data-start-guided-tour]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();showTour(0);}));$('summaryTour').onclick=()=>showTour(0);
document.querySelectorAll('[data-start-practice]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();$('studyWorkspace').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('recallDraft').focus({preventScroll:true}),500)}));
window.addEventListener('resize',positionTour);window.addEventListener('scroll',positionTour,{passive:true});
// Five sample cards from the course, picked by the server (the same five all day; the full deck isn't sent to the browser).
fetch('/api/demo-cards?course=spanish').then(r=>{if(!r.ok)throw new Error('cards');return r.json()}).then(d=>{
  all=d.cards;const s=store.get();
  if(['question','answer','mix'].includes(s.mode)){mode=s.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('selected',x.dataset.mode===mode))}
  pos=0;buildDeck();render();
})
.catch(()=>{$('demoQuestion').textContent='The sample cards couldn’t load. Refresh the page to try again.'});
