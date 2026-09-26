import { recordEvent } from './events.js';
import { computeNodeMastery, TEAS_POLICY } from '../../../Aasha-Learning-Impact-Ecosystem-v0.3-full-repo/packages/teas-engine/src/policy.js';

/**
 * Dynamic Difficulty Engine (DDA)
 * Computes learner hesitation, solve velocity, and error patterns
 * to adjust scaffolding tier and challenge level in real-time.
 * Optimized O(1) backwards scan over recent events.
 */
const eventEvidenceCache = new WeakMap();
function getEventEvidence(state) {
  const events = state.events || [];
  let cache = eventEvidenceCache.get(state);
  if (!cache || cache.processedCount > events.length) {
    cache = { processedCount: 0, nodes: new Map() };
    eventEvidenceCache.set(state, cache);
  }
  for (let i = cache.processedCount; i < events.length; i++) {
    const event = events[i];
    const nodeId = event?.payload?.node_id;
    if (typeof nodeId !== 'string') continue;
    let node = cache.nodes.get(nodeId);
    if (!node) { node = { attempts: [], misconceptions: new Set(), simInteractions: 0 }; cache.nodes.set(nodeId, node); }
    if (event.event_type === 'answer_submitted') {
      const correct = event.payload.result === 'correct';
      node.attempts.push({ correct });
      if (!correct && event.payload.misconception) node.misconceptions.add(event.payload.misconception);
    } else if (event.event_type === 'simulation_telemetry') node.simInteractions++;
  }
  cache.processedCount = events.length;
  return cache;
}
export class DynamicDifficultyEngine {
  static evaluateDifficulty(state, nodeId) {
    const events = state.events || [];
    const recentAnswers = [];
    const telemetryCount = getEventEvidence(state).nodes.get(nodeId)?.simInteractions || 0;

    // Fast backwards scan to get recent node activity without full array scans
    for (let i = events.length - 1; i >= 0 && recentAnswers.length < 5; i--) {
      const e = events[i];
      if (e.payload && e.payload.node_id === nodeId) {
        if (e.event_type === 'answer_submitted' && recentAnswers.length < 5) {
          recentAnswers.push(e);
        } else if (e.event_type === 'simulation_telemetry') {
          telemetryCount++;
        }
      }
    }

    if (recentAnswers.length === 0) {
      return {
        currentTier: 1,
        tierName: 'Warm-up / Foundational Scaffolding',
        timeDilation: 1.0,
        hintRecommended: false,
        hesitationIndex: 0,
        telemetryInteractionsCount: telemetryCount,
        adaptiveMultiplier: 0.8
      };
    }

    const recent = recentAnswers.slice(0, 3);
    const recentCorrect = recent.filter(a => a.payload.result === 'correct').length;
    const avgResponseTime = recent.reduce((sum, a) => sum + (a.payload.response_time_ms || 3000), 0) / recent.length;

    // Hesitation threshold: > 12 seconds indicates struggle
    const isHesitating = avgResponseTime > 12000;
    const highAccuracy = recentCorrect >= 2 && avgResponseTime < 6000;

    let tier = 2; // Default Standard
    let tierName = 'Deep Dive / Standard Practice';
    let hintRecommended = false;

    if (recentCorrect === 0 || (isHesitating && recentCorrect < 2)) {
      tier = 1;
      tierName = 'Warm-up / Scaffolding';
      hintRecommended = true;
    } else if (highAccuracy && recentAnswers.length >= 2) {
      tier = 3;
      tierName = 'Boss Challenge / Accelerated Mastery';
      hintRecommended = false;
    }

    return {
      currentTier: tier,
      tierName,
      avgResponseTimeMs: Math.round(avgResponseTime),
      isHesitating,
      hintRecommended,
      telemetryInteractionsCount: telemetryCount,
      adaptiveMultiplier: tier === 3 ? 1.5 : tier === 1 ? 0.8 : 1.0
    };
  }
}

/**
 * 4-Tier Progressive Scaffolding Hint Generator
 * Strictly enforces L-Truth standard: zero answer leaks across all tiers.
 */
