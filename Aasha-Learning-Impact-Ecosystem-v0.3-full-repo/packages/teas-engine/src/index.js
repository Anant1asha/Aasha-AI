import { TEAS_POLICY, computeNodeMastery, canProgress } from './policy.js';

export { TEAS_POLICY, canProgress };

/** Accept only attempt-level evidence. Aggregate mastery booleans are not evidence. */
export function computeMasteryByNode(results) {
  if (!Array.isArray(results)) throw new TypeError('TEAS results must be an array.');
  const grouped = new Map();
  for (const result of results) {
    if (!result || typeof result.nodeId !== 'string' || !Array.isArray(result.attempts)) {
      throw new TypeError('Each TEAS result needs nodeId and attempt-level attempts.');
    }
    const attempts = grouped.get(result.nodeId) ?? [];
    attempts.push(...result.attempts);
    grouped.set(result.nodeId, attempts);
  }
  return Object.fromEntries([...grouped].map(([nodeId, attempts]) => [nodeId, computeNodeMastery(attempts)]));
}

export function progressionAuthority({ orderedNodeIds, masteryByNode }) {
  if (!Array.isArray(orderedNodeIds) || orderedNodeIds.some(id => typeof id !== 'string')) throw new TypeError('orderedNodeIds must be string IDs.');
  const unlocked = [];
  for (const id of orderedNodeIds) {
    const mastery = masteryByNode[id];
    if (!mastery || !canProgress({ accuracy: mastery.mastery, attempts: mastery.attempts })) break;
    unlocked.push(id);
  }
  return { unlocked, authority: 'teas', next: orderedNodeIds[unlocked.length] ?? null, policyId: TEAS_POLICY.policyId, policyVersion: TEAS_POLICY.version };
}
