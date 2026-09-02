export class SimulationRegistry { constructor(entries=[]){this.entries=new Map(entries.map(e=>[e.id,e]));}
  get(id){const e=this.entries.get(id); if(!e) throw new Error(`simulation not registered: ${id}`); if(e.reviewState!=='approved') throw new Error(`simulation not approved: ${id}`); return e;}
  manifest(){return [...this.entries.values()].map(({id,title,type,license,version})=>({id,title,type,license,version}));}
}
export function simulationContract(entry){ for(const k of ['id','title','license','version','reviewState']) if(!entry[k]) throw new Error(`simulation.${k} required`); return entry; }
