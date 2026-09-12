import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dropSection, extractTable, inlineToHtml } from './markdown.ts';

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

test('dropSection removes the section and stops at the next heading', () => {
  const stripped = dropSection(doc, 'Coming from Zapier');
  assert.doesNotMatch(stripped, /Zap step/);
  assert.match(stripped, /## Next section/);
  assert.match(stripped, /^# Title/);
});

test('dropSection removes a trailing section without leaving blank lines', () => {
  assert.equal(dropSection('# Title\n\nBody.\n\n## TODO\n\n- note\n', 'TODO'), '# Title\n\nBody.\n');
});

test('dropSection leaves a document that has no such section alone', () => {
  assert.equal(dropSection(doc, 'TODO'), doc);
});
