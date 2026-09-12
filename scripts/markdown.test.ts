import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractTable, inlineToHtml } from './markdown.ts';

const doc = `# Title

## Coming from Zapier

Intro line.

| Zap step | Make module |
|---|---|
| Trigger | Watch New Rows |
| Action | Send a Message |

## Next section

| other | table |
|---|---|
`;

test('extractTable reads the first table of the named section', () => {
  const parsed = extractTable(doc, 'Coming from Zapier');
  assert.deepEqual(parsed?.headers, ['Zap step', 'Make module']);
  assert.deepEqual(parsed?.rows, [
    ['Trigger', 'Watch New Rows'],
    ['Action', 'Send a Message'],
  ]);
});

test('extractTable returns null when the section is absent', () => {
  assert.equal(extractTable(doc, 'Missing heading'), null);
});

test('inlineToHtml escapes before it renders bold and code', () => {
  assert.equal(inlineToHtml('**a** `<b>`'), '<strong>a</strong> <code>&lt;b&gt;</code>');
});
