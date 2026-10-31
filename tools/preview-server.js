'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const routes=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'))).routes;
module.exports=()=>http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(/^\/api\/[a-z-]+$/.test(url.pathname)&&fs.existsSync(path.join(root,'api',url.pathname.slice(5)+'.js'))){
 let raw='';for await(const c of req){raw+=c;if(raw.length>16000){res.writeHead(413).end();return;}}
 if(url.pathname==='/api/deck'&&/^Bearer /.test(req.headers.authorization||''))req.previewUser={id:'preview-user',user_metadata:{courses:['mcat','spanish']}};   // tests: any mock session counts as signed in
 req.body=raw;res.status=n=>{res.statusCode=n;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
 return require('../api'+url.pathname.slice(4))(req,res);
 }
 if(url.pathname.startsWith('/_vercel/')){res.setHeader('Content-Type','text/javascript');res.end('');return;}   // Vercel serves its analytics script itself
 const has=r=>!r.has||r.has.every(h=>h.type==='query'&&url.searchParams.has(h.key));
 const hit=routes.find(r=>r.src && new RegExp(r.src).test(url.pathname) && has(r));
 if(hit&&hit.status&&hit.headers&&hit.headers.Location){res.writeHead(hit.status,{Location:url.pathname.replace(new RegExp(hit.src),hit.headers.Location)+url.search});res.end();return;}   // redirects, as on Vercel
 let name=hit?url.pathname.replace(new RegExp(hit.src),hit.dest):url.pathname;   // $1 captures, as on Vercel
 const file=path.resolve(root,'.'+decodeURIComponent(name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{const body=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/javascript');res.end(body);}catch{res.writeHead(404).end();}
});
