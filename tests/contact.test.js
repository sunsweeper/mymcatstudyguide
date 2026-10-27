'use strict';
const assert=require('node:assert/strict'),handler=require('../api/contact');
const body={name:'Test',email:'test@example.com',topic:'General question',message:'A valid test message.'};
const request=async(overrides={})=>{let status=200,result;const res={setHeader(){},status(n){status=n;return this;},json(x){result=x;return this;}};await handler({method:'POST',headers:{host:'example.com',origin:'https://example.com'},body,...overrides},res);return {status,result};};
(async()=>{const originalFetch=global.fetch,originalURL=process.env.CONTACT_WEBHOOK_URL;try{
 delete process.env.CONTACT_WEBHOOK_URL;assert.equal((await request()).status,503);
 assert.equal((await request({method:'GET'})).status,405);
 assert.equal((await request({body:{...body,email:'invalid'}})).status,400);
 assert.equal((await request({headers:{host:'example.com',origin:'https://evil.example'}})).status,403);
 process.env.CONTACT_WEBHOOK_URL='https://helpdesk.example/webhook';
 global.fetch=async(url,options)=>{assert.equal(url,process.env.CONTACT_WEBHOOK_URL);assert.deepEqual(JSON.parse(options.body),body);return {ok:true};};
 assert.equal((await request()).status,200);
 global.fetch=async()=>({ok:false});assert.equal((await request()).status,502);
 console.log('6 contact API checks passed (mocked delivery; no real message sent)');
 }finally{global.fetch=originalFetch;if(originalURL===undefined)delete process.env.CONTACT_WEBHOOK_URL;else process.env.CONTACT_WEBHOOK_URL=originalURL;}
})().catch(e=>{console.error(e);process.exitCode=1;});
