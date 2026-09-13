import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const baseDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const targets = [join(baseDir, 'src', 'app.js')];

for (const sub of ['core', 'content']) {
  const dir = join(baseDir, 'src', sub);
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.js')) {
        targets.push(join(dir, f));
      }
    }
  }
}

let hasError = false;
for (const file of targets) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  } catch {
    hasError = true;
    console.error(`Syntax check failed for: ${file}`);
  }
}

if (hasError) {
  process.exit(1);
}

console.log(`Syntax check passed for ${targets.length} files.`);
