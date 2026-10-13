import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const entries = read('local.env.example')
  .split(/\r?\n/)
  .map((l) => /^(#\s*)?([A-Z][A-Z0-9_]*)=(.*)$/.exec(l.trim()))
  .filter(Boolean)
  .map((m) => ({ commented: Boolean(m[1]), key: m[2], value: m[3].trim() }));

test('local.env.example lists every key start-dev.mjs reads', () => {
  const used = new Set([...read('scripts/start-dev.mjs').matchAll(/\benv\.([A-Z][A-Z0-9_]*)/g)].map((m) => m[1]));
  const listed = new Set(entries.map((e) => e.key));
  assert.deepEqual([...used].filter((k) => !listed.has(k)).sort(), []);
});

test('local.env.example has no uncommented blank values', () => {
  assert.deepEqual(entries.filter((e) => !e.commented && e.value === '').map((e) => e.key), []);
});

test('local.env.example carries no value for any secret-named key', () => {
  assert.deepEqual(entries.filter((e) => /SECRET|KEY|TOKEN|PASS/.test(e.key) && e.value !== '').map((e) => e.key), []);
});
