import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.AFF_CODE = 'testcode';
const { affLink } = await import('./links.ts');

test('affLink carries the partner code and the channel', () => {
  const url = new URL(affLink('site'));
  assert.equal(url.origin + url.pathname, 'https://www.make.com/en/register');
  assert.equal(url.searchParams.get('pc'), 'testcode');
  assert.equal(url.searchParams.get('affiliateSource'), 'site');
});

test('affLink tags each channel separately', () => {
  assert.notEqual(affLink('github'), affLink('reddit-make'));
});
