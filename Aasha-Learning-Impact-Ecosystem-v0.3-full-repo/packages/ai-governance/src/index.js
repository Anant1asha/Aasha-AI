export const AI_PERMISSIONS=Object.freeze({draft_tln:true,draft_questions:true,explain:true,recommend_assets:true,publish_content:false,decide_mastery:false,decide_progression:false,grant_reward:false,make_impact_claim:false});
export function assertAiAction(action){ if(!AI_PERMISSIONS[action]) throw new Error(`AI action not permitted: ${action}`); return true; }
export function createProposal({action,input,model,version}){assertAiAction(action);return {id:crypto.randomUUID(),action,input,model,version,status:'pending_human_review',createdAt:new Date().toISOString()};}
