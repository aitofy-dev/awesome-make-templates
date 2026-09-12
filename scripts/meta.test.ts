import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appName, joinWords, parseMeta } from './meta.ts';

const valid = {
  slug: 'demo',
  title: 'Demo',
  h1: 'Do the demo thing',
  query: 'make.com demo',
  apps: ['google-sheets'],
  connections: 1,
  opsPerRun: 2,
  aiCreditsPerRun: null,
  opsNote: 'Two modules.',
  shareUrl: null,
  screenshot: 'canvas.png',
  faq: [{ q: 'Why?', a: 'Because.' }],
  related: [],
  department: 'Operations',
  status: 'draft',
};

test('parseMeta accepts a complete record', () => {
  assert.equal(parseMeta(valid, 'meta.json', 'demo').slug, 'demo');
});

test('parseMeta rejects a slug that does not match its folder', () => {
  assert.throws(() => parseMeta(valid, 'meta.json', 'other'), /folder is "other"/);
});

test('parseMeta rejects an unknown status', () => {
  assert.throws(() => parseMeta({ ...valid, status: 'live' }, 'meta.json', 'demo'), /"status" must be one of/);
});

test('parseMeta rejects a non-numeric opsPerRun', () => {
  assert.throws(() => parseMeta({ ...valid, opsPerRun: 'four' }, 'meta.json', 'demo'), /"opsPerRun" must be a number/);
});

test('appName falls back to a title-cased slug', () => {
  assert.equal(appName('google-sheets'), 'Google Sheets');
  assert.equal(appName('some-new-app'), 'Some New App');
});

test('joinWords reads as a sentence', () => {
  assert.equal(joinWords(['A', 'B', 'C']), 'A, B and C');
});
