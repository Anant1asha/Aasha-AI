export function syncResult(sent,failed,conflicts=0){return {sent,failed,conflicts,generatedAt:new Date().toISOString()};}
