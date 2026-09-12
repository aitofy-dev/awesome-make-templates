import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { affLink } from './links.ts';
import { canonical, esc, table, type PageSpec } from './html.ts';
import { extractTable, inlineToHtml } from './markdown.ts';
import type { Template } from './meta.ts';

const ZAPIER_HEADING = 'Coming from Zapier';

const IMPORT_STEPS = [
  {
    name: 'Download the blueprint',
    text: 'Open the template page and download blueprint.json. It is a plain JSON file — no account, no email, nothing to unzip.',
  },
  {
    name: 'Import it in Make',
    text: 'In Make, go to Scenarios, click Create a new scenario, then click the three dots at the bottom of the editor and choose Import Blueprint. Pick the file you just downloaded.',
  },
  {
    name: 'Reconnect and run once',
    text: 'Open each red module and pick or create its connection, then press Run once and check the output of every module before you turn the schedule on.',
  },
];

function howToJsonLd(): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Import a Make.com blueprint',
    description: 'Turn a blueprint.json file into a working scenario in your own Make account.',
    totalTime: 'PT5M',
    step: IMPORT_STEPS.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${canonical('/import')}#steps`,
    })),
  };
}

export function importPage(): PageSpec {
  const steps = IMPORT_STEPS.map(
    (step) => `<li><strong>${esc(step.name)}</strong> — ${esc(step.text)}</li>`,
  ).join('\n          ');
  const body = `        <h1>Import a Make.com blueprint</h1>
        <p class="lede">A blueprint is a JSON export of a whole scenario: modules, mapping, routes and settings. Importing one rebuilds it in your own account. This page is the whole procedure; every template links back here instead of repeating it.</p>

        <h2 id="steps">Three steps</h2>
        <ol class="steps">
          ${steps}
        </ol>
        <p class="disclosure">You need a Make account to import anything. <a href="${esc(affLink('site'))}">Create one free</a> — referral link, same price for you.</p>

        <h2>Why the modules are red</h2>
        <div class="note"><p><strong>Red means unconnected, not broken.</strong> Credentials never travel inside a blueprint — if they did, sharing one would hand over your accounts. After an import every module that needs an account is red until you open it and pick a connection. This is the single biggest reason people abandon an imported scenario, and it is not a fault.</p></div>

        <h2>When it does not work</h2>
        ${table(
          ['What you see', 'What it means'],
          [
            [
              'Make rejects the file',
              'The JSON was edited or truncated. Download it again rather than copy-pasting from a code view.',
            ],
            [
              'A module shows a field you must pick, not type',
              'That field is resolved from your own account — a spreadsheet, a database, a channel. Connect the module first, then the dropdown fills itself.',
            ],
            [
              'Run once produces nothing',
              'A watch trigger only returns records newer than its last checkpoint. Add a fresh row, response or message and run it again.',
            ],
          ],
        )}

        <h2>Next</h2>
        <p><a href="/">Browse the templates</a> · <a href="/zapier">Coming from Zapier</a></p>`;
  return {
    path: '/import',
    title: 'How to import a Make.com blueprint (JSON) — step by step',
    description:
      'Import a Make.com blueprint in three steps: download the JSON, use Import Blueprint in a new scenario, then reconnect your accounts. Why imported modules are red, and what to do when import fails.',
    noindex: false,
    ogImage: null,
    jsonLd: [howToJsonLd()],
    body,
    script: null,
  };
}

interface ZapierSection {
  readonly template: Template;
  readonly html: string;
}

function zapierSections(templates: readonly Template[]): ZapierSection[] {
  return templates.flatMap((template) => {
    const readme = readFileSync(join(template.dir, 'README.md'), 'utf8');
    const parsed = extractTable(readme, ZAPIER_HEADING);
    if (!parsed) return [];
    const rows = parsed.rows.map((row) => row.map(inlineToHtml));
    return [
      {
        template,
        html: `<h3><a href="/${template.meta.slug}">${esc(template.meta.h1)}</a></h3>
        ${table(parsed.headers.map(esc), rows)}`,
      },
    ];
  });
}

export function zapierPage(templates: readonly Template[]): PageSpec {
  const sections = zapierSections(templates);
  const mapped =
    sections.length > 0
      ? `<h2 id="mapping">Zap steps mapped to Make modules</h2>
        ${sections.map((section) => section.html).join('\n        ')}`
      : `<h2 id="mapping">Zap steps mapped to Make modules</h2>
        <p class="muted">The per-template mapping tables are written alongside each blueprint and appear here once a template ships one.</p>`;
  const body = `        <h1>Coming to Make.com from Zapier</h1>
        <p class="lede">The two tools do the same job with different plumbing, and the unit on your invoice is not the same unit. This page maps the steps of a Zap onto Make modules, and explains why a task and an operation cannot be compared one to one.</p>

        <h2 id="units">A task is not an operation</h2>
        <p>Zapier bills a <strong>task</strong> for each action that runs. The trigger is free, and a Zap that fires for ten records runs ten times, so ten records cost ten tasks.</p>
        <p>Make bills an <strong>operation</strong> for each module, for each bundle that passes through it — the trigger included. A trigger that picks up ten records in one check hands all ten to the next module, so a three-module scenario can cost more operations than the same job costs tasks, while producing far fewer messages, rows or emails at the other end.</p>
        <p>Make has a second meter, <strong>AI credits</strong>, spent only by AI modules. A scenario without AI modules spends none. Operations and credits are never interchangeable, and neither maps onto a Zapier task.</p>
        <p>So compare totals, not units: take what your plan charges for a thousand tasks, take what a Make plan charges for a thousand operations, and put the two monthly bills side by side. Every template on this site prints its own operations per run so you can do that arithmetic before you migrate.</p>

        <h2 id="shape">What changes in practice</h2>
        ${table(
          ['In Zapier', 'In Make'],
          [
            ['One Zap, one linear path', 'One scenario, with routers when a path needs to fork'],
            ['A Zap re-runs per record', 'A scenario handles all new records in one cycle, as a stream of bundles'],
            ['Digest by Zapier collects entries on a schedule', 'An aggregator folds the bundles of one cycle into a single bundle'],
            ['Formatter steps', 'Built-in Tools modules and inline functions in any field'],
            ['Paths and Filters', 'Routers and filters on the link between two modules'],
          ],
        )}

        ${mapped}

        <h2>Next</h2>
        <p><a href="/">Browse the templates</a> · <a href="/import">How to import a blueprint</a></p>
        <p class="disclosure">Need a Make account to try one? <a href="${esc(affLink('site'))}">Create one free</a> — referral link, same price for you.</p>`;
  return {
    path: '/zapier',
    title: 'Zapier to Make.com: Zap steps and tasks vs operations',
    description:
      'Map the steps of a Zap onto Make.com modules, and understand why a Zapier task and a Make operation are different units. With importable blueprints for the common migrations.',
    noindex: false,
    ogImage: null,
    jsonLd: [],
    body,
    script: null,
  };
}

export function notFoundPage(): PageSpec {
  return {
    path: '/404',
    title: 'Page not found — Make.com blueprints',
    description: 'That page does not exist on make-templates.aitofy.dev.',
    noindex: true,
    ogImage: null,
    jsonLd: [],
    body: `        <h1>That page does not exist</h1>
        <p class="lede">The template you were after may have been renamed, or it may not be published yet.</p>
        <p><a href="/">Browse every template</a> · <a href="/import">How to import a blueprint</a></p>`,
    script: null,
  };
}

export function hasZapierSection(templates: readonly Template[]): boolean {
  return zapierSections(templates).length > 0;
}
