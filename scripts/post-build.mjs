/**
 * Post-build step: copy the root locale-redirect shim (public/index.html)
 * to the dist browser root so Vercel can serve it at "/" via vercel.json rewrites.
 *
 * Angular's multi-locale build puts each locale bundle in its own subdirectory
 * (es-CL/, en-US/) and copies public/ assets into each locale dir, so the
 * browser/ root ends up with no index.html.
 */
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC  = join('public', 'index.html');
const DEST = join('dist', 'underagegiant-travelbestie-frontend', 'browser', 'index.html');

copyFileSync(SRC, DEST);
console.log(`post-build: copied ${SRC} → ${DEST}`);
