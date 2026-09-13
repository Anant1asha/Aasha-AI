export class SimulationRegistry { constructor(entries=[]){this.entries=new Map(entries.map(e=>[e.id,e]));}
  get(id){const e=this.entries.get(id); if(!e) throw new Error(`simulation not registered: ${id}`); if(e.reviewState!=='approved') throw new Error(`simulation not approved: ${id}`); return e;}
  manifest(){return [...this.entries.values()].map(({id,title,type,license,version})=>({id,title,type,license,version}));}
}
export function simulationContract(entry){ for(const k of ['id','title','license','version','reviewState']) if(!entry[k]) throw new Error(`simulation.${k} required`); return entry; }

export class AashaExperienceContract {
  mount(container, config) { throw new Error('mount() must be implemented'); }
  getState() { throw new Error('getState() must be implemented'); }
  reset() { throw new Error('reset() must be implemented'); }
  destroy() { throw new Error('destroy() must be implemented'); }
  emitTelemetry(eventType, payload) {
    const event = typeof CustomEvent !== 'undefined'
      ? new CustomEvent('aasha:telemetry', {
          bubbles: true,
          detail: {
            timestamp: Date.now(),
            foundationId: this.foundationId || 'AASHA_CUSTOM',
            experienceId: this.experienceId || 'generic',
            eventType,
            payload
          }
        })
      : { type: 'aasha:telemetry', detail: { timestamp: Date.now(), foundationId: this.foundationId, experienceId: this.experienceId, eventType, payload } };
    if (this.container && typeof this.container.dispatchEvent === 'function') {
      this.container.dispatchEvent(event);
    }
    return event;
  }
}

export class AashaExperienceAdapter extends AashaExperienceContract {
  constructor(metadata = {}) {
    super();
    this.foundationId = metadata.foundationId || 'F00';
    this.foundationName = metadata.foundationName || 'Unknown';
    this.sourceRepo = metadata.sourceRepo || '';
    this.experienceId = metadata.experienceId || 'adapter';
    this.container = null;
    this.config = {};
    this.state = {};
  }
}
