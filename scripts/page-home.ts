import { affLink } from './links.ts';
import { canonical, esc, type PageSpec } from './html.ts';
import { appName, appNames, type Template } from './meta.ts';

const FILTER_SCRIPT = `
(function () {
  var bar = document.querySelector('[data-filters]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-apps]'));
  if (!bar || !cards.length) return;
  bar.hidden = false;
  bar.addEventListener('click', function (event) {
    var button = event.target.closest('button[data-app]');
    if (!button) return;
    var app = button.getAttribute('data-app');
    bar.querySelectorAll('button[data-app]').forEach(function (other) {
      other.setAttribute('aria-pressed', String(other === button));
    });
    cards.forEach(function (card) {
      card.hidden = app !== 'all' && card.getAttribute('data-apps').split(' ').indexOf(app) < 0;
    });
  });
})();`.trim();

function card(t: Template): string {
  const chips = appNames(t.meta.apps)
    .map((name) => `<li>${esc(name)}</li>`)
    .join('');
  const cta = t.meta.shareUrl
    ? `<a class="btn" href="${esc(t.meta.shareUrl)}">Use in Make</a>`
    : `<a class="btn" href="/${t.meta.slug}/blueprint.json" download>Download blueprint.json</a>`;
  return `<li class="card" data-apps="${esc(t.meta.apps.join(' '))}">
            <h2><a href="/${t.meta.slug}">${esc(t.meta.title)}</a></h2>
            <ul class="chips">${chips}</ul>
            <p>${esc(t.meta.h1)}.</p>
            <p class="facts">${t.meta.opsPerRun} operations per run · ${t.meta.connections} connections · ${esc(t.meta.department)}</p>
            <div class="cta-row">${cta}<a class="btn secondary" href="/${t.meta.slug}">What it does</a></div>
          </li>`;
}

function filterBar(templates: readonly Template[]): string {
  const apps = [...new Set(templates.flatMap((t) => t.meta.apps))].sort();
  if (apps.length < 2) return '';
  const buttons = apps
    .map((app) => `<button type="button" data-app="${esc(app)}" aria-pressed="false">${esc(appName(app))}</button>`)
    .join('\n            ');
  return `<div class="filters" data-filters hidden>
            <button type="button" data-app="all" aria-pressed="true">All</button>
            ${buttons}
          </div>`;
}

function itemList(templates: readonly Template[]): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Make.com blueprint templates',
    itemListElement: templates.map((t, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: t.meta.h1,
      url: canonical(`/${t.meta.slug}`),
    })),
  };
}

export function homePage(templates: readonly Template[]): PageSpec {
  const cards = templates.map(card).join('\n          ');
  const body = `        <h1>Import a Make.com blueprint in 2 minutes</h1>
        <p class="lede">Working Make.com scenarios as JSON files. Download one, import it, reconnect your accounts, run it.
        Every template says which apps it touches, how many connections it needs, and what one run costs in operations.</p>
        <p class="disclosure">No Make account yet? <a href="${esc(affLink('site'))}">Create one free</a> — referral link, same price for you.</p>

        <h2>Templates</h2>
        ${filterBar(templates)}
        <ul class="grid" data-grid>
          ${cards}
        </ul>

        <h2>New to blueprints?</h2>
        <p>A blueprint is a JSON export of a whole scenario. Importing one rebuilds the modules, the mapping and the routes in your own account — everything except your credentials, which never travel inside the file. That is why modules show up red right after an import.</p>
        <p><a href="/import">How to import a blueprint, step by step</a> · <a href="/zapier">Coming from Zapier? Zap steps mapped to Make modules</a></p>`;
  return {
    path: '/',
    title: 'Make.com blueprints — import a working scenario fast',
    description:
      'Free, importable Make.com scenario blueprints. Each one lists its apps, its connections and its operations per run. Download the JSON and import it in two minutes.',
    noindex: false,
    ogImage: null,
    jsonLd: [itemList(templates)],
    body,
    script: FILTER_SCRIPT,
  };
}
