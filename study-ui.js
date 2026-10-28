/* Interaction adapter. The original engine and persistence functions remain authoritative. */
(() => {
  'use strict';
  const byId=id=>document.getElementById(id), workspace=byId('study').firstElementChild;
  let recall=true, drawer=null, dialogKey=null, returnTo=null, seen=null;
  const insert=(html,parent=workspace)=>{const t=document.createElement('template');t.innerHTML=html;parent.append(t.content);};
  insert(`<div class="study-toolbar" id="studyToolbar"><label class="study-recall-toggle"><span>Active Recall</span><input id="activeRecallSwitch" type="checkbox" role="switch" aria-describedby="recallMessage" checked><span id="activeRecallStatus">On</span></label><button class="link" id="studyTourStart">Guided Tour</button></div>
    <div class="study-tools" id="studyTools"><span>CARD TOOLS</span><button class="btn" id="studyNotes">✎ My Card Notes</button><button class="btn" id="studyAnswers">Previous Answers</button><button class="btn" id="studyReport">⚑ Report This Card</button></div>
    <div class="study-recall-entry" id="recallEntry"><p id="recallMessage" role="status"></p></div>
    <div class="study-utilities" id="studyUtilities"><button class="btn" id="raiseHand">? Raise Your Hand (planned)</button><button class="btn" id="studyExplain">Explain This Concept</button><button class="btn" id="studyNext" aria-haspopup="dialog">Next Card →</button></div>
    <section class="study-drawer" id="studyDrawer" hidden aria-labelledby="studyDrawerTitle"><div class="study-drawer-head"><strong id="studyDrawerTitle">Card tools</strong><button class="btn" id="closeStudyDrawer" aria-label="Close panel">×</button></div><div id="studyDrawerBody"></div></section>`);
  const inputBlock=byId('curAnswer').closest('.ans-cur');byId('recallEntry').prepend(inputBlock);
  byId('curLabel').textContent='Your answer, from memory';byId('curAnswer').rows=2;
  byId('reveal').textContent='Flip Card';byId('prev').textContent='← Previous';
  const header=byId('view');header.before(byId('studyToolbar'));header.after(byId('studyTools'));byId('studyToolbar').prepend(header);
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
  byId('raiseHand').onclick=()=>{drawer='assistance';sync();byId('closeStudyDrawer').focus();};
  byId('studyExplain').onclick=()=>{drawer='explanation';sync();byId('closeStudyDrawer').focus();};
  const modal=document.createElement('div');modal.id='studyRatingModal';modal.className='study-modal-bg';modal.hidden=true;
  modal.innerHTML=`<div id="studyRatingDialog" class="study-modal" role="dialog" aria-modal="true" aria-labelledby="studyRatingTitle" aria-describedby="studyRatingDescription" tabindex="-1"><button class="study-close" id="closeStudyRating" aria-label="Close rating prompt">×</button><span class="study-eyebrow">YOUR RECALL</span><h2 id="studyRatingTitle">Did you remember the answer to the last card?</h2><p id="studyRatingDescription">Choose the response that best matches how well you remembered.</p></div>`;
  document.body.append(modal);byId('studyRatingDialog').append(byId('rateRow'));
  function closeRating(restore=true){modal.hidden=true;dialogKey=null;byId('study').inert=false;if(restore&&returnTo?.isConnected)returnTo.focus();}
  function openRating(){if(mode!=='cards'||!revealed||!flipped||flipping||askCfg||noteModalOpen)return;returnTo=document.activeElement;dialogKey=curKey;modal.hidden=false;byId('rateRow').hidden=false;byId('study').inert=true;modal.querySelector('[data-r]').focus();}
  function next(){if(mode!=='cards'||flipping||!revealed)return;if(pendingR){submitReinforce();return;}openRating();}
  byId('studyNext').onclick=next;byId('closeStudyRating').onclick=()=>closeRating();
  insert('<button class="link" id="studyChangeRating" hidden>Change rating</button>',byId('recallEntry'));
  byId('studyChangeRating').onclick=openRating;
  modal.onclick=e=>{if(e.target===modal)closeRating();};
  document.querySelectorAll('#rateRow [data-r]').forEach(b=>b.onclick=()=>{
    if(modal.hidden||dialogKey!==curKey)return;const key=curKey;closeRating(false);chooseRating(b.dataset.r);
    if(key===curKey&&pendingR){byId('curAnswer').focus();sync();}
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
    if(mode!=='cards'){closeRating(false);drawer=null;endTour();return;}
    if(seen!==curKey){seen=curKey;drawer=null;closeRating(false);}
    const required=(mustWrite(curKey)||!!pendingR)&&mandatoryOn(),writing=!!pendingR;
    byId('activeRecallSwitch').checked=recall||required;byId('activeRecallSwitch').disabled=required;
    byId('activeRecallStatus').textContent=required?'Required':recall?'On':'Off';
    byId('recallEntry').hidden=!(recall||required||writing||draft.trim());
    byId('curLabel').textContent=writing?'Reinforce your answer': 'Your answer, from memory';
    byId('recallMessage').textContent=writing?`Write at least ${MIN_REINFORCE} characters, then continue. The existing Mandatory Response setting still applies.`:required?'This card requires a written answer before flipping.':revealed?'Compare your response with the answer, then select Next Card.':recall?'Active Recall is on. Write your answer before flipping.':'Active Recall is off for optional recall. Required writing still applies.';
    byId('revealRow').hidden=false;byId('reveal').disabled=!revealed&&((recall||required)&&!draft.trim());
    byId('studyNext').disabled=!revealed||!flipped||(writing&&mandatoryOn()&&reinforceDraft.trim().length<MIN_REINFORCE);
    byId('studyNext').textContent=writing?'Save response & Next Card →':'Next Card →';
    byId('hint').textContent=writing?'Complete your response, then continue.':revealed?'Select Next Card to rate your recall.':'Tap the card or use Flip Card.';
    byId('curHint').textContent=byId('curHint').textContent.replace('Reveal Answer','Flip Card');
    byId('studyChangeRating').hidden=!writing;
    byId('curNext').textContent='Save response & Next Card';
    byId('rateRow').hidden=modal.hidden;
    byId('studyExplain').disabled=!revealed||!hasExplanation(idOf(curKey));
    byId('studyExplain').title=!revealed?'Available after flipping':!hasExplanation(idOf(curKey))?'No stored explanation for this card':'';
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
    if(e.key==='Tab'){const items=[...modal.querySelectorAll('button')].filter(b=>!b.disabled),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  // The walkthrough targets the real controls. No separate demo learning logic is used.
  const tour=[['view','Choose your study mode','Choose Questions First, Answers First or Random Mix. The existing session order is preserved; the setting applies to subsequent cards.'],['card','Meet your flashcard','Read the prompt and recall the answer.'],['recallEntry','Your Active Recall answer','Write your answer before flipping when Active Recall is on.'],['reveal','Flip the card','Once you’ve written your answer, Flip Card lights up. Use the Flip Card button or click the card itself, or press Enter or Space on the card.'],['studyToolbar','Active Recall','Turn optional recall on or off. A card with mandatory writing stays required; the existing Mandatory Response setting remains available.'],['studyNext','Tell the system how it went','Next Card opens the recall prompt. Got it records the review. Struggled and Didn’t know require the existing reinforcement response before advancing.'],['raiseHand','Get help','Existing explanations are available on supported cards after flipping. Peer questions and answers are planned, not available yet.'],['prev','Previous card','Previous returns to the last rated card and undoes that rating, preserving the existing learning behavior.']];
  let tourIndex=-1,tourBox=null;
  function endTour(){tourBox?.remove();tourBox=null;tourIndex=-1;document.querySelectorAll('.study-tour-target,.study-tour-also').forEach(e=>e.classList.remove('study-tour-target','study-tour-also'));if(mode==='cards')byId('recallEntry').hidden=!(recall||((mustWrite(curKey)||!!pendingR)&&mandatoryOn())||pendingR||draft.trim());}
  function showTour(i){endTour();if(i>=tour.length)return;tourIndex=i;const [id,title,text]=tour[i],target=byId(id);if(id==='recallEntry')byId('recallEntry').hidden=false;target.classList.add('study-tour-target');if(id==='reveal')byId('card').classList.add('study-tour-also');target.scrollIntoView({block:'center'});tourBox=document.createElement('div');tourBox.className='study-tour';tourBox.setAttribute('role','dialog');tourBox.setAttribute('aria-label','Study Guided Tour');tourBox.innerHTML=`<small>STEP ${i+1} OF ${tour.length}</small><h3>${title}</h3><p>${text}</p><button id="studyTourExit">Exit</button>${i?'<button id="studyTourBack">Back</button>':''}<button id="studyTourNext">${i===tour.length-1?'Finish':'Next →'}</button>`;document.body.append(tourBox);const r=target.getBoundingClientRect();tourBox.style.top=Math.max(12,Math.min(innerHeight-tourBox.offsetHeight-12,r.bottom+12))+'px';byId('studyTourExit').onclick=endTour;if(i)byId('studyTourBack').onclick=()=>showTour(i-1);byId('studyTourNext').onclick=()=>showTour(i+1);byId('studyTourNext').focus();}
  byId('studyTourStart').onclick=()=>showTour(0);
  addEventListener('keydown',e=>{if(e.key==='Escape'&&tourBox)endTour();});
  // Active Recall starts on at every new session, even if it was switched off during the previous one.
  const baseStart=start;start=function(...args){recall=true;return baseStart.apply(this,args);};
  window.MCATStudyUI={sync,openRating,closeRating,setRecall(on){recall=on;sync();}};
  sync();
})();
