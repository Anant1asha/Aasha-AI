import { existsSync, readFileSync } from 'node:fs';
const required = [
  'docs/architecture/monorepo.md','docs/architecture/authority-chain.md','docs/operations/phase-gates.md',
  'packages/tln-engine/src/index.js','packages/assessment-engine/src/index.js','packages/teas-engine/src/index.js',
  'packages/offline-sync/src/index.js','packages/reward-engine/src/index.js','packages/impact-engine/src/index.js',
  'services/api/src/server.js','apps/learner-web/src/server.js','apps/learner-web/src/app.js'
];
const missing = required.filter(p=>!existsSync(p));
if (missing.length) { console.error('Missing:', missing.join('\n')); process.exit(1); }
const pkg=JSON.parse(readFileSync('package.json','utf8'));
if (!pkg.workspaces?.length) throw new Error('Workspaces missing');
console.log(`Structure OK (${required.length} critical files)`);
