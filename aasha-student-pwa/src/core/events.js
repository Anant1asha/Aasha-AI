import {saveState} from './storage.js';
function id(prefix='EV'){return `${prefix}-${Date.now()}-${crypto.randomUUID?.().slice(0,8)||Math.random().toString(36).slice(2,10)}`}
export function recordEvent(state,type,data={}){
  const e={event_id:id(),schema_version:1,event_type:type,learner_ref:state.learner?.local_id||null,timestamp:new Date().toISOString(),session_id:state.session_id||null,payload:data};
  state.events.push(e); state.events=state.events.slice(-1000); state.sync_outbox.push(e.event_id); state.sync_outbox=state.sync_outbox.slice(-1000); saveState(state); return e;
}
export function listEvents(state,type){return type?state.events.filter(e=>e.event_type===type):state.events}
export function eventCount(state,type){return listEvents(state,type).length}