export function getScaffoldingHint(question, hintTier = 1) {
  const qPrompt = question.prompt || '';
  const isFraction = /fraction|denominator|numerator|\//i.test(qPrompt);
  const isAlgebra = /expression|term|variable|algebra/i.test(qPrompt);
  const isGeometry = /perimeter|area|boundary|length|width/i.test(qPrompt);

  const tier = Math.max(1, Math.min(4, hintTier));

  if (isFraction) {
    switch (tier) {
      case 1:
        return { tier: 1, type: 'H1_HOOK', text: 'Look at the denominator: what does the bottom number tell you about equal parts?' };
      case 2:
        return { tier: 2, type: 'H2_CONCEPT', text: 'The denominator names the total equal slices of one whole; the numerator counts how many slices are chosen.' };
      case 3:
        return { tier: 3, type: 'H3_STRATEGY', text: 'Before adding or subtracting fractions, check if the denominators match. If not, find a common denominator.' };
      case 4:
        return { tier: 4, type: 'H4_CHECKPOINT', text: 'Count the shaded parts one by one, then compare that count to the total equal divisions.' };
    }
  }

  if (isAlgebra) {
    switch (tier) {
      case 1:
        return { tier: 1, type: 'H1_HOOK', text: 'Notice which terms share the exact same variable parts and powers.' };
      case 2:
        return { tier: 2, type: 'H2_CONCEPT', text: 'Only like terms can be combined directly by adding or subtracting their coefficients.' };
      case 3:
        return { tier: 3, type: 'H3_STRATEGY', text: 'Group like terms together first with their signs intact before performing the arithmetic.' };
      case 4:
        return { tier: 4, type: 'H4_CHECKPOINT', text: 'Separate the variable terms from the constant numerical values and combine each group.' };
    }
  }

  if (isGeometry) {
    switch (tier) {
      case 1:
        return { tier: 1, type: 'H1_HOOK', text: 'Remember that perimeter measures the outer boundary walk, while area measures the inner surface.' };
      case 2:
        return { tier: 2, type: 'H2_CONCEPT', text: 'To find the perimeter, follow every single outer side around the closed figure.' };
      case 3:
        return { tier: 3, type: 'H3_STRATEGY', text: 'Sum the lengths of all bounding segments: verify that no outer edge is missed or counted twice.' };
      case 4:
        return { tier: 4, type: 'H4_CHECKPOINT', text: 'Trace the shape clockwise side-by-side, adding each segment length to your running total.' };
    }
  }

  // Universal Fallback
  switch (tier) {
    case 1:
      return { tier: 1, type: 'H1_HOOK', text: 'Reread the question carefully and identify the exact quantity you are asked to find.' };
    case 2:
      return { tier: 2, type: 'H2_CONCEPT', text: 'Connect the given values to the fundamental definition introduced in this lesson.' };
    case 3:
      return { tier: 3, type: 'H3_STRATEGY', text: 'Break the problem down into two simpler sub-steps before selecting your option.' };
    case 4:
      return { tier: 4, type: 'H4_CHECKPOINT', text: 'Double-check your unit of measurement and verify that your answer satisfies the initial condition.' };
  }
}

/**
 * Compute Deterministic Mastery
 * Single-pass event partition for sub-millisecond evaluation
 */
export function computeMastery(state, nodeId) {
  const evidence = getEventEvidence(state).nodes.get(nodeId) || { attempts: [], misconceptions: new Set(), simInteractions: 0 };
  const mastery = computeNodeMastery(evidence.attempts);
  return {
    attempts: mastery.attempts,
    correct: mastery.correct,
    accuracy: Math.round(mastery.accuracy * 100),
    recent_accuracy: Math.round(mastery.recentAccuracy * 100),
    mastery: Math.round(mastery.mastery * 100),
    eligible_to_progress: mastery.eligibleToProgress,
    misconceptions: [...evidence.misconceptions],
    sim_interactions: evidence.simInteractions,
  };
}

export function refreshMastery(state, chapter) {
  const out = {};
  if (chapter && Array.isArray(chapter.nodes)) {
    for (const n of chapter.nodes) {
      out[n.id] = computeMastery(state, n.id);
    }
  }
  state.mastery = out;
  return out;
}

export function progressionDecision(state, nodeId) {
  const m = (state.mastery && state.mastery[nodeId]) || { attempts: 0, mastery: 0 };
  if (m.attempts === 0 && m.mastery === 0) {
    return { action: 'learn', reason: 'No assessment attempt evidence yet' };
  }
  if (m.attempts < TEAS_POLICY.minimumAttempts) {
    return { action: 'practice', reason: 'Minimum TEAS attempt count not reached.' };
  }
  if (m.mastery < 50) {
    return { action: 'remediate', reason: 'Evidence shows a significant learning gap; step-by-step review recommended' };
  }
  if (m.mastery < 75) {
    return { action: 'practice', reason: 'Consolidate the concept with targeted practice' };
  }
  if (m.eligible_to_progress !== true) return { action: 'practice', reason: 'TEAS progression threshold not met.' };
  return { action: 'advance', reason: 'Canonical TEAS threshold and attempt minimum satisfied.' };
}

export function recordSimulationTelemetry(state, nodeId, telemetryData) {
  const e = recordEvent(state, 'simulation_telemetry', {
    node_id: nodeId,
    ...telemetryData,
    timestamp: Date.now()
  });
  if (nodeId) {
    refreshMastery(state, { nodes: [{ id: nodeId }] });
  }
  return e;
}

export function submitAssessment(state, question, selected, responseTimeMs) {
  const correct = selected === question.correct_index;
  const dda = DynamicDifficultyEngine.evaluateDifficulty(state, question.node_id);

  const e = recordEvent(state, 'answer_submitted', {
    question_id: question.id,
    node_id: question.node_id,
    result: correct ? 'correct' : 'incorrect',
    response_time_ms: responseTimeMs,
    misconception: correct ? null : question.misconception,
    difficulty_tier: dda.currentTier
  });

  refreshMastery(state, { nodes: [{ id: question.node_id }] });
  return { correct, dda, event_id: e.event_id };
}




