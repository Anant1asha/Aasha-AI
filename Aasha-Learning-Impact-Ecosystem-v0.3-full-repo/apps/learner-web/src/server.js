import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const aashaAiRoot = resolve(root, '..');
const port = Number(process.env.PORT || 4173);

const routeMap = new Map([
  ['/', 'apps/learner-web/index.html'],
  ['/index.html', 'apps/learner-web/index.html'],
  ['/app.js', 'apps/learner-web/src/app.js'],
  ['/chapter-bridge.js', 'apps/learner-web/src/chapter-bridge.js'],
  ['/styles.css', 'apps/learner-web/styles.css'],
  ['/manifest.webmanifest', 'apps/learner-web/manifest.webmanifest'],
  ['/sw.js', 'apps/learner-web/sw.js']
]);

const mime = (p) => p.endsWith('.html') ? 'text/html' : (p.endsWith('.js') || p.endsWith('.mjs')) ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : p.endsWith('.json') ? 'application/json' : (p.endsWith('.yaml') || p.endsWith('.yml')) ? 'text/yaml' : 'application/octet-stream';

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`).pathname;

    if (pathname === '/api/chapters') {
      const catalog = [
        { id: 'math6-fractions-beta', title: 'Fractions — Understanding Parts', grade: 6, subject: 'Mathematics', type: 'standard' },
        { id: 'math7-perimeter-area', title: 'Perimeter and Area — Geometric Measurement', grade: 7, subject: 'Mathematics', type: 'standard' },
        { id: 'math8-rational-numbers', title: 'Rational Numbers — Properties & Operations', grade: 8, subject: 'Mathematics', type: 'bridged' },
        { id: 'math8-algebraic-expressions', title: 'Algebraic Expressions — Operations & Identities', grade: 8, subject: 'Mathematics', type: 'bridged' }
      ];
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-cache' });
      res.end(JSON.stringify(catalog));
      return;
    }

    let file;
    if (routeMap.has(pathname)) {
      file = join(root, routeMap.get(pathname));
    } else if (pathname.startsWith('/chapters/') || pathname.startsWith('/standalone_chapters/')) {
      const clean = pathname.replace(/^\/+/, '');
      const aiPath = join(aashaAiRoot, clean);
      file = existsSync(aiPath) ? aiPath : join(root, clean);
    } else {
      const clean = pathname.replace(/^\/+/, '');
      file = join(root, clean);
    }

    const data = await readFile(file);
    res.writeHead(200, { 'content-type': mime(file), 'cache-control': 'no-cache' });
    res.end(data);
  } catch {
    if (!res.headersSent) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
    }
  }
});

server.listen(port, () => console.log(`Learner app: http://localhost:${port}`));

