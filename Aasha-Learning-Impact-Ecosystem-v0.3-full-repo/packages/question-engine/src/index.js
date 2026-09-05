export function questionsForNode(chapter, nodeId){
  return (chapter.questions ?? []).filter(q => q.nodeId === nodeId);
}

export function gradeQuestion(q, answerIndex){
  const correct = Number(answerIndex) === Number(q.answerIndex);
  const opt = q.options?.[answerIndex];
  const optFeedback = (typeof opt === 'object' && opt !== null) ? opt.feedback : null;
  const optMisconception = (typeof opt === 'object' && opt !== null) ? opt.misconceptionId : null;
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
