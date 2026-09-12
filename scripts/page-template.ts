import { affLink } from './links.ts';
import { canonical, esc, ORIGIN, type PageSpec } from './html.ts';
import { appNames, joinWords, type Template } from './meta.ts';

const TITLE_MAX = 60;

function pageTitle(t: Template): string {
  const long = `${t.meta.h1} — Make.com blueprint`;
  return long.length <= TITLE_MAX ? long : `${t.meta.title} — Make.com blueprint`;
}

function pageDescription(t: Template): string {
  const apps = joinWords(appNames(t.meta.apps));
  return `Free Make.com blueprint: ${apps}. ${t.meta.connections} connections, ${t.meta.opsPerRun} operations per run. Download the JSON, import it, reconnect, run.`;
}

/** Two sentences, both derived from meta.json so the site never mirrors the repo README. */
function intro(t: Template): string {
  const apps = joinWords(appNames(t.meta.apps));
  const credits = t.meta.aiCreditsPerRun ? `about ${t.meta.aiCreditsPerRun} AI credits` : 'no AI credits';
  return `<p class="lede">${esc(apps)} wired together in one Make.com scenario — a blueprint you import, not a tutorial you follow.
        Reconnect ${t.meta.connections} accounts and one run costs about ${t.meta.opsPerRun} operations and ${credits}.</p>`;
}

function screenshot(t: Template): string {
  if (!t.screenshotPath || !t.meta.screenshot) return '';
  return `<figure class="shot">
          <img src="/${t.meta.slug}/${esc(t.meta.screenshot)}" alt="${esc(t.meta.h1)}" width="1200" height="630" loading="lazy">
          <figcaption>The scenario on the Make canvas, left to right.</figcaption>
        </figure>`;
}

function ctaRow(t: Template): string {
  const download = `<a class="btn${t.meta.shareUrl ? ' secondary' : ''}" href="/${t.meta.slug}/blueprint.json" download>Download blueprint.json</a>`;
  const use = t.meta.shareUrl
    ? `<a class="btn" href="${esc(t.meta.shareUrl)}">Use in Make</a>`
    : '';
  const guide = t.meta.shareUrl ? '' : '<a class="btn secondary" href="/import">How to import it</a>';
  return `<div class="cta-row">${use}${download}${guide}</div>
        <p class="disclosure">No Make account yet? <a href="${esc(affLink('site'))}">Create one free</a> — referral link, same price for you.</p>`;
}

function connectionChecklist(t: Template): string {
  const items = appNames(t.meta.apps)
    .map((name) => `<li>${esc(name)}</li>`)
    .join('\n            ');
  return `<h2 id="connections">Accounts to connect (${t.meta.connections})</h2>
        <ul class="checklist">
            ${items}
        </ul>
        <div class="note"><p><strong>Red modules after import are normal.</strong> A blueprint never carries credentials, so every module starts unconnected. Open each red module, pick or create its account, and the red disappears. Nothing is broken.</p></div>`;
}

function creditSentence(t: Template): string {
  if (t.meta.aiCreditsPerRun === null) {
    return 'This scenario uses no AI modules, so it consumes <strong>no AI credits</strong>. Operations and AI credits are separate meters in Make — only AI modules spend credits.';
  }
  if (t.meta.aiCreditsPerRun === 0) {
    return 'It consumes <strong>no Make AI credits</strong>. Operations and AI credits are separate meters in Make, and not every AI module charges the credit meter.';
  }
  return `It also spends about <strong>${t.meta.aiCreditsPerRun} AI credits</strong> per run. Operations and AI credits are separate meters in Make.`;
}

function cost(t: Template): string {
  const credits = creditSentence(t);
  return `<h2 id="cost">Operations and AI credits per run</h2>
        <p><strong>${t.meta.opsPerRun} operations per run.</strong> ${credits}</p>
        <p class="small muted">${esc(t.meta.opsNote)}</p>`;
}

interface HowToStep {
  readonly name: string;
  readonly text: string;
}

function howToSteps(t: Template): HowToStep[] {
  const apps = joinWords(appNames(t.meta.apps));
  const first = t.meta.shareUrl
    ? {
        name: 'Open the scenario',
        text: 'Open the shared scenario and click Use this scenario. Make copies it into your own account. If you prefer the file, download blueprint.json and import it instead.',
      }
    : {
        name: 'Import the blueprint',
        text: 'Download blueprint.json, then in Make go to Scenarios, Create a new scenario, click the three dots at the bottom of the screen, and choose Import Blueprint.',
      };
  return [
    first,
    {
      name: 'Reconnect your accounts',
      text: `Open each red module and pick or create its connection: ${apps}. ${t.meta.connections} connections in total. Red means unconnected, not broken.`,
    },
    {
      name: 'Run once',
      text: 'Press Run once, check the output of every module, then turn the schedule on.',
    },
  ];
}

function howTo(t: Template): string {
  const items = howToSteps(t)
    .map((step) => `<li><strong>${esc(step.name)}</strong> — ${esc(step.text)}</li>`)
    .join('\n            ');
  return `<h2 id="how-to">Import, reconnect, run once</h2>
        <ol class="steps">
            ${items}
        </ol>
        <p>The import screen is the same for every template: <a href="/import">step-by-step import guide</a>.</p>`;
}

function faq(t: Template): string {
  if (t.meta.faq.length === 0) return '';
  const items = t.meta.faq
    .map((entry) => `<h3>${esc(entry.q)}</h3>\n          <p>${esc(entry.a)}</p>`)
    .join('\n          ');
  return `<h2 id="faq">Questions</h2>
        <div class="faq">
          ${items}
        </div>`;
}

function related(t: Template, all: readonly Template[]): string {
  const known = new Map(all.map((item) => [item.meta.slug, item]));
  const items = t.meta.related
    .map((slug) => known.get(slug))
    .filter((item): item is Template => item !== undefined)
    .slice(0, 3)
    .map((item) => `<li><a href="/${item.meta.slug}">${esc(item.meta.h1)}</a></li>`)
    .join('\n            ');
  if (!items) return '';
  return `<h2 id="related">Related blueprints</h2>
        <ul class="related">
            ${items}
        </ul>`;
}

function structuredData(t: Template): unknown[] {
  const url = canonical(`/${t.meta.slug}`);
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: t.meta.h1,
    description: `Import the ${t.meta.title} blueprint into Make.com, reconnect ${t.meta.connections} accounts, and run it.`,
    totalTime: 'PT10M',
    step: howToSteps(t).map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${url}#how-to`,
    })),
  };
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.meta.faq.map((entry) => ({
      '@type': 'Question',
      name: entry.q,
      acceptedAnswer: { '@type': 'Answer', text: entry.a },
    })),
  };
  return t.meta.faq.length > 0 ? [howTo, faqPage] : [howTo];
}

export function templatePage(t: Template, all: readonly Template[]): PageSpec {
  const body = [
    `<h1>${esc(t.meta.h1)}</h1>`,
    intro(t),
    screenshot(t),
    ctaRow(t),
    connectionChecklist(t),
    cost(t),
    howTo(t),
    faq(t),
    related(t, all),
  ]
    .filter(Boolean)
    .map((block) => `        ${block}`)
    .join('\n');
  return {
    path: `/${t.meta.slug}`,
    title: pageTitle(t),
    description: pageDescription(t),
    noindex: t.meta.status !== 'published',
    ogImage: t.screenshotPath && t.meta.screenshot ? `${ORIGIN}/${t.meta.slug}/${t.meta.screenshot}` : null,
    jsonLd: structuredData(t),
    body,
    script: null,
  };
}
