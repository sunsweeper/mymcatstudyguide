'use strict';
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 if(req.headers.origin && ![`https://${req.headers.host}`,`http://${req.headers.host}`].includes(req.headers.origin))return res.status(403).json({error:'Invalid origin'});
 if(Number(req.headers['content-length']||0)>16000)return res.status(413).json({error:'Message too large'});
 let body=req.body;try{if(typeof body==='string')body=JSON.parse(body);}catch{return res.status(400).json({error:'Invalid JSON'});}
 const payload={};for(const[key,limit]of Object.entries({name:150,email:254,topic:80,message:5000})){
 if(typeof body?.[key]!=='string'||!body[key].trim()||body[key].length>limit)return res.status(400).json({error:'Invalid fields'});
 payload[key]=body[key].trim();}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)||payload.message.length<10)return res.status(400).json({error:'Invalid fields'});
 if(!process.env.CONTACT_WEBHOOK_URL?.startsWith('https://'))return res.status(503).json({error:'Contact delivery not configured'});
 try{const headers={'Content-Type':'application/json'};if(process.env.CONTACT_WEBHOOK_TOKEN)headers.Authorization=`Bearer ${process.env.CONTACT_WEBHOOK_TOKEN}`;
 const result=await fetch(process.env.CONTACT_WEBHOOK_URL,{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(10000),redirect:'error'});
 if(!result.ok)throw new Error('Delivery failed');return res.status(200).json({ok:true});
 }catch{return res.status(502).json({error:'Contact delivery failed'});}
};
