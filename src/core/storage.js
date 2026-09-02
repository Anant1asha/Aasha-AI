const KEY='aasha_beta_state_v2';
const defaultState=()=>({schema_version:2,learner:null,language:'en',active_chapter:'fractions-demo',concept_cursor:0,events:[],reward_ledger:[],sync_outbox:[],mastery:{},badges:[],xp:0,coins:0,streak:0,last_answer_at:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
export function loadState(){try{if(typeof localStorage==='undefined')return defaultState();const raw=localStorage.getItem(KEY);return raw?migrate(JSON.parse(raw)):defaultState()}catch{return defaultState()}}
export function saveState(state){state.updated_at=new Date().toISOString();if(typeof localStorage!=='undefined')localStorage.setItem(KEY,JSON.stringify(state));return state}
export function resetState(){if(typeof localStorage!=='undefined')localStorage.removeItem(KEY);return defaultState()}
function migrate(s){const d=defaultState();return {...d,...s,schema_version:2,events:Array.isArray(s.events)?s.events:[],reward_ledger:Array.isArray(s.reward_ledger)?s.reward_ledger:[],sync_outbox:Array.isArray(s.sync_outbox)?s.sync_outbox:[],mastery:s.mastery||{}}}
export function exportState(state){return JSON.stringify(state,null,2)}