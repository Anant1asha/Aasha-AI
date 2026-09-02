export const GAME_MODES=Object.freeze(['boss-battle','speed-run','match-arena','practice']);
export function validateGameMode(mode){if(!GAME_MODES.includes(mode))throw new Error(`unsupported game mode: ${mode}`);return mode;}
