import { validateChapter } from '../../content-schema/src/index.js';
export class TLNEngine {
  constructor(chapter){ this.chapter=validateChapter(chapter); this.nodeMap=new Map(this.chapter.nodes.map(n=>[n.id,n])); }
  orderedNodes(){
    const out=[], seen=new Set();
    const visit=(id)=>{ if(seen.has(id))return; const n=this.nodeMap.get(id); if(!n)throw new Error(`unknown node ${id}`); for(const d of n.dependencies??[]) visit(d); seen.add(id); out.push(n); };
    for(const n of this.chapter.nodes) visit(n.id); return out;
  }
  node(id){ return this.nodeMap.get(id); }
  nextUnlocked(completed){ const c=new Set(completed); return this.orderedNodes().filter(n=>!c.has(n.id)&&(n.dependencies??[]).every(d=>c.has(d))); }
}
