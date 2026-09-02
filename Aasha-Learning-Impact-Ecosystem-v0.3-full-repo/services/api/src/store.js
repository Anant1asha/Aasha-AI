import { mkdir, appendFile, readFile } from 'node:fs/promises'; import { dirname,join } from 'node:path';
const file=join(process.cwd(),'services/api/data/events.jsonl'); await mkdir(dirname(file),{recursive:true});
export async function putEvent(event){const current=await readFile(file,'utf8').catch(()=>''),exists=current.split('\n').some(l=>l.includes(`"eventId":"${event.eventId}"`));if(!exists)await appendFile(file,JSON.stringify(event)+'\n');return {accepted:true,duplicate:exists};}
export async function getEvents(){const text=await readFile(file,'utf8').catch(()=>'' );return text.trim()?text.trim().split('\n').map(JSON.parse):[];}
