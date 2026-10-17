import { stageForClass } from '../../shared-types/src/index.js';
export function validateChapter(ch){
  if(!ch || typeof ch!=='object') throw new Error('chapter object required');
  for(const k of ['id','title','grade','subject','nodes','questions']) if(ch[k]===undefined) throw new Error(`chapter.${k} required`);
  if(!Number.isInteger(ch.grade)||ch.grade<1||ch.grade>10) throw new Error('grade must be 1-10');
  if(!Array.isArray(ch.nodes)||!ch.nodes.length) throw new Error('nodes required');
  if(!Array.isArray(ch.questions)) throw new Error('questions array required');
  const nodeIds=new Set(ch.nodes.map(n=>n.id));
  for(const n of ch.nodes){ if(!n.id||!n.title||!n.objective) throw new Error('node requires id/title/objective'); for(const d of n.dependencies??[]) if(!nodeIds.has(d)) throw new Error(`missing dependency ${d}`); }
  const seenQuestionIds = new Set();
  for(const q of ch.questions){
    if(!q.id || typeof q.id !== 'string') throw new Error('question requires non-empty string id');
    if(seenQuestionIds.has(q.id)) throw new Error(`duplicate question id: ${q.id}`);
    seenQuestionIds.add(q.id);

    if(!q.nodeId || !nodeIds.has(q.nodeId)) throw new Error(`question node missing: ${q.nodeId}`);
    if(!q.prompt || typeof q.prompt !== 'string') throw new Error(`question ${q.id} requires string prompt`);
    if(!Array.isArray(q.options) || q.options.length < 2) throw new Error(`question ${q.id} requires options array with at least 2 options`);

    const expectedIndex = q.answerIndex ?? q.correctIndex ?? q.correct_index ?? (q.options.findIndex(o => typeof o === 'object' && o !== null && (o.c === true || o.correct === true || o.isCorrect === true)));
    if (expectedIndex === undefined || expectedIndex === null || !Number.isInteger(expectedIndex) || expectedIndex < 0 || expectedIndex >= q.options.length) {
      throw new Error(`question ${q.id} has invalid or out-of-bounds answer index: ${expectedIndex}`);
    }
  }
  return { ...ch, stage: ch.stage ?? stageForClass(ch.grade), schemaVersion: ch.schemaVersion ?? 1 };
}
