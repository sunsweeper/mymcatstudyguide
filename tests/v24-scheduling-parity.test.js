'use strict';
const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),assert=require('node:assert/strict'),boot=require('./harness');
const base='08a3b86b19cf8d07bbeaef53be129941b274b407';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mcat-v24-parity-')),file=path.join(dir,'before.html');
fs.writeFileSync(file,cp.execFileSync('git',['show',`${base}:index.html`],{cwd:path.join(__dirname,'..')}));
let seed=73017;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const clock=Date.UTC(2026,9,27,12);let checks=0;
try{
 for(const direction of ['1A-001','1A-001~r','5D-011','S4-003'])for(const exam of [null,'2026-12-10'])for(let scenario=0;scenario<40;scenario++){
  const before=boot({file,clock}),after=boot({clock});
  for(const A of [before.api,after.api])if(exam)A.progress.testDate=exam;
  for(let i=0;i<24;i++){
   const gap=i?Math.floor(random()*35):0,r=['again','hard','good'][Math.floor(random()*3)];before.advanceDays(gap);after.advanceDays(gap);
   const jitter=random(),nativeRandom=Math.random;
   try{for(const h of [before,after]){Math.random=()=>jitter;h.api.rate(direction,r,i%3?'A written answer with enough detail.':undefined,false,{c:i%10+1,p:i%2?'Pre-flip response':undefined});}}finally{Math.random=nativeRandom;}
   assert.deepEqual(after.api.st(direction),before.api.st(direction));
   assert.deepEqual(after.api.memOf(direction),before.api.memOf(direction));
   assert.equal(after.api.levelOf(direction),before.api.levelOf(direction));checks++;
  }
 }
 // Exact code protection for functions responsible for learning and persisted data.
 const original=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'),current=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').replace(/\r\n/g,'\n');
 const fn=(s,n)=>{let start=s.indexOf(`function ${n}(`);if(start<0){start=s.indexOf(`const ${n} =`);assert.ok(start>=0,n);return s.slice(start,s.indexOf('\n',start));}const line=s.indexOf('\n',start),one=s.slice(start,line);return one.endsWith('}')?one:s.slice(start,s.indexOf('\n}',start)+2);};
 const protectedFunctions=['rate','memoryFrom','memOf','levelOf','cardLevel','fsrsInterval','fsrsDays','buildQueue','start','previousCard','finishCard','answer','mergeProgress','pushProgress','pullMerge','persistPlace','stashDraft','restoreDraft','sendReport','mustWrite','finishSession','toReinforce','endOfPass','startRetry','chooseRating'];
 for(const name of protectedFunctions)assert.equal(fn(current,name),fn(original,name),`${name} changed`);
 console.log(`${checks} before/after scheduling, history and mastery comparisons passed; ${protectedFunctions.length} protected learning/data functions unchanged.`);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
