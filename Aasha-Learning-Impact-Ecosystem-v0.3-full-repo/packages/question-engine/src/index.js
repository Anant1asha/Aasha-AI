export function questionsForNode(chapter,nodeId){ return chapter.questions.filter(q=>q.nodeId===nodeId); }
export function gradeQuestion(q,answerIndex){ const correct=Number(answerIndex)===Number(q.answerIndex); return {correct,score:correct?(q.points??1):0,feedback:correct?q.feedback?.correct??'Correct':q.feedback?.incorrect??'Try again'}; }
export function summarizeAttempts(attempts){ const total=attempts.length, correct=attempts.filter(a=>a.correct).length; return {total,correct,accuracy:total?correct/total:0}; }
