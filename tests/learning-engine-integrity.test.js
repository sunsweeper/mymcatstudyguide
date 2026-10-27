'use strict';
const assert=require('node:assert/strict'),crypto=require('crypto'),boot=require('./harness'),baseline=require('../protected/learning-engine.json');
const api=boot({clock:1793206800000}).api;
for(const [name,expected] of Object.entries(baseline.functions))assert.equal(crypto.createHash('sha256').update(api[name].toString().replace(/\r\n/g,'\n')).digest('hex'),expected,`${name}: learning/persistence function changed without separate authorization`);
assert.deepEqual(api.RULES,baseline.RULES);assert.deepEqual(api.MASTERY,baseline.MASTERY);
console.log(`${Object.keys(baseline.functions).length} learning/persistence functions, scheduling rules and mastery criteria unchanged from approved production engine`);
