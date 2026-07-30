/**
 * Local preview server mirroring vercel.json's locale routing:
 *   real file on disk       -> served directly
 *   tb_locale=en-US cookie  -> index.en-US.html
 *   no cookie, Accept-Language starts with "en" -> index.en-US.html
 *   otherwise                -> index.html (es-CL)
 *
 * Vercel's `has`/`missing` conditional rewrites do not work under `vercel
 * dev` (only on real deployments), so this script is the only way to
 * exercise the routing logic locally before pushing.
 *
 * Usage:
 *   BACKEND_USE_MOCKS=true npm run build:vercel
 *   git restore src/environments/environment.production.ts
 *   node scripts/serve-preview.mjs                          # -> http://localhost:4300
 */
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST = 'dist/underagegiant-travelbestie-frontend/browser';
const PORT = 4300;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.gif': 'image/gif',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.txt': 'text/plain',
};

function isFile(p) { try { return statSync(p).isFile(); } catch { return false; } }

function readCookie(header, name) {
  if (!header) return null;
  const hit = header.split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
}

function send(res, filePath) {
  res.writeHead(200, {
    'Content-Type': MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  res.end(readFileSync(filePath));
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const disk = join(DIST, pathname);

  if (pathname !== '/' && isFile(disk)) { send(res, disk); return; }         // real file (hashed bundles, images…)

  const cookieLocale   = readCookie(req.headers['cookie'], 'tb_locale');
  const prefersEnglish = /^en/i.test(req.headers['accept-language'] ?? '');
  const useEnglish     = cookieLocale === 'en-US' || (!cookieLocale && prefersEnglish);

  send(res, join(DIST, useEnglish ? 'index.en-US.html' : 'index.html'));      // SPA fallback, locale-routed
}).listen(PORT, () => console.log(`serve-preview: http://localhost:${PORT} (mirrors vercel.json locale routing)`));
