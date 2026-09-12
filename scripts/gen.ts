import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonical, ORIGIN, renderPage, type PageSpec } from './html.ts';
import { llmsList, readmeTable, replaceMarked, siteLlmsTxt } from './markers.ts';
import { loadTemplates, type Template } from './meta.ts';
import { homePage } from './page-home.ts';
import { hasZapierSection, importPage, notFoundPage, zapierPage } from './page-static.ts';
import { templatePage } from './page-template.ts';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, '..');
const dist = join(root, 'dist');

function write(relative: string, content: string): void {
  const file = join(dist, relative);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function distFile(path: string): string {
  if (path === '/') return 'index.html';
  if (path === '/404') return '404.html';
  return `${path.slice(1)}/index.html`;
}

function writePage(page: PageSpec): string {
  write(distFile(page.path), renderPage(page));
  return page.path;
}

function copyAssets(t: Template): void {
  if (existsSync(t.blueprintPath)) {
    mkdirSync(join(dist, t.meta.slug), { recursive: true });
    copyFileSync(t.blueprintPath, join(dist, t.meta.slug, 'blueprint.json'));
  }
  if (t.screenshotPath && t.meta.screenshot) {
    copyFileSync(t.screenshotPath, join(dist, t.meta.slug, t.meta.screenshot));
  }
}

function sitemap(templates: readonly Template[]): string {
  const paths = ['/', '/import', '/zapier'].concat(
    templates.filter((t) => t.meta.status === 'published').map((t) => `/${t.meta.slug}`),
  );
  const urls = paths.map((path) => `  <url><loc>${canonical(path)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function robots(): string {
  return `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;
}

function updateMarkedFile(file: string, name: string, content: string): void {
  const path = join(root, file);
  const updated = replaceMarked(readFileSync(path, 'utf8'), name, content);
  writeFileSync(path, updated);
}

function main(): void {
  const templates = loadTemplates(join(root, 'templates'));
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });

  const paths = [
    writePage(homePage(templates)),
    writePage(importPage()),
    writePage(zapierPage(templates)),
    ...templates.map((t) => writePage(templatePage(t, templates))),
  ];
  writePage(notFoundPage());
  templates.forEach(copyAssets);

  copyFileSync(join(scriptsDir, 'site.css'), join(dist, 'styles.css'));
  write('sitemap.xml', sitemap(templates));
  write('robots.txt', robots());
  write('llms.txt', siteLlmsTxt(templates));

  updateMarkedFile('README.md', 'templates', readmeTable(templates));
  updateMarkedFile('llms.txt', 'llms', llmsList(templates));

  const published = templates.filter((t) => t.meta.status === 'published').length;
  console.log(`${templates.length} templates (${published} published) → ${paths.length} pages in dist/`);
  if (published < templates.length) {
    console.log(`draft pages carry noindex and stay out of sitemap.xml: ${templates.filter((t) => t.meta.status !== 'published').map((t) => t.meta.slug).join(', ')}`);
  }
  if (!hasZapierSection(templates)) {
    console.log('TODO: no template README has a "## Coming from Zapier" section yet, so /zapier ships without mapping tables.');
  }
}

main();
