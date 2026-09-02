import { stageForClass } from '../../shared-types/src/index.js';
export function validateChapter(ch){
  if(!ch || typeof ch!=='object') throw new Error('chapter object required');
  for(const k of ['id','title','grade','subject','nodes','questions']) if(ch[k]===undefined) throw new Error(`chapter.${k} required`);
  if(!Number.isInteger(ch.grade)||ch.grade<1||ch.grade>10) throw new Error('grade must be 1-10');
  if(!Array.isArray(ch.nodes)||!ch.nodes.length) throw new Error('nodes required');
  if(!Array.isArray(ch.questions)) throw new Error('questions array required');
  const nodeIds=new Set(ch.nodes.map(n=>n.id));
  for(const n of ch.nodes){ if(!n.id||!n.title||!n.objective) throw new Error('node requires id/title/objective'); for(const d of n.dependencies??[]) if(!nodeIds.has(d)) throw new Error(`missing dependency ${d}`); }
  for(const q of ch.questions){ if(!q.id||!q.nodeId||!q.prompt||!Array.isArray(q.options)||q.answerIndex===undefined) throw new Error('invalid question'); if(!nodeIds.has(q.nodeId)) throw new Error(`question node missing: ${q.nodeId}`); }
  return { ...ch, stage: ch.stage ?? stageForClass(ch.grade), schemaVersion: ch.schemaVersion ?? 1 };
}
