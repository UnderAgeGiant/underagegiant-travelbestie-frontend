/**
 * Local Vercel-preview simulator.
 *
 * Mimics the rewrites in vercel.json:
 *   /          → index.html        (root locale-redirect shim)
 *   /es-CL/**  → es-CL/index.html  (SPA fallback)
 *   /en-US/**  → en-US/index.html  (SPA fallback)
 *   anything else that is a real file is served directly.
 *
 * Usage:
 *   1. Build both locales:
 *        $env:BACKEND_USE_MOCKS="true"; npm run build:vercel   # PowerShell (no real backend needed)
 *        BACKEND_USE_MOCKS=true npm run build:vercel           # bash/Mac
 *      Then restore the placeholder file:
 *        git restore src/environments/environment.production.ts
 *   2. node scripts/serve-preview.mjs
 *   3. Open http://localhost:4300
 */

import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = 'dist/underagegiant-travelbestie-frontend/browser';
const PORT = 4300;

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.mjs':   'application/javascript',
  '.css':   'text/css',
  '.json':  'application/json',
  '.webp':  'image/webp',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.txt':   'text/plain',
  '.xlf':   'application/xml',
};

function isFile(p) {
  try { return statSync(p).isFile(); } catch { return false; }
}

function send(res, filePath, status = 200) {
  const mime = MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(status, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
  res.end(readFileSync(filePath));
}

function spaFallback(res, locale) {
  send(res, join(DIST, locale, 'index.html'));
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const disk = join(DIST, pathname);

  // Real file on disk → serve it directly (hashed JS/CSS bundles, world-map.webp, …)
  if (isFile(disk)) { send(res, disk); return; }

  // Root → locale redirect shim (dist root after post-build; fall back to source)
  if (pathname === '/' || pathname === '') {
    const distShim = join(DIST, 'index.html');
    send(res, isFile(distShim) ? distShim : join('public', 'index.html'));
    return;
  }

  // /es-CL/** → SPA fallback
  if (pathname.startsWith('/es-CL/') || pathname === '/es-CL') { spaFallback(res, 'es-CL'); return; }

  // /en-US/** → SPA fallback
  if (pathname.startsWith('/en-US/') || pathname === '/en-US') { spaFallback(res, 'en-US'); return; }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found\n');
}).listen(PORT, () => {
  console.log('\n  ┌─────────────────────────────────────────────────┐');
  console.log('  │  Local Vercel-preview  →  http://localhost:' + PORT + '  │');
  console.log('  └─────────────────────────────────────────────────┘\n');
  console.log('  Routes (mirrors vercel.json):');
  console.log('    /         → root redirect shim (reads tb_locale cookie/localStorage)');
  console.log('    /es-CL/   → Spanish bundle  (SPA fallback)');
  console.log('    /en-US/   → English bundle  (SPA fallback)');
  console.log('');
  console.log('  Ctrl+C to stop.\n');
});
