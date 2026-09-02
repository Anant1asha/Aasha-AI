export const TEAS_POLICY=Object.freeze({masteryThreshold:.75,minimumAttempts:3,progressionAuthority:'teas',aiCanRecommend:false});
export function canProgress({accuracy,attempts}){return attempts>=TEAS_POLICY.minimumAttempts&&accuracy>=TEAS_POLICY.masteryThreshold;}
