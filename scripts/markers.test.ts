import assert from 'node:assert/strict';
import { test } from 'node:test';
import { replaceMarked } from './markers.ts';

const source = 'before\n<!-- gen:x -->\nold\n<!-- /gen:x -->\nafter\n';

test('replaceMarked swaps only the marked body', () => {
  assert.equal(replaceMarked(source, 'x', 'new'), 'before\n<!-- gen:x -->\nnew\n<!-- /gen:x -->\nafter\n');
});

test('replaceMarked is idempotent', () => {
  const once = replaceMarked(source, 'x', 'new');
  assert.equal(replaceMarked(once, 'x', 'new'), once);
});

test('replaceMarked reports a missing marker', () => {
  assert.throws(() => replaceMarked('no markers here', 'x', 'new'), /Missing marker pair/);
});
