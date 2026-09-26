export const TEAS_POLICY = Object.freeze({
  policyId: 'AASHA-TEAS-CANONICAL',
  version: '1.0.0',
  authority: 'TEAS',
  aiCanRecommend: false,
  masteryThreshold: 0.75,
  minimumAttempts: 3,
  recentWindowAttempts: 5,
  historicalWeight: 0.6,
  recentWeight: 0.4,
  simulationMasteryBonus: 0,
  progression: 'SEQUENTIAL_UNLOCK',
  scoreScale: '0_TO_1',
});

export function canProgress({ accuracy, attempts }) {
  return Number.isFinite(accuracy) && Number.isInteger(attempts) && attempts >= TEAS_POLICY.minimumAttempts && accuracy >= TEAS_POLICY.masteryThreshold;
}

export function computeNodeMastery(attempts) {
  if (!Array.isArray(attempts) || attempts.some(a => !a || typeof a.correct !== 'boolean')) {
    throw new TypeError('TEAS requires an array of attempts with boolean correct values.');
  }
  const total = attempts.length;
  const correct = attempts.filter(a => a.correct).length;
  const recent = attempts.slice(-TEAS_POLICY.recentWindowAttempts);
  const accuracy = total ? correct / total : 0;
  const recentAccuracy = recent.length ? recent.filter(a => a.correct).length / recent.length : 0;
  return {
    attempts: total,
    correct,
    accuracy,
    recentAccuracy,
    mastery: TEAS_POLICY.historicalWeight * accuracy + TEAS_POLICY.recentWeight * recentAccuracy,
    eligibleToProgress: canProgress({ accuracy: TEAS_POLICY.historicalWeight * accuracy + TEAS_POLICY.recentWeight * recentAccuracy, attempts: total }),
  };
}
