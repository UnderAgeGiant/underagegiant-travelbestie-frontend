/**
 * audit-attraction-images.mjs
 *
 * Parses CURATED_ALL in attractions-curated.ts and reports, per city:
 *   - attraction count
 *   - duplicate-image groups (two+ attractions sharing one imageUrl)
 *   - how many more attractions it needs to reach the 15-attraction floor
 * Ranked by scripts/touristic-cities-priority.json. Writes
 * scripts/attraction-image-audit.json and prints a summary.
 *
 * Run:  node scripts/audit-attraction-images.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CURATED = join(__dirname, '..', 'src/app/data/attractions-curated.ts');
const PRIORITY_FILE = join(__dirname, 'touristic-cities-priority.json');
const OUT_FILE = join(__dirname, 'attraction-image-audit.json');
const GOAL_MIN_ATTRACTIONS = 15;

export function parseCuratedCities(content) {
  const lines = content.split('\n').map(l => l.replace(/\r$/, ''));
  const cities = {};
  let city = null;
  let entry = null;
  for (const raw of lines) {
    const cm = raw.match(/^  ([a-zA-Z0-9_]+): \[$/);
    if (cm) { city = cm[1]; cities[city] = cities[city] || []; continue; }
    if (!city) continue;
    if (/^    \{$/.test(raw)) entry = { id: null, imageUrl: null };
    if (entry) {
      const idm = raw.match(/id:\s*"([^"]+)"/);
      const imm = raw.match(/imageUrl:\s*"([^"]+)"/);
      if (idm) entry.id = idm[1];
      if (imm) entry.imageUrl = imm[1];
      if (/^    \},$/.test(raw)) { cities[city].push(entry); entry = null; }
    }
  }
  return cities;
}

export function auditCity(entries) {
  const count = entries.length;
  const byImage = new Map();
  for (const e of entries) {
    if (!e.imageUrl) continue;
    if (!byImage.has(e.imageUrl)) byImage.set(e.imageUrl, []);
    byImage.get(e.imageUrl).push(e.id);
  }
  const duplicateGroups = [...byImage.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([imageUrl, ids]) => ({ imageUrl, ids }));
  return { count, duplicateGroups, missingCount: Math.max(0, GOAL_MIN_ATTRACTIONS - count) };
}

export function runAudit() {
  const content = readFileSync(CURATED, 'utf8');
  const cities = parseCuratedCities(content);
  const priority = existsSync(PRIORITY_FILE) ? JSON.parse(readFileSync(PRIORITY_FILE, 'utf8')) : [];
  const priorityRank = new Map(priority.map((id, i) => [id, i]));

  const allIds = new Set([...Object.keys(cities), ...priority]);
  const report = [...allIds].map(id => {
    const entries = cities[id] || [];
    const audit = auditCity(entries);
    const needsWork = audit.missingCount > 0 || audit.duplicateGroups.length > 0;
    return {
      city: id,
      ...audit,
      needsWork,
      priorityRank: priorityRank.has(id) ? priorityRank.get(id) : priority.length,
    };
  });
  report.sort((a, b) => a.priorityRank - b.priorityRank);

  const needingWork = report.filter(r => r.needsWork);
  const out = {
    generatedAt: new Date().toISOString(),
    totalCities: report.length,
    citiesNeedingWork: needingWork.length,
    goalMet: needingWork.length === 0,
    nextCity: needingWork[0]?.city ?? null,
    cities: report,
  };
  writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
  return out;
}

function printSummary(out) {
  console.log(`Total cities: ${out.totalCities}`);
  console.log(`Needing work: ${out.citiesNeedingWork}`);
  console.log(`Goal met: ${out.goalMet}`);
  if (out.nextCity) {
    const c = out.cities.find(r => r.city === out.nextCity);
    console.log(`Next city: ${c.city} (has ${c.count}, needs ${c.missingCount} more, ${c.duplicateGroups.length} duplicate group(s))`);
  }
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/audit-attraction-images.mjs');
if (isMain) printSummary(runAudit());
