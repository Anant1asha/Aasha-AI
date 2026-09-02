export const BETA_REWARD_POLICY=Object.freeze({verificationMode:'manual_beta',priority:'low',learningReward:'xp',coinsEnabled:true,automatedVerification:false});
export function eligibleBetaEvent({type,verifiedByHuman}){return ['assessment_passed','content_completed','seva_verified'].includes(type)&&verifiedByHuman===true;}
