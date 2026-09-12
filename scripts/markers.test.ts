import assert from 'node:assert/strict';
import { test } from 'node:test';
import { llmsFullTxt, readmeFaq, replaceMarked } from './markers.ts';
import type { Template } from './meta.ts';

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

function template(slug: string, h1: string, faq: readonly { q: string; a: string }[]): Template {
  return {
    meta: {
      slug,
      title: slug,
      h1,
      query: `make.com ${slug}`,
      apps: ['google-sheets'],
      connections: 1,
      opsPerRun: 2,
      aiCreditsPerRun: null,
      opsNote: 'Two modules.',
      shareUrl: null,
      screenshot: null,
      faq,
      related: [],
      department: 'Operations',
      status: 'published',
    },
    dir: `templates/${slug}`,
    blueprintPath: `templates/${slug}/blueprint.json`,
    screenshotPath: null,
  };
}

const shared = { q: 'Does this work on the free plan?', a: 'Yes, on the first template.' };
const templates = [
  template('alpha', 'Alpha template', [shared, { q: 'Can I skip a step?', a: 'Yes.' }]),
  template('beta', 'Beta template', [
    { q: '  does this WORK on the free plan?  ', a: 'Yes, on the second template.' },
    { q: 'How many rows fit?', a: 'Twenty-five.' },
  ]),
];

test('readmeFaq asks each question once and keeps the first answer', () => {
  const faq = readmeFaq(templates);
  assert.equal(faq.match(/^### /gm)?.length, 3);
  assert.equal(faq.match(/free plan/g)?.length, 1);
  assert.match(faq, /Yes, on the first template\./);
  assert.doesNotMatch(faq, /second template/);
});

test('readmeFaq links the template the answer came from', () => {
  assert.match(readmeFaq(templates), /Twenty-five\. \(\[Beta template\]\(\.\/templates\/beta\/\)\)/);
});

test('readmeFaq survives a repo with no questions', () => {
  assert.equal(readmeFaq([template('gamma', 'Gamma template', [])]), '_No questions yet._');
});

test('readmeFaq stays stable inside its marker', () => {
  const page = 'x\n<!-- gen:faq -->\n<!-- /gen:faq -->\ny\n';
  const once = replaceMarked(page, 'faq', readmeFaq(templates));
  assert.equal(replaceMarked(once, 'faq', readmeFaq(templates)), once);
  assert.match(once, /<!-- gen:faq -->\n### Does this work on the free plan\?/);
});

test('llmsFullTxt labels every document with its path', () => {
  const full = llmsFullTxt([
    { path: 'README.md', body: '# Root\n\nBody.\n' },
    { path: 'templates/alpha/README.md', body: '# Alpha\n\nBody.\n' },
  ]);
  assert.match(full, /Documents: 2/);
  assert.deepEqual(full.match(/^FILE: .+$/gm), ['FILE: README.md', 'FILE: templates/alpha/README.md']);
  assert.match(full, /# Alpha/);
});
