import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeCityFiles, guideTopPhotos, citiesWithAttractions, writeCityIdsModule } from './build-attraction-data.mjs';
import { pathToFileURL } from 'node:url';

test('citiesWithAttractions keeps cities with at least one active attraction, sorted', () => {
  const curated = { rome: [{ id: 'rome_0' }], paris: [{ id: 'paris_0', active: false }, { id: 'paris_1', active: true }], oslo: [{ id: 'oslo_0', active: false }], lima: [] };
  assert.deepEqual(citiesWithAttractions(curated), ['paris', 'rome']);
});

test('writeCityIdsModule writes an importable set file', async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'cwa-')), 'cities-with-attractions.data.ts');
  writeCityIdsModule(['paris', 'rome'], file);
  const mod = await import(pathToFileURL(file).href);
  assert.ok(mod.CITY_IDS_WITH_ATTRACTIONS.has('paris'));
  assert.equal(mod.CITY_IDS_WITH_ATTRACTIONS.size, 2);
});

test('writeCityFiles writes one file per city and clears stale files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'att-'));
  writeFileSync(join(dir, 'stale.json'), '[]');
  const n = writeCityFiles({ paris: [{ id: 'paris_0', active: false }], rome: [] }, dir);
  assert.equal(n, 2);
  assert.deepEqual(readdirSync(dir).sort(), ['paris.json', 'rome.json']);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, 'paris.json'), 'utf8')), [{ id: 'paris_0', active: false }]);
});

test('writeCityFiles rejects an unsafe city id', () => {
  assert.throws(() => writeCityFiles({ '../x': [] }, mkdtempSync(join(tmpdir(), 'att-'))));
});

test('guideTopPhotos skips http images and omits cities with none', () => {
  const sight = (id, rating, imageUrl) => ({ id, active: true, category: 'poi', rating, imageUrl, description: 'x'.repeat(80) });
  const curated = { a: [sight('a_0', 4.9, 'http://insecure/x.jpg'), sight('a_1', 4.5, 'https://ok/y.jpg')], b: [sight('b_0', 4.9, undefined)] };
  assert.deepEqual(guideTopPhotos(curated, [{ cityId: 'a' }, { cityId: 'b' }]), { a: 'https://ok/y.jpg' });
});
