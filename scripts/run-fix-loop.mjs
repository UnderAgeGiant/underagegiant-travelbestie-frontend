/**
 * run-fix-loop.mjs — the hourly entrypoint. Stateless across invocations
 * except for what's committed to the repo: the audit report, the priority
 * list, and scripts/city-fix-state.json (per-city attempt/radius/stuck
 * tracking). Safe to run repeatedly and forever — once nothing is left to
 * do it writes a flag file and every future run becomes a fast no-op.
 *
 * Run: node scripts/run-fix-loop.mjs [--max-cities N]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAudit } from './audit-attraction-images.mjs';
import { fixCityAttractions } from './fix-city-attractions.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FLAG_FILE = join(__dirname, 'GOAL_MET.flag');
const EXHAUSTED_FILE = join(__dirname, 'AUTOMATION_EXHAUSTED.flag');
const STATE_FILE = join(__dirname, 'city-fix-state.json');
const CITIES_FE = join(__dirname, '..', 'src/app/data/cities.data.ts');

const maxCitiesArgIdx = process.argv.indexOf('--max-cities');
const MAX_CITIES = maxCitiesArgIdx !== -1 ? Number(process.argv[maxCitiesArgIdx + 1]) : 3;
const MAX_ATTEMPTS_PER_CITY = 5;
const BASE_RADIUS_KM = 10;
const RADIUS_GROWTH = 1.5;

function loadCityMeta() {
  const src = readFileSync(CITIES_FE, 'utf8');
  const map = new Map();
  for (const m of src.matchAll(/\{ id: '([^']+)', name: '([^']+)', country: '([^']+)'/g)) {
    map.set(m[1], { id: m[1], name: m[2], country: m[3] });
  }
  return map;
}
function loadState() {
  return existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : {};
}
function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
  if (existsSync(FLAG_FILE)) { console.log('GOAL_MET.flag present — nothing to do.'); return; }
  if (existsSync(EXHAUSTED_FILE)) { console.log('AUTOMATION_EXHAUSTED.flag present — remaining cities need manual review.'); return; }

  const state = loadState();
  let auditReport = runAudit();

  if (auditReport.goalMet) {
    writeFileSync(FLAG_FILE, `Goal met at ${auditReport.generatedAt}\n`);
    console.log('Goal met — wrote GOAL_MET.flag.');
    return;
  }

  const eligible = () => auditReport.cities.filter(c => c.needsWork && !state[c.city]?.stuck);
  if (eligible().length === 0) {
    const stuckIds = auditReport.cities.filter(c => c.needsWork).map(c => c.city);
    writeFileSync(EXHAUSTED_FILE, `No further automated progress possible at ${auditReport.generatedAt}.\nStuck cities:\n${stuckIds.join('\n')}\n`);
    console.log(`No eligible cities left — wrote AUTOMATION_EXHAUSTED.flag listing ${stuckIds.length} stuck cities.`);
    return;
  }

  const cityMeta = loadCityMeta();
  const processed = [];

  for (let i = 0; i < MAX_CITIES; i++) {
    const candidates = eligible();
    if (candidates.length === 0) break;
    const candidate = candidates[0];
    const meta = cityMeta.get(candidate.city);
    if (!meta) {
      console.warn(`No cities.data.ts entry for ${candidate.city} — marking stuck.`);
      state[candidate.city] = { attempts: 1, radiusKm: BASE_RADIUS_KM, stuck: true };
      saveState(state);
      auditReport = runAudit();
      continue;
    }

    const cityState = state[candidate.city] || { attempts: 0, radiusKm: BASE_RADIUS_KM };
    console.log(`\n→ Fixing ${meta.name} (${candidate.count} attractions, ${candidate.duplicateGroups.length} dup groups, radius ${cityState.radiusKm}km)…`);
    const summary = await fixCityAttractions(meta, { radiusKm: cityState.radiusKm });
    console.log(`  ${JSON.stringify(summary)}`);
    processed.push({ city: candidate.city, ...summary });

    cityState.attempts++;
    cityState.radiusKm = Math.round(cityState.radiusKm * RADIUS_GROWTH);
    auditReport = runAudit();
    const postCity = auditReport.cities.find(c => c.city === candidate.city);
    if (postCity && !postCity.needsWork) {
      delete state[candidate.city];
    } else if (cityState.attempts >= MAX_ATTEMPTS_PER_CITY) {
      cityState.stuck = true;
      state[candidate.city] = cityState;
      console.log(`  ${candidate.city} unresolved after ${cityState.attempts} attempts — marking stuck.`);
    } else {
      state[candidate.city] = cityState;
    }
    saveState(state);
  }

  if (auditReport.goalMet) writeFileSync(FLAG_FILE, `Goal met at ${auditReport.generatedAt}\n`);

  console.log('\n=== Run summary ===');
  console.log(JSON.stringify({ processed, remainingCities: auditReport.citiesNeedingWork, goalMet: auditReport.goalMet }, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
