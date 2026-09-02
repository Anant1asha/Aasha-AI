export function renderVisual(target, spec){
  if(!target) throw new Error('target required');
  target.replaceChildren(); const el=document.createElement('div'); el.className=`aasha-visual aasha-visual-${spec.type??'card'}`; el.setAttribute('role','img'); el.setAttribute('aria-label',spec.alt??spec.title??'Learning visual');
  el.innerHTML=`<strong>${escapeHtml(spec.title??'')}</strong><div>${escapeHtml(spec.text??'')}</div>`; target.appendChild(el); return el;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
