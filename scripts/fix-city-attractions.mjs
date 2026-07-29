/**
 * fix-city-attractions.mjs — fixes one city in attractions-curated.ts:
 * de-duplicates repeated images, then appends newly discovered attractions
 * (with sourced images) until the 15-attraction floor is met or this run's
 * cap is reached. Mutates the file in place; never reorders or removes
 * existing entries (stable-ID rule — see src/app/data/attractions.data.ts).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findUniqueImage } from './image-search.mjs';
import { discoverAttractionsForCity } from './discover-attractions.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CURATED = join(__dirname, '..', 'src/app/data/attractions-curated.ts');
const GOAL_MIN_ATTRACTIONS = 15;
const MAX_NEW_PER_RUN = 12;

const MINUTES_BY_TYPE = {
  Museo: 90, Parque: 120, Naturaleza: 120, Volcán: 120, Mirador: 45,
  Histórico: 60, Iglesia: 45, Cultural: 60, Mercado: 90, Atracción: 120, default: 60,
};

function esc(s) { return (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }

/** Returns { startIdx, endIdx, entries: [{id, name, imageUrl: {line, url}|null}] } or null. */
function locateCityBlock(lines, cityId) {
  const openRe = new RegExp(`^  ${cityId}: \\[$`);
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) if (openRe.test(lines[i])) { startIdx = i; break; }
  if (startIdx === -1) return null;

  let endIdx = -1;
  const entries = [];
  let entry = null;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (/^  \],?$/.test(raw)) { endIdx = i; break; }
    if (/^    \{$/.test(raw)) entry = { id: null, name: null, imageUrl: null };
    if (entry) {
      const idm = raw.match(/id:\s*"([^"]+)"/);
      const namem = raw.match(/name:\s*"([^"]*)"/);
      const imm = raw.match(/imageUrl:\s*"([^"]+)"/);
      if (idm) entry.id = idm[1];
      if (namem && !entry.name) entry.name = namem[1];
      if (imm) entry.imageUrl = { line: i, url: imm[1] };
      if (/^    \},$/.test(raw)) { entries.push(entry); entry = null; }
    }
  }
  if (endIdx === -1) return null;
  return { startIdx, endIdx, entries };
}

function nextIndexFor(entries, cityId) {
  let max = -1;
  const re = new RegExp(`^${cityId}_(\\d+)$`);
  for (const e of entries) {
    const m = e.id?.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max + 1;
}

function buildEntryBlock(id, candidate) {
  const mins = MINUTES_BY_TYPE[candidate.type] ?? MINUTES_BY_TYPE.default;
  const web = candidate.website ? `\n      website: "${esc(candidate.website)}",` : '';
  return `    {
      id: "${id}",
      active: true,
      name: "${esc(candidate.name)}",
      category: '${candidate.category}', type: "${esc(candidate.type)}",
      icon: "${candidate.icon}",
      bg: "${candidate.bg}",
      rating: 4.5,
      estimatedMinutes: ${mins},
      imageUrl: "${esc(candidate.imageUrl)}",${web}
    },`;
}

/**
 * Fixes one city. `city` is { id, name, country }. Returns a summary and
 * mutates attractions-curated.ts on disk. Resilient to a failed discovery
 * call (e.g. a transient Overpass 5xx) — any duplicate-image fixes already
 * made are still written to disk even if the append step throws.
 */
export async function fixCityAttractions(city, { radiusKm = 10 } = {}) {
  const raw = readFileSync(CURATED, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let lines = raw.replace(/\r\n/g, '\n').split('\n');

  let block = locateCityBlock(lines, city.id);
  const summary = { city: city.id, imagesFixed: 0, attractionsAdded: 0, stillMissing: 0 };

  if (!block) {
    // No curated block yet — create an empty shell right before the
    // closing `};` so the append step below can populate it.
    const closeIdx = lines.lastIndexOf('};');
    lines.splice(closeIdx, 0, `  ${city.id}: [`, `  ],`);
    block = locateCityBlock(lines, city.id);
  }

  // ── Step 1: fix duplicate images ────────────────────────────────────────
  const usedImages = new Set(block.entries.map(e => e.imageUrl?.url).filter(Boolean));
  const byImage = new Map();
  for (const e of block.entries) {
    if (!e.imageUrl) continue;
    if (!byImage.has(e.imageUrl.url)) byImage.set(e.imageUrl.url, []);
    byImage.get(e.imageUrl.url).push(e);
  }
  for (const [url, dupes] of byImage) {
    if (dupes.length < 2) continue;
    const wikiIdx = dupes.findIndex(d => d.imageUrl.url.includes('wikimedia.org'));
    const keepIdx = wikiIdx !== -1 ? wikiIdx : 0;
    const toFix = dupes.filter((_, i) => i !== keepIdx);
    for (const dupe of toFix) {
      const newUrl = await findUniqueImage(dupe.name, city.name, city.country, usedImages);
      if (newUrl) {
        lines[dupe.imageUrl.line] = lines[dupe.imageUrl.line].replace(url, newUrl);
        usedImages.add(newUrl);
        summary.imagesFixed++;
      } else {
        summary.stillMissing++;
      }
    }
  }

  // Replacing imageUrl values in place never changes line count, so
  // `block.entries` (names, ids, counts) is still valid for step 2.
  const currentCount = block.entries.length;
  const existingNames = block.entries.map(e => e.name).filter(Boolean);

  // ── Step 2: discover + append new attractions ──────────────────────────
  // Wrapped so a transient discovery failure (e.g. Overpass 5xx) still
  // leaves this run's duplicate-image fixes written to disk below.
  const needed = Math.max(0, GOAL_MIN_ATTRACTIONS - currentCount);
  if (needed > 0) {
    try {
      const toAdd = Math.min(needed, MAX_NEW_PER_RUN);
      const candidates = await discoverAttractionsForCity(city, existingNames, { radiusKm, limit: toAdd });

      let nextIdx = nextIndexFor(block.entries, city.id);
      const newBlockLines = [];
      for (const candidate of candidates) {
        const imageUrl = await findUniqueImage(candidate.name, city.name, city.country, usedImages);
        if (!imageUrl) { summary.stillMissing++; continue; }
        usedImages.add(imageUrl);
        const id = `${city.id}_${nextIdx++}`;
        newBlockLines.push(buildEntryBlock(id, { ...candidate, imageUrl }));
        summary.attractionsAdded++;
      }
      if (newBlockLines.length > 0) {
        // No lines were added/removed above (only in-place replaces), so
        // this block's endIdx is still valid — splice before it.
        const freshBlock = locateCityBlock(lines, city.id);
        lines.splice(freshBlock.endIdx, 0, ...newBlockLines);
      }
    } catch (e) {
      summary.discoveryError = e.message;
    }
  }

  writeFileSync(CURATED, lines.join(eol));
  return summary;
}
