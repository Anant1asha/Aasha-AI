import {saveState} from './storage.js';
export function getSyncStatus(state){return {pending:state.sync_outbox.length,lastSync:state.last_sync_at||null,mode:'async_outbox'}}
export function prepareSyncBatch(state,max=100){return state.sync_outbox.slice(0,max).map(id=>state.events.find(e=>e.event_id===id)).filter(Boolean)}
export function acknowledgeSync(state,eventIds){const done=new Set(eventIds);state.sync_outbox=state.sync_outbox.filter(id=>!done.has(id));state.last_sync_at=new Date().toISOString();saveState(state)}
export function buildSyncRequest(state){return {schema_version:1,device_session:state.session_id||null,events:prepareSyncBatch(state)}}