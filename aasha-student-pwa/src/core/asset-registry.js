export const ASSETS={
  'fraction-grid-demo':{id:'fraction-grid-demo',type:'visual_template',source:'built-in',license:'AA-OWN-BUILTIN',offline:true,version:'1.0.0'},
  'simulation-adapter-demo':{id:'simulation-adapter-demo',type:'simulation_adapter',source:'placeholder-for-approved-open-source',license:'REQUIRES_ASSET_RECORD',offline:true,version:'0.1.0'}
};
export function resolveAsset(id){return ASSETS[id]||null}
export function registerAsset(registry,asset){if(!asset.id||!asset.license)return false;registry[asset.id]=asset;return true}
