import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const port=Number(process.env.PORT||4173);
const routeMap=new Map([
  ['/', 'apps/learner-web/index.html'],
  ['/index.html', 'apps/learner-web/index.html'],
  ['/app.js', 'apps/learner-web/src/app.js'],
  ['/styles.css', 'apps/learner-web/styles.css'],
  ['/manifest.webmanifest', 'apps/learner-web/manifest.webmanifest'],
  ['/sw.js', 'apps/learner-web/sw.js']
]);
const mime=(p)=>p.endsWith('.html')?'text/html':p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.json')?'application/json':'application/octet-stream';
const server=http.createServer(async(req,res)=>{
  try {
    const pathname=new URL(req.url??'/',`http://${req.headers.host??'localhost'}`).pathname;
    const mapped=routeMap.get(pathname)??pathname.replace(/^\/+/, '');
    const file=join(root,mapped);
    const data=await readFile(file);
    res.writeHead(200,{'content-type':mime(file),'cache-control':'no-cache'}); res.end(data);
  } catch { if(!res.headersSent){res.writeHead(404,{'content-type':'text/plain'});res.end('Not found');} }
});
server.listen(port,()=>console.log(`Learner app: http://localhost:${port}`));
