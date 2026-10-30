/* Interaction adapter. The original engine and persistence functions remain authoritative. */
(() => {
  'use strict';
  const byId=id=>document.getElementById(id), workspace=byId('study').firstElementChild;
  let recall=true, drawer=null, dialogKey=null, returnTo=null, seen=null;
  const insert=(html,parent=workspace)=>{const t=document.createElement('template');t.innerHTML=html;parent.append(t.content);};
  insert(`<div class="study-toolbar" id="studyToolbar"><label class="study-recall-toggle"><span>Active Recall</span><input id="activeRecallSwitch" type="checkbox" role="switch" aria-describedby="recallMessage" checked><span id="activeRecallStatus">On</span></label><button class="link" id="studyTourStart">Guided Tour</button></div>
    <div class="study-tools" id="studyTools"><div class="session-stats" id="sessionStats" aria-hidden="true"><span id="statTime">0:00</span><span id="statCount"></span></div><span class="study-tools-label">CARD TOOLS</span><button class="btn" id="studyNotes">✎ My Card Notes</button><button class="btn" id="studyAnswers">Previous Answers</button><button class="btn" id="studyExplain">Explain This Concept</button><button class="btn" id="studyReport">⚑ Report This Card</button></div>
    <div class="study-recall-entry" id="recallEntry"><p id="recallMessage" role="status"></p></div>
    <div class="study-utilities" id="studyUtilities"><button class="btn" id="raiseHand">✋ Raise Your Hand</button><button class="btn" id="studyNext" aria-haspopup="dialog">Next Card →</button></div>
    <section class="study-drawer" id="studyDrawer" hidden aria-labelledby="studyDrawerTitle"><div class="study-drawer-head"><strong id="studyDrawerTitle">Card tools</strong><button class="btn" id="closeStudyDrawer" aria-label="Close panel">×</button></div><div id="studyDrawerBody"></div></section>`);
  const inputBlock=byId('curAnswer').closest('.ans-cur');byId('recallEntry').prepend(inputBlock);
  byId('curLabel').textContent='Your answer, from memory';byId('curAnswer').rows=2;
  // Heading row as on the homepage: label on the left, requirement status on the right.
  const recallHead=document.createElement('div');recallHead.className='recall-head';byId('curLabel').before(recallHead);recallHead.append(byId('curLabel'));insert('<span class="recall-required" id="recallRequired"></span>',recallHead);
  byId('reveal').textContent='Flip Card';byId('prev').textContent='← Previous';
  const header=byId('view');header.before(byId('studyToolbar'));header.after(byId('studyTools'));byId('studyToolbar').prepend(header);insert('<span class="toolbar-label">Study mode</span>',byId('studyToolbar'));byId('studyToolbar').prepend(byId('studyToolbar').lastElementChild);
  byId('card').after(byId('recallEntry'));byId('revealRow').after(byId('studyUtilities'));byId('studyUtilities').after(byId('studyDrawer'));
  const reportRow=byId('reportBtn').closest('.report-row');reportRow.hidden=true;
  const originalReport=byId('reportBtn').onclick;
  byId('studyReport').onclick=()=>{drawer='report';originalReport();sync();};
  byId('studyNotes').onclick=()=>{drawer='notes';setWsTab('notes','field');sync();};
  byId('studyAnswers').onclick=()=>{drawer='answers';setWsTab('ans');sync();byId('prevList').focus();};
  byId('closeStudyDrawer').onclick=()=>{drawer=null;sync();byId('studyNotes').focus();};
  const body=byId('studyDrawerBody');body.append(byId('ws'),byId('reportBox'));
  insert('<button class="btn" id="studySaveNote">Save note</button>',byId('panelNotes'));
  byId('studySaveNote').onclick=saveNoteLink;
  insert('<div id="studyExplanation" hidden></div><div id="studyAssistance" hidden><p>Peer questions and answers are not available yet. No question is posted or saved here.</p><p>You can use an available stored explanation, your personal notes, or Report This Card.</p></div>',body);
  byId('raiseHand').onclick=()=>{if(window.TabiRaiseHand)window.TabiRaiseHand.open(curKey);};
  byId('studyExplain').onclick=()=>{drawer='explanation';sync();byId('closeStudyDrawer').focus();};
  const modal=document.createElement('div');modal.id='studyRatingModal';modal.className='study-modal-bg';modal.hidden=true;
  modal.innerHTML=`<div id="studyRatingDialog" class="study-modal" role="dialog" aria-modal="true" aria-labelledby="studyRatingTitle" aria-describedby="studyRatingDescription" tabindex="-1"><button class="study-close" id="closeStudyRating" aria-label="Close rating prompt">×</button><span class="study-eyebrow" id="studyRatingEyebrow">YOUR RECALL</span><h2 id="studyRatingTitle">Did you remember the answer to the last card?</h2><p id="studyRatingDescription">Choose the response that best matches how well you remembered.</p><div class="popup-write" id="popupWrite" hidden><div class="popup-answer"><span class="popup-answer-h">The answer</span><div id="popupAnswer"></div></div><label class="popup-write-label" for="popupReinforce"><b>Adaptive learning box</b><span>Write the answer in your own words</span></label><textarea id="popupReinforce" rows="3" maxlength="2000"></textarea><p class="effort-nudge" id="popupNudge" role="status" hidden><b>Rosalind:</b> That's pretty brief, and it doesn't look much like the answer yet. Writing it out in your own words is what makes it stick. Try a full sentence, or press Save and Next Card again to continue.</p><p class="popup-need" id="popupNeed" role="alert" hidden>Write the answer in your own words to continue.</p></div><div class="grade-actions" id="gradeActions" hidden><button class="btn" id="gradeAccept" type="button">Save and Next Card</button><button class="link" id="gradeDispute" type="button">Dispute Grading</button><button class="link retire-link" id="gradeRetire" type="button" hidden>No longer show me this card</button></div><div class="dispute-note" id="disputeNote" hidden><label for="disputeText">What did we get wrong? <span>(optional)</span></label><textarea id="disputeText" rows="3" maxlength="1000"></textarea><div class="dispute-actions"><button class="link" id="disputeBack" type="button">← Back</button><button class="btn" id="disputeSend" type="button">Send and continue →</button></div></div></div>`;
  document.body.append(modal);byId('studyRatingDialog').insertBefore(byId('rateRow'),byId('gradeActions'));byId('studyRatingDialog').insertBefore(byId('disputeNote'),byId('rateRow'));   // note first: tapping a rating submits
  // Popup views: 'grade' (the system's grade + Dispute), 'checking', 'dispute' (pick the right grade), 'manual' (no grade available).
  let popupView='manual',selfR=null,writeFor=null;   // selfR: Struggled / Didn't know picked by hand when no grade was available
  const VERDICT={good:'Good job, you knew that one.',hard:'Close. You were partly there.',again:'Not this time.'};
  function closeRating(restore=true){modal.hidden=true;dialogKey=null;byId('study').inert=false;if(restore&&returnTo?.isConnected)returnTo.focus();}
  function showPopup(){
    const g=check.current(),pending=check.pending();
    popupView=popupView==='dispute'&&g?'dispute':popupView==='self'&&selfR?'self':g&&!pendingR?'grade':pending&&!pendingR?'checking':'manual';
    const r=popupView==='grade'?g.rating:popupView==='self'?selfR:null,write=!!r&&r!=='good';
    const d=byId('studyRatingDialog');d.dataset.view=popupView;d.dataset.grade=g?g.rating:'';
    byId('gradeActions').hidden=!['grade','self'].includes(popupView);byId('disputeNote').hidden=popupView!=='dispute';byId('rateRow').hidden=popupView!=='manual';
    // Struggled / Didn't know: the adaptive learning box is right here, under Rosalind's feedback, so the next card comes next.
    byId('popupWrite').hidden=!write;if(write){const id=idOf(curKey),c=BY_ID[id],rv=isRevKey(curKey)&&REVERSE[id];byId('popupAnswer').innerHTML=rv?rv[1]:c?c[2]:'';}
    if(writeFor!==curKey){writeFor=curKey;byId('popupReinforce').value='';byId('popupNudge').hidden=true;byId('popupNeed').hidden=true;}
    byId('rateRow').querySelectorAll('[data-r]').forEach(b=>b.disabled=false);
    const T=byId('studyRatingTitle'),D=byId('studyRatingDescription'),E=byId('studyRatingEyebrow');
    byId('gradeDispute').hidden=popupView!=='grade'||(typeof isImported==='function'&&isImported(idOf(curKey)));   // a dispute emails the card to TabiPrep; imported cards stay private
    byId('gradeRetire').hidden=!(popupView==='grade'&&g.rating==='good'&&canRetire(curKey));
    if(popupView==='grade'){E.textContent=g.source==='ai'?'GRADED BY ROSALIND':'GRADED';T.textContent=VERDICT[g.rating];D.textContent=g.reasoning;}
    else if(popupView==='self'){E.textContent='YOUR RECALL';T.textContent=VERDICT[selfR];D.textContent='';}
    else if(popupView==='checking'){E.textContent='YOUR RECALL';T.textContent='Checking your answer…';D.textContent='This takes a moment.';}
    else if(popupView==='dispute'){E.textContent='DISPUTE';T.textContent='Dispute this grade';D.textContent=`We graded it ${rateLabel(g.rating)}. That grade stays for scheduling, and we'll review your dispute.`;}
    else{E.textContent='YOUR RECALL';T.textContent='Did you remember the answer to the last card?';D.textContent=check.why()||'Choose the response that best matches how well you remembered.';}
  }
  function openRating(manual){if(mode!=='cards'||!revealed||!flipped||flipping||askCfg||noteModalOpen)return;window.TabiReviewLog?.popupOpened(curKey);returnTo=document.activeElement;dialogKey=curKey;popupView=manual===true?'manual':'';selfR=null;modal.hidden=false;byId('study').inert=true;
    if(manual===true){byId('studyRatingDialog').dataset.view='manual';byId('gradeActions').hidden=true;byId('disputeNote').hidden=true;byId('rateRow').hidden=false;byId('rateRow').querySelectorAll('[data-r]').forEach(b=>b.disabled=false);byId('studyRatingTitle').textContent='Did you remember the answer to the last card?';byId('studyRatingDescription').textContent='Choose the response that best matches how well you remembered.';byId('studyRatingEyebrow').textContent='YOUR RECALL';}
    else showPopup();
    (modal.querySelector('#popupWrite:not([hidden]) #popupReinforce')||modal.querySelector('#gradeActions:not([hidden]) #gradeAccept')||modal.querySelector('#rateRow:not([hidden]) [data-r]:not(:disabled)')||byId('studyRatingDialog')).focus();}
  function applyRating(r){const key=curKey;closeRating(false);chooseRating(r);if(key===curKey&&pendingR){byId('curAnswer').focus();sync();}}
  // Save and Next Card: records the grade (and, for Struggled / Didn't know, what was written in the box) and moves to a new card.
  byId('gradeAccept').onclick=()=>{
    const g=check.current(),r=popupView==='self'?selfR:g&&g.rating;
    if(modal.hidden||dialogKey!==curKey||!r)return;
    window.TabiReviewLog?.noteGrade(curKey,popupView==='self'?{source:'self'}:{source:g.source,disputed:!!g.disputed});
    if(r==='good'){applyRating('good');return;}
    const text=byId('popupReinforce').value.trim();
    if(!text&&mandatoryOn()){byId('popupNeed').hidden=false;byId('popupReinforce').focus();return;}
    if(text&&nudgedFor!==curKey&&lowEffort(text)){nudgedFor=curKey;byId('popupNudge').hidden=false;byId('popupReinforce').focus();return;}
    closeRating(false);chooseRating(r);if(pendingR){reinforceDraft=text;submitReinforce();}sync();
  };
  byId('popupReinforce').addEventListener('input',()=>{byId('popupNeed').hidden=true;});
  // No grade available (rate yourself): Struggled / Didn't know open the box here instead of going back to the card.
  byId('rateRow').addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(!modal.hidden&&b)window.TabiReviewLog?.noteGrade(curKey,{source:'self'});if(modal.hidden||!b||b.dataset.r==='good')return;
    e.preventDefault();e.stopImmediatePropagation();selfR=b.dataset.r;popupView='self';showPopup();byId('popupReinforce').focus();},true);
  // Retire: offered once a card has been answered right before (either direction) and is right again now.
  function canRetire(key){const id=idOf(key);if(typeof retireCard!=='function'||(progress.retired&&progress.retired[id]))return false;
    return [id,id+REV].reduce((n,k)=>n+((st(k)?.history)||[]).filter(h=>h.r==='good'&&!h.b&&!h.e).length,0)>=1;}
  byId('gradeRetire').onclick=()=>{const g=check.current();if(modal.hidden||dialogKey!==curKey||!g||g.rating!=='good')return;const id=idOf(curKey);window.TabiReviewLog?.noteGrade(curKey,{source:g.source,disputed:!!g.disputed,retired:true});applyRating('good');retireCard(id);};
  byId('gradeDispute').onclick=()=>{popupView='dispute';showPopup();byId('disputeText').value='';byId('disputeText').focus();};
  // The system's grade is what the scheduler records; a dispute only sends the card for review.
  byId('disputeSend').onclick=()=>{const g=check.current();if(modal.hidden||dialogKey!==curKey||!g)return;check.dispute(byId('disputeText').value.trim());
    if(g.rating==='good'){window.TabiReviewLog?.noteGrade(curKey,{source:g.source,disputed:true});applyRating('good');return;}
    popupView='';showPopup();byId('studyRatingDescription').textContent='Dispute sent. We\'ll review it. '+g.reasoning;byId('popupReinforce').focus();};   // still write it out, then Save and Next Card
  byId('disputeBack').onclick=()=>{popupView='';showPopup();byId('gradeAccept').focus();};
  // Adaptive learning box: a very short entry that doesn't resemble the answer gets one nudge from Rosalind; pressing Next again continues.
  const STOP=new Set('the a an of to is are and or in on at by for its it that this be as with from was were which what when where who how not no yes'.split(' '));
  const words=t=>String(t||'').toLowerCase().replace(/<[^>]+>/g,' ').split(/[^a-z0-9+\-]+/).filter(w=>w&&!STOP.has(w));
  let nudgedFor=null;
  function lowEffort(text){
    const t=String(text||'').trim(),w=words(t);
    if(!t)return false;                                              // nothing written: the existing "Continue anyway?" handles it
    if(t.length>=25&&w.length>=4)return false;                       // a real attempt, whatever it says
    const c=BY_ID[idOf(curKey)];if(!c)return false;
    const ans=new Set(words(toPlain(isRevKey(curKey)?c[1]:c[2]))),stem=x=>x.replace(/(ing|ed|es|s)$/,'');
    const ansStems=new Set([...ans].map(stem)),shared=w.filter(x=>ans.has(x)||ansStems.has(stem(x))).length;
    return shared<Math.max(1,Math.ceil(w.length/2));                  // short AND mostly unrelated to the answer
  }
  function next(){if(mode!=='cards'||flipping||!revealed)return;
    if(pendingR){
      if(nudgedFor!==curKey&&lowEffort(reinforceDraft)){nudgedFor=curKey;byId('effortNudge').hidden=false;byId('curAnswer').focus();return;}
      byId('effortNudge').hidden=true;submitReinforce();return;}
    openRating();}
  byId('studyNext').onclick=next;byId('closeStudyRating').onclick=()=>closeRating();
  insert('<button class="link" id="studyChangeRating" hidden>Change rating</button>',byId('recallEntry'));
  insert('<p class="effort-nudge" id="effortNudge" role="status" hidden><b>Rosalind:</b> That\'s pretty brief, and it doesn\'t look much like the answer yet. Writing it out in your own words is what makes it stick. Try a full sentence, or press Next Card again to continue.</p>',byId('recallEntry'));
  // ---- Answer check: layer 1 key-concept match in the browser; anything that isn't a clear match goes to the AI (layer 2). ----
  // Runs as soon as the card flips, so the grade is usually ready by the time Next Card is pressed. The student can dispute it,
  // and whatever they pick is what the engine records.
  const rateLabel=r=>(byId('rateRow').querySelector(`[data-r="${r}"]`)?.textContent||r).trim();
  const check=(()=>{
    let keys=null,keysLoading=null;const state={};   // state[cacheKey] = {status:'checking'|'done'|'unavailable', ...}
    const cacheKey=()=>curKey+'|'+draft.trim();
    const store={get(k){try{return JSON.parse(sessionStorage.getItem('tabi-check:'+k)||'null');}catch(e){return null;}},set(k,v){try{sessionStorage.setItem('tabi-check:'+k,JSON.stringify(v));}catch(e){}}};
    function loadKeys(){
      if(keys)return Promise.resolve(keys);
      return keysLoading||(keysLoading=(window.TabiMatch?Promise.resolve():new Promise((ok,bad)=>{const sc=document.createElement('script');sc.src='/answer-keys/match.js';sc.onload=ok;sc.onerror=bad;document.head.append(sc);}))
        .then(()=>fetch('/answer-keys/keys.json')).then(r=>{if(!r.ok)throw new Error('keys');return r.json();}).then(k=>keys=k).catch(e=>{keysLoading=null;throw e;}));
    }
    async function token(){try{return sb?(await sb.auth.getSession()).data.session?.access_token||null:null;}catch(e){return null;}}
    async function run(k,key,answer){
      let result;
      try{
        const K=await loadKeys(),m=window.TabiMatch.grade(answer,K.keys[key]||[]);
        if(m.verdict==='right'&&!K.confirmByAI.includes(key.replace('~r','')))result={status:'done',source:'match',rating:'good',reasoning:'Your answer included every key concept on this card.'};
      }catch(e){}
      if(!result){
        const t=await token();
        if(!t)result={status:'unavailable',why:'Sign in to have your answers graded automatically. For now, rate yourself.'};
        else try{
          const r=await fetch('/api/grade',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({key,answer})});
          const d=await r.json().catch(()=>({}));
          result=r.ok&&d.rating?{status:'done',source:'ai',rating:d.rating,reasoning:d.reasoning,model:d.model}:{status:'unavailable',why:'Automatic grading isn’t available right now. Rate yourself this time.'};
        }catch(e){result={status:'unavailable',why:'Automatic grading isn’t available right now. Rate yourself this time.'};}
      }
      state[k]=result;if(result.status==='done')store.set(k,result);
      if(!modal.hidden&&dialogKey===key&&cacheKey()===k&&popupView==='checking'){showPopup();(modal.querySelector('#gradeActions:not([hidden]) #gradeAccept')||modal.querySelector('#rateRow [data-r]')).focus();}
    }
    return {
      current(){const g=state[cacheKey()];return g&&g.status==='done'?g:null;},
      pending(){return state[cacheKey()]?.status==='checking';},
      why(){const g=state[cacheKey()];return g&&g.status==='unavailable'?g.why:'';},
      // Disputes reach the owner's inbox through the same delivery as Report This Card.
      dispute(note){
        const k=cacheKey(),g=state[k];if(!g||g.status!=='done')return;
        const key=curKey,id=idOf(key),c=BY_ID[id];
        const body={_subject:`Grade disputed: ${id}`,_template:'table',_captcha:'false','Card ID':id,'Shown as':isRevKey(key)?'Reverse':'Question first','Question':toPlain(c[1]),'Card answer':toPlain(c[2]),
          'Student answer':draft.trim(),'Graded as':rateLabel(g.rating),'Graded by':g.source==='ai'?`AI (${g.model||'model not reported'})`:'Key-concept match','Grade reasoning':g.reasoning,'Student note':note||'(no note)'};
        if(sbUser){body['Disputed by']=[profile&&profile.first_name,profile&&profile.last_name].filter(Boolean).join(' ')||'(no name)';body['Email']=sbUser.email||'';if(sbUser.email)body._replyto=sbUser.email;}
        state[k]={...g,disputed:true};store.set(k,state[k]);
        fetch(REPORT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)}).catch(()=>{});
      },
      sync(){
        if(mode!=='cards'||!curKey||!revealed||!draft.trim())return;
        const k=cacheKey();
        if(!state[k]){const saved=store.get(k);if(saved)state[k]=saved;else{state[k]={status:'checking'};run(k,curKey,draft.trim());}}
      }
    };
  })();
  byId('studyChangeRating').onclick=()=>openRating(true);
  modal.onclick=e=>{if(e.target===modal)closeRating();};
  document.querySelectorAll('#rateRow [data-r]').forEach(b=>b.onclick=()=>{
    if(modal.hidden||dialogKey!==curKey||b.disabled)return;
    applyRating(b.dataset.r);
  });
  function flip(){if(mode!=='cards'||flipping||!modal.hidden)return;if(!revealed&&recall&&!draft.trim()){byId('curAnswer').focus();byId('recallMessage').textContent='Write your answer before flipping, or turn Active Recall off.';return;}tapCard();}
  byId('reveal').onclick=flip;
  byId('card').onclick=e=>{if(e.target.closest('.bm')){toggleBookmark(idOf(curKey));return;}flip();};
  byId('card').onkeydown=e=>{if(e.target===byId('card')&&['Enter',' '].includes(e.key)){e.preventDefault();flip();}};
  const originalRecall=openRecall;
  openRecall=function(){recall=true;originalRecall();sync();};
  byId('activeRecallSwitch').onchange=e=>{recall=e.target.checked;if(recall&&!revealed)openRecall();else sync();};
  byId('recallBtn').hidden=true;
  const input=byId('curAnswer').oninput;byId('curAnswer').oninput=e=>{input(e);sync();};
  const baseRender=render;render=function(){baseRender();sync();};
  const hasExplanation=id=>{const e=EXPLAIN[id];return !!(e&&((typeof e.text==='string'&&e.text.trim())||(typeof e.simple==='string'&&e.simple.trim()&&typeof e.why==='string'&&e.why.trim())));};
  function explanation(){
    const e=EXPLAIN[idOf(curKey)];if(!hasExplanation(idOf(curKey)))return '<p>No stored explanation is available for this card.</p>';
    // Only existing authored content; never generate or derive a scientific explanation.
    if(e.text)return `<p class="stored-explanation">${e.text}</p><small>Existing study-library explanation. Not newly generated.</small>`;
    return ['simple','why','example','mcat','mistake'].filter(k=>e[k]).map(k=>`<section><h3>${({simple:'In plain words',why:'Why it works',example:'Example',mcat:'MCAT connection',mistake:'Common mistake'})[k]}</h3><div>${e[k]}</div></section>`).join('')+'<small>Existing study-library explanation. Not newly generated.</small>';
  }
  function sync(){
    document.documentElement.classList.toggle('study-cards',mode==='cards');
    check.sync();
    if(mode!=='cards'){closeRating(false);drawer=null;endTour();return;}
    if(seen!==curKey){seen=curKey;drawer=null;closeRating(false);}
    const required=(mustWrite(curKey)||!!pendingR)&&mandatoryOn(),writing=!!pendingR;
    byId('activeRecallSwitch').checked=recall||required;byId('activeRecallSwitch').disabled=required;
    byId('activeRecallStatus').textContent=required?'Required':recall?'On':'Off';
    byId('recallEntry').hidden=!(recall||required||writing||draft.trim());
    byId('curLabel').textContent=writing?'Adaptive learning box': 'Your answer, from memory';
    if(!writing||seen!==curKey)byId('effortNudge').hidden=true;
    if(!writing)nudgedFor=null;
    byId('recallMessage').hidden=writing;   // reinforcing: just the box, no counters
    byId('recallMessage').textContent=writing?`${reinforceDraft.trim().length} / ${MIN_REINFORCE} characters. Reinforce your answer before continuing.`:required?'This card requires a written answer before flipping.':revealed?'Compare your written response with the revealed answer, then rate yourself.':recall?'Active Recall is on. Write your answer before revealing the other side.':'Active Recall is off for optional recall. Required writing still applies.';
    byId('recallRequired').textContent=writing?'Write the answer in your own words':revealed?'Compare your answer with the other side':(recall||required)?'Required before flipping':'Optional';
    if(!writing)byId('curAnswer').placeholder='Try to recall the answer in your own words before flipping…';
    byId('revealRow').hidden=false;byId('reveal').disabled=!revealed&&((recall||required)&&!draft.trim());
    byId('studyNext').disabled=!revealed||!flipped||(writing&&mandatoryOn()&&reinforceDraft.trim().length<MIN_REINFORCE);
    byId('studyNext').textContent=writing?'Save and Next Card →':'Next Card →';
    byId('hint').textContent=writing?'Complete your response, then continue.':revealed?'Select Next Card to rate your recall.':'Tap the card or use Flip Card.';
    byId('curHint').textContent=byId('curHint').textContent.replace('Reveal Answer','Flip Card');
    byId('studyChangeRating').hidden=true;   // the system's grade is final; no changing it here
    byId('curNext').textContent='Save and Next Card';
    byId('rateRow').hidden=modal.hidden;
    byId('studyExplain').hidden=!hasExplanation(idOf(curKey));   // no written explanation for this card: no button
    byId('studyExplain').disabled=!revealed||!hasExplanation(idOf(curKey));
    byId('studyExplain').title=!revealed?'Available after flipping':!hasExplanation(idOf(curKey))?'No stored explanation for this card':'';
    // Imported cards are private: no Raise Your Hand, and no Report (that would email the card to TabiPrep).
    const imported=typeof isImported==='function'&&isImported(idOf(curKey));
    byId('raiseHand').hidden=imported;byId('studyReport').hidden=imported;byId('studyUtilities').classList.toggle('one',imported);
    if(imported&&(drawer==='report'||drawer==='assistance'))drawer=null;
    byId('studyDrawer').hidden=!drawer;
    byId('studyReport').textContent=reportFlashFor===curKey?'✓ Thanks, flagged':'⚑ Report This Card';
    byId('studyDrawerTitle').textContent=({notes:'My Card Notes',answers:'Previous Written Answers',report:'Report This Card',explanation:'Explain This Concept',assistance:'Raise Your Hand — planned'})[drawer]||'Card tools';
    byId('ws').hidden=!['notes','answers'].includes(drawer);byId('reportBox').hidden=drawer!=='report'||!reportOpen;
    byId('studyExplanation').hidden=drawer!=='explanation';byId('studyAssistance').hidden=drawer!=='assistance';
    if(drawer==='explanation')byId('studyExplanation').innerHTML=explanation();
    if(dialogKey&&dialogKey!==curKey)closeRating(false);
  }
  document.addEventListener('keydown',e=>{
    if(modal.hidden)return;
    if(e.key==='Escape'){e.preventDefault();closeRating();return;}
    if(e.key==='Tab'){const items=[...modal.querySelectorAll('button,textarea')].filter(b=>!b.disabled&&b.offsetParent!==null),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  // The walkthrough targets the real controls. No separate demo learning logic is used.
  const tour=[['view','Choose your study mode','Choose Questions First, Answers First or Random Mix. The existing session order is preserved; the setting applies to subsequent cards.'],['card','Meet your flashcard','Read the prompt and recall the answer.'],['recallEntry','Your Active Recall answer','Write your answer before flipping when Active Recall is on.'],['reveal','Flip the card','Once you’ve written your answer, Flip Card lights up. Use the Flip Card button or click the card itself, or press Enter or Space on the card.'],['studyToolbar','Active Recall','Turn optional recall on or off. A card with mandatory writing stays required; the existing Mandatory Response setting remains available.'],['studyNext','See how you did','Next Card shows Rosalind’s grade. If you struggled or didn’t know it, write the answer in the adaptive learning box, then continue.'],['raiseHand','Raise Your Hand','Stuck on a card? Ask how other students remember it. Your question goes to students who have gotten this card right twice in a row.'],['prev','Previous card','Previous returns to the last rated card and undoes that rating, preserving the existing learning behavior.']];
  let tourIndex=-1,tourBox=null;
  function endTour(){tourBox?.remove();tourBox=null;tourIndex=-1;document.querySelectorAll('.study-tour-target,.study-tour-also').forEach(e=>e.classList.remove('study-tour-target','study-tour-also'));if(mode==='cards')byId('recallEntry').hidden=!(recall||((mustWrite(curKey)||!!pendingR)&&mandatoryOn())||pendingR||draft.trim());}
  function showTour(i){endTour();if(i>=tour.length)return;tourIndex=i;const [id,title,text]=tour[i],target=byId(id);if(id==='recallEntry')byId('recallEntry').hidden=false;target.classList.add('study-tour-target');if(id==='reveal')byId('card').classList.add('study-tour-also');target.scrollIntoView({block:'center'});tourBox=document.createElement('div');tourBox.className='study-tour';tourBox.setAttribute('role','dialog');tourBox.setAttribute('aria-label','Study Guided Tour');tourBox.innerHTML=`<small>STEP ${i+1} OF ${tour.length}</small><h3>${title}</h3><p>${text}</p><button id="studyTourExit">Exit</button>${i?'<button id="studyTourBack">Back</button>':''}<button id="studyTourNext">${i===tour.length-1?'Finish':'Next →'}</button>`;document.body.append(tourBox);const r=target.getBoundingClientRect();tourBox.style.top=Math.max(12,Math.min(innerHeight-tourBox.offsetHeight-12,r.bottom+12))+'px';byId('studyTourExit').onclick=endTour;if(i)byId('studyTourBack').onclick=()=>showTour(i-1);byId('studyTourNext').onclick=()=>showTour(i+1);byId('studyTourNext').focus();}
  byId('studyTourStart').onclick=()=>showTour(0);
  addEventListener('keydown',e=>{if(e.key==='Escape'&&tourBox)endTour();});
  // Active Recall starts on at every new session, even if it was switched off during the previous one.
  const baseStart=start;start=function(...args){recall=true;return baseStart.apply(this,args);};
  // Session time and card count shown as pills on the Card Tools row (mirrored from the engine's own header stats).
  const mirrorStats=()=>{byId('statTime').textContent=(byId('timer').textContent||'').replace(/^Study time\s*/,'')||'0:00';byId('statCount').textContent=byId('count').textContent||'';};
  ['timer','count'].forEach(id=>new MutationObserver(mirrorStats).observe(byId(id),{childList:true,characterData:true,subtree:true}));mirrorStats();
  window.MCATStudyUI={sync,openRating,closeRating,setRecall(on){recall=on;sync();}};
  sync();
})();
