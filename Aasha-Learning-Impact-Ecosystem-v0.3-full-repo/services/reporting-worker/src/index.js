import { aggregateImpact, donorSafe } from '../../../packages/impact-engine/src/index.js';
export function buildReport(events){return donorSafe(aggregateImpact(events));}
