import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeCityFiles, guideTopPhotos } from './build-attraction-data.mjs';

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
