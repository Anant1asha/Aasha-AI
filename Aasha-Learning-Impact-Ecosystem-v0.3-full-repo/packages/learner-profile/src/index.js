const KEY='aasha.profile.v2';
export function loadProfile(storage=globalThis.localStorage){ try{return JSON.parse(storage.getItem(KEY)||'null')}catch{return null} }
export function saveProfile(profile,storage=globalThis.localStorage){ if(!profile?.learnerId) throw new Error('learnerId required'); storage.setItem(KEY,JSON.stringify(profile)); return profile; }
export function createProfile({learnerId,name='Learner',grade=1,language='hi-en'}={}){ if(!Number.isInteger(grade)||grade<1||grade>10) throw new Error('grade must be 1-10'); return {learnerId,name,grade,language,createdAt:new Date().toISOString(),version:2}; }
