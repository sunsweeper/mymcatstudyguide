'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const routes=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'))).routes;
module.exports=()=>http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/contact'){
 let raw='';for await(const c of req){raw+=c;if(raw.length>16000){res.writeHead(413).end();return;}}
 req.body=raw;res.status=n=>{res.statusCode=n;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
 return require('../api/contact')(req,res);
 }
 const hit=routes.find(r=>r.src && new RegExp(r.src).test(url.pathname));let name=hit?url.pathname.replace(new RegExp(hit.src),hit.dest):url.pathname;   // $1 captures, as on Vercel
 const file=path.resolve(root,'.'+decodeURIComponent(name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{const body=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript');res.end(body);}catch{res.writeHead(404).end();}
});
