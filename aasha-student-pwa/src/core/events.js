import {saveState} from './storage.js';

let _seq = 0;
function id(prefix = 'EV') {
  return `${prefix}-${Date.now()}-${++_seq}`;
}

export function recordEvent(state, type, data = {}) {
  const ts = new Date().toISOString();
  const e = {
    event_id: id(),
    schema_version: 1,
    event_type: type,
    learner_ref: state.learner?.local_id || null,
    timestamp: ts,
    session_id: state.session_id || null,
    payload: data
  };

  state.events.push(e);
  if (state.events.length > 1000) {
    state.events.shift();
  }

  state.sync_outbox.push(e.event_id);
  if (state.sync_outbox.length > 1000) {
    state.sync_outbox.shift();
  }

  saveState(state);
  return e;
}

export function listEvents(state, type) {
  return type ? state.events.filter(e => e.event_type === type) : state.events;
}

export function eventCount(state, type) {
  return listEvents(state, type).length;
}
