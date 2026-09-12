export const ORIGIN = 'https://make-templates.aitofy.dev';
export const REPO_URL = 'https://github.com/aitofy-dev/awesome-make-templates';

export interface PageSpec {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly noindex: boolean;
  readonly ogImage: string | null;
  readonly jsonLd: readonly unknown[];
  readonly body: string;
  readonly script: string | null;
}

export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function canonical(path: string): string {
  return `${ORIGIN}${path}`;
}

function jsonLdBlock(data: readonly unknown[]): string {
  return data
    .map((entry) => {
      const json = JSON.stringify(entry, null, 2).replace(/</g, '\\u003c');
      return `<script type="application/ld+json">\n${json}\n</script>`;
    })
    .join('\n');
}

function head(page: PageSpec): string {
  const url = canonical(page.path);
  const lines = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    page.noindex ? '<meta name="robots" content="noindex">' : '<meta name="robots" content="index, follow">',
    '<meta property="og:type" content="website">',
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    page.ogImage ? `<meta property="og:image" content="${esc(page.ogImage)}">` : '',
    `<meta name="twitter:card" content="${page.ogImage ? 'summary_large_image' : 'summary'}">`,
    '<link rel="stylesheet" href="/styles.css">',
    '<link rel="icon" href="data:,">',
  ];
  return lines.filter(Boolean).join('\n    ');
}

function nav(): string {
  return `<header class="site">
      <div class="wrap">
        <a class="brand" href="/">Make blueprints</a>
        <nav>
          <a href="/">Templates</a>
          <a href="/import">Import guide</a>
          <a href="/zapier">From Zapier</a>
          <a href="${REPO_URL}">GitHub</a>
        </nav>
      </div>
    </header>`;
}

function footer(): string {
  return `<footer class="site">
      <div class="wrap">
        <p>Open-source Make.com blueprints by <a href="https://aitofy.dev">Aitofy</a>. Every blueprint is MIT-licensed and free to download — no account, no email gate.</p>
        <p>Affiliate disclosure: links to Make.com on this site are referral links. If you sign up through one we may earn a commission, at no extra cost to you. We are not affiliated with Make.com beyond that referral programme.</p>
      </div>
    </footer>`;
}

export function renderPage(page: PageSpec): string {
  return `<!doctype html>
<html lang="en">
  <head>
    ${[head(page), jsonLdBlock(page.jsonLd)].filter(Boolean).join('\n    ')}
  </head>
  <body>
    ${nav()}
    <main>
      <div class="wrap">
${page.body}
      </div>
    </main>
    ${footer()}${page.script ? `\n    <script>${page.script}</script>` : ''}
  </body>
</html>
`;
}

export function table(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const head = headers.map((cell) => `<th>${cell}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`)
    .join('\n            ');
  return `<div class="table-scroll">
          <table>
            <thead><tr>${head}</tr></thead>
            <tbody>
            ${body}
            </tbody>
          </table>
        </div>`;
}
