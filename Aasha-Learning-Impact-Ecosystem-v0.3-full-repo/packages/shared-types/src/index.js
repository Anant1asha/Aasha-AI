export const PHASES = Object.freeze(['0','1','2','3','4','5','6','7','8','9','10']);
export const ROLES = Object.freeze(['learner','teacher','admin','verifier','donor_viewer']);
export const STAGES = Object.freeze({ foundation:[1,2], primary:[3,4,5], middle:[6,7,8], secondary:[9,10] });
export function stageForClass(grade){
  const n=Number(grade); if(!Number.isInteger(n)||n<1||n>10) throw new Error('grade must be 1-10');
  if(n<=2)return 'foundation'; if(n<=5)return 'primary'; if(n<=8)return 'middle'; return 'secondary';
}
export function id(){ return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
