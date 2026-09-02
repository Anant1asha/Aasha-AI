export const VISUAL_TEMPLATES=Object.freeze(['diagram','manipulative','timeline','map','graph','process','comparison','cause-effect']);
export function validateVisual(spec){if(!VISUAL_TEMPLATES.includes(spec.type))throw new Error(`unsupported visual type: ${spec.type}`);if(!spec.alt)throw new Error('visual alt text required');return spec;}
