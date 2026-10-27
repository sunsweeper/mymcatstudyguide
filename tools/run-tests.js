#!/usr/bin/env node
'use strict';
// Run every existing suite, including scheduling, writing, auth and persistence fixtures.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..'),files=fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.test.js')).sort();
const failed=[];
for(const file of files){
  console.log(`\n=== ${file} ===`);
  const result=spawnSync(process.execPath,[path.join(root,'tests',file)],{cwd:root,stdio:'inherit',env:process.env});
  if(result.error||result.status!==0){failed.push(file);if(result.error)console.error(result.error);}
}
console.log(`\n${files.length-failed.length}/${files.length} suites passed.`);
if(failed.length)console.error('Failed suites: '+failed.join(', '));
process.exitCode=failed.length?1:0;
