/**
 * Post-build step: Angular's dual-locale build writes self-contained
 * es-CL/ and en-US/ folders, each with its own index.html and a <base
 * href> pointing at its own folder.
 *
 * IMPORTANT #1 — filename collisions across locales. This build's filename
 * hashing is computed on the PRE-TRANSLATION bundle: translated
 * (`$localize`) content is inlined into each locale's copy of a chunk as a
 * later post-processing pass that does NOT rehash the filename. That means
 * es-CL/chunk-X.js and en-US/chunk-X.js frequently share the exact same
 * filename while holding DIFFERENT (translated) bytes — confirmed by
 * diffing a real dual-locale build here, where most chunks hashed
 * identically by name but differed byte-for-byte between locales. Merging
 * both folders into one flat directory silently lets the second-copied
 * locale's files overwrite the first locale's same-named-but-different
 * files, so both index.html and index.en-US.html end up pointing at
 * whichever locale's assets were copied last. Do not reintroduce a
 * flatten/merge here — es-CL/ and en-US/ must stay as separate folders.
 *
 * IMPORTANT #2 — <base href> rewrites the visible URL, which this feature
 * forbids. The naive fix for #1 is to publish each locale's index.html
 * as-is (base href="/es-CL/" or "/en-US/") so relative asset tags resolve
 * into the right folder. But Angular's Router (PathLocationStrategy) reads
 * <base href> from the DOM on bootstrap and normalizes the browser's
 * visible URL to match it — confirmed by loading the published es-CL
 * index.html at "/" and observing window.location.href become
 * "http://host/es-CL/", exactly the URL-visible behavior this whole
 * feature exists to avoid. <base href> is NOT just asset-resolution
 * plumbing here; the Router treats it as the app's root path and rewrites
 * history to match.
 *
 * The fix: keep <base href="/"> in BOTH published index documents (so the
 * Router never touches the URL), and instead rewrite every relative asset
 * reference (script src, link href, favicon) to be explicitly prefixed
 * with its own locale folder — es-CL/main-X.js, en-US/main-X.js, etc. The
 * browser then resolves those explicit paths against the real origin
 * root regardless of <base href>, so assets keep loading from the correct
 * locale folder while the Router only ever sees base href="/".
 *
 * IMPORTANT #3 — public/ assets referenced at RUNTIME (not from
 * index.html) also need a root copy. Fix #2 only rewrites references that
 * live inside the two index.html documents (the initial script/link/
 * favicon tags). But plenty of components reference public/ assets
 * directly in their templates — e.g. <img src="world-map.webp"> in
 * ProfileComponent, <img src="/small-black-dog.png"> in
 * AiPlanningComponent/CitySuggestCloudComponent, team photos in
 * AboutComponent — compiled into the JS bundles, not index.html, so
 * fix #2's rewrite never touches them. With <base href="/">, those
 * template-level references resolve against the dist ROOT, but the
 * actual files only exist inside es-CL/ and en-US/ (Angular gives each
 * locale its own full self-contained copy) — so every such image 404s.
 * On this local preview server (and identically on real Vercel, since
 * its rewrite gives real files precedence but there IS no real file at
 * that root path) the 404 gets masked by the SPA-fallback rewrite
 * serving index.html's *HTML* bytes in place of the image, which the
 * <img> tag then fails to decode — rendering as a blank/broken image,
 * confirmed live via chrome-devtools network inspection (200 status,
 * wrong content-type, broken render).
 *
 * Fix: copy the actual public/ SOURCE folder straight to the dist root.
 * Its contents are by definition locale-independent (untranslated static
 * assets), so a single root copy is correct and unambiguous — no
 * filename-collision risk like the Angular-emitted hashed bundles have,
 * since these names never change between locale builds.
 */
import { readFileSync, writeFileSync, cpSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join('dist', 'underagegiant-travelbestie-frontend', 'browser');
const PUBLIC = 'public';

// Matches href="..." / src="..." values that are relative (no scheme, no
// leading slash) — i.e. exactly the asset references Angular emits
// relative to <base href>. Absolute/external URLs (https://..., data:...)
// are left untouched.
const RELATIVE_ASSET_REF = /((?:href|src)=")(?!https?:|\/\/|\/|data:)([^"]+)(")/g;

function publishIndex(locale, indexTargetName) {
  const srcPath = join(DIST, locale, 'index.html');
  let html = readFileSync(srcPath, 'utf8')
    .replace(`<base href="/${locale}/">`, '<base href="/">')
    .replace(RELATIVE_ASSET_REF, (_match, prefix, url, suffix) => `${prefix}${locale}/${url}${suffix}`);
  writeFileSync(join(DIST, indexTargetName), html, 'utf8');
  console.log(`post-build: published ${locale}/index.html -> ${indexTargetName} (base href="/", assets explicitly prefixed with ${locale}/)`);
}

publishIndex('es-CL', 'index.html');
publishIndex('en-US', 'index.en-US.html');

cpSync(PUBLIC, DIST, { recursive: true });
console.log(`post-build: copied ${PUBLIC}/ -> dist root (locale-independent assets, fixes runtime-referenced <img> paths)`);
