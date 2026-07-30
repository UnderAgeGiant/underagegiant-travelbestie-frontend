/**
 * Post-build step: Angular's dual-locale build writes self-contained
 * es-CL/ and en-US/ folders, each with its own index.html and a <base
 * href> pointing at its own folder.
 *
 * IMPORTANT — this build's filename hashing is computed on the
 * PRE-TRANSLATION bundle: translated (`$localize`) content is inlined into
 * each locale's copy of a chunk as a later post-processing pass that does
 * NOT rehash the filename. That means es-CL/chunk-X.js and en-US/chunk-X.js
 * frequently share the exact same filename while holding DIFFERENT
 * (translated) bytes — confirmed by diffing a real dual-locale build here,
 * where most chunks hashed identically by name but differed byte-for-byte
 * between locales. Merging both folders into one flat directory (as an
 * earlier version of this script did) silently lets the second-copied
 * locale's files overwrite the first locale's same-named-but-different
 * files, so both index.html and index.en-US.html end up pointing at
 * whichever locale's assets were copied last — the "other" locale's
 * switcher silently does nothing. Do not reintroduce a flatten/merge here.
 *
 * The fix: leave es-CL/ and en-US/ exactly as Angular built them (each
 * still fully self-contained, <base href> intact), and just PUBLISH two
 * root-level entry documents — index.html (copy of es-CL/index.html) and
 * index.en-US.html (copy of en-US/index.html) — unmodified. Every asset
 * reference inside those documents is a *relative* path (e.g.
 * `main-X.js`, not `/main-X.js`), so the browser resolves it against
 * <base href="/es-CL/"> or <base href="/en-US/"> regardless of the
 * visible page URL — <base href> is invisible browsing-context plumbing,
 * not the address bar. vercel.json's rewrite serves one of these two root
 * documents for app routes ("/", "/shared/abc", …); the resulting asset
 * requests for /es-CL/main-X.js or /en-US/main-X.js are real files on
 * disk, which Vercel serves directly (filesystem takes precedence over
 * rewrites), so they never get caught by the SPA-fallback rewrite rule.
 */
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join('dist', 'underagegiant-travelbestie-frontend', 'browser');

function publishIndex(locale, indexTargetName) {
  copyFileSync(join(DIST, locale, 'index.html'), join(DIST, indexTargetName));
  console.log(`post-build: published ${locale}/index.html -> ${indexTargetName} (assets stay under ${locale}/, base href untouched)`);
}

publishIndex('es-CL', 'index.html');
publishIndex('en-US', 'index.en-US.html');
