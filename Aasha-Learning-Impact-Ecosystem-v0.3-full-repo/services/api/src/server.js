import http from 'node:http'; import { readFile, mkdir, appendFile } from 'node:fs/promises'; import { dirname, join } from 'node:path';
const DATA=join(process.cwd(),'services/api/data/events.jsonl'); await mkdir(dirname(DATA),{recursive:true});
const send=(res,status,obj)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(obj));};
const server=http.createServer(async(req,res)=>{
 try{
  if(req.method==='GET'&&req.url==='/health')return send(res,200,{ok:true,service:'aasha-api'});
  if(req.method==='POST'&&req.url==='/api/events'){let body='';for await(const c of req)body+=c;const e=JSON.parse(body);if(!e.eventId||!e.learnerId||!e.type)return send(res,400,{error:'invalid event'});await appendFile(DATA,JSON.stringify(e)+'\n');return send(res,202,{accepted:true,eventId:e.eventId});}
  if(req.method==='GET'&&req.url==='/api/impact'){const text=await readFile(DATA,'utf8').catch(()=>''),events=text.trim()?text.trim().split('\n').map(JSON.parse):[];const learners=new Set(events.map(e=>e.learnerId));return send(res,200,{studentsReached:learners.size,events:events.length});}
  send(res,404,{error:'not_found'});
 }catch(err){send(res,500,{error:'server_error',message:err.message})}
});server.listen(process.env.PORT||8787,()=>console.log(`Aasha API: http://localhost:${process.env.PORT||8787}`));
