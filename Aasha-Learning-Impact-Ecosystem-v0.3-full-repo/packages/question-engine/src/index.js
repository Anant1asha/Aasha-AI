export function questionsForNode(chapter, nodeId){
  return (chapter.questions ?? []).filter(q => q.nodeId === nodeId);
}

export function gradeQuestion(q, answerIndex){
  const expectedIndex = q.answerIndex ?? q.correctIndex ?? q.correct_index ?? (q.options?.findIndex(o => (typeof o === 'object' && o !== null && (o.c === true || o.correct === true))));
  const correct = Number(answerIndex) === Number(expectedIndex);
  const opt = q.options?.[answerIndex];
  const optFeedback = (typeof opt === 'object' && opt !== null) ? (opt.feedback ?? opt.m) : null;
  const optMisconception = (typeof opt === 'object' && opt !== null) ? (opt.misconceptionId ?? (opt.c === false && opt.m ? (opt.misconceptionId || 'misconception_distractor') : null)) : null;
  const feedback = optFeedback ?? (correct ? (q.feedback?.correct ?? 'Correct! Great job.') : (q.feedback?.incorrect ?? 'Not quite. Think about what the question is asking.'));

  return {
    correct,
    score: correct ? (q.points ?? 1) : 0,
    feedback,
    misconceptionId: correct ? null : (optMisconception ?? null)
  };
}

export function summarizeAttempts(attempts){
  const total = attempts.length;
  const correct = attempts.filter(a => a.correct).length;
  return { total, correct, accuracy: total ? correct / total : 0 };
}
