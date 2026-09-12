import { canonical, RAW_BASE, REPO_URL } from './html.ts';
import { appNames, joinWords, type Template } from './meta.ts';

/** Replace the body between `<!-- gen:<name> -->` and `<!-- /gen:<name> -->`. */
export function replaceMarked(source: string, name: string, content: string): string {
  const open = `<!-- gen:${name} -->`;
  const close = `<!-- /gen:${name} -->`;
  const start = source.indexOf(open);
  const end = source.indexOf(close);
  if (start < 0 || end < 0 || end < start) {
    throw new Error(`Missing marker pair ${open} … ${close}. Add it back before running the generator.`);
  }
  return `${source.slice(0, start + open.length)}\n${content}\n${source.slice(end)}`;
}

function getItLinks(t: Template): string {
  const links = [`[blueprint.json](./templates/${t.meta.slug}/blueprint.json)`];
  if (t.meta.shareUrl) links.unshift(`[Use in Make](${t.meta.shareUrl})`);
  if (t.meta.status === 'published') links.push(`[page](${canonical(`/${t.meta.slug}`)})`);
  return links.join(' · ');
}

function templatesIntro(templates: readonly Template[]): string {
  const apps = joinWords([...new Set(templates.flatMap((t) => appNames(t.meta.apps)))].sort());
  const paid = templates.filter((t) => (t.meta.aiCreditsPerRun ?? 0) > 0);
  const credits =
    paid.length === 0
      ? 'None of them spend Make AI credits.'
      : `${paid.length} of them spend Make AI credits.`;
  const plural = templates.length === 1 ? 'blueprint' : 'blueprints';
  return `${templates.length} importable ${plural} across ${apps}. ${credits} Every row links the blueprint JSON, the one-click scenario where there is one, and a page listing the connections to reconnect after import.`;
}

export function readmeTable(templates: readonly Template[]): string {
  if (templates.length === 0) return '_No templates yet._';
  const rows = templates.map(
    (t) =>
      `| [${t.meta.h1}](./templates/${t.meta.slug}/) | ${appNames(t.meta.apps).join(', ')} | ${t.meta.opsPerRun} | ${t.meta.department} | ${getItLinks(t)} |`,
  );
  return [
    templatesIntro(templates),
    '',
    '| Template | Apps | Operations / run | Department | Get it |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

/** One entry per distinct question across every template; the first answer wins. */
export function readmeFaq(templates: readonly Template[]): string {
  const byQuestion = new Map<string, { q: string; a: string; source: Template }>();
  for (const t of templates) {
    for (const entry of t.meta.faq) {
      const key = entry.q.trim().toLowerCase().replace(/\s+/g, ' ');
      if (byQuestion.has(key)) continue;
      byQuestion.set(key, { q: entry.q.trim(), a: entry.a.trim(), source: t });
    }
  }
  if (byQuestion.size === 0) return '_No questions yet._';
  return [...byQuestion.values()]
    .map(
      ({ q, a, source }) =>
        `### ${q}\n\n${a} ([${source.meta.h1}](./templates/${source.meta.slug}/))`,
    )
    .join('\n\n');
}

/** Raw URLs, because a model reading the repo needs the JSON itself, not an HTML page. */
export function repoRawList(templates: readonly Template[]): string {
  if (templates.length === 0) return '_No templates yet._';
  return templates
    .map((t) => {
      const raw = `${RAW_BASE}/templates/${t.meta.slug}`;
      return `- [${t.meta.h1}](${raw}/blueprint.json): the blueprint JSON, importable as downloaded. ${t.meta.connections} connections, ${t.meta.opsPerRun} operations per run. Also raw: [README.md](${raw}/README.md), [meta.json](${raw}/meta.json).`;
    })
    .join('\n');
}

export interface LlmsDoc {
  readonly path: string;
  readonly body: string;
}

const RULE = '='.repeat(72);

export function llmsFullTxt(docs: readonly LlmsDoc[]): string {
  const header = `# awesome-make-templates — full documentation

> Every user-facing document in this repository, concatenated for LLM context: the root README, then one README per template. Engineering notes under docs/ are not included.

Repository: ${REPO_URL}
Documents: ${docs.length}
`;
  const sections = docs.map((doc) => `${RULE}\nFILE: ${doc.path}\n${RULE}\n\n${doc.body.trim()}\n`);
  return [header, ...sections].join('\n');
}

function summary(t: Template): string {
  const apps = joinWords(appNames(t.meta.apps));
  const credits = t.meta.aiCreditsPerRun ? `${t.meta.aiCreditsPerRun} AI credits per run` : 'no AI credits';
  return `${apps}. ${t.meta.connections} connections, ${t.meta.opsPerRun} operations per run, ${credits}. Status: ${t.meta.status}.`;
}

export function llmsList(templates: readonly Template[]): string {
  if (templates.length === 0) return '_No templates yet._';
  return templates
    .map((t) => `- [${t.meta.h1}](./templates/${t.meta.slug}/README.md): ${summary(t)}`)
    .join('\n');
}

export function siteLlmsTxt(templates: readonly Template[]): string {
  const entries = templates.map((t) => `- [${t.meta.h1}](${canonical(`/${t.meta.slug}`)}): ${summary(t)}`);
  return `# Make.com blueprint templates

> Importable Make.com scenario blueprints, one page per use case. Each page states the apps involved, the connections to reconnect after import, and the operations one run costs. Blueprints are free JSON downloads: no account, no email gate.

## Pages

- [Templates](${canonical('/')}): every blueprint, filterable by app.
- [Import a blueprint](${canonical('/import')}): download the JSON, use Import Blueprint, reconnect, run once.
- [Coming from Zapier](${canonical('/zapier')}): Zap steps mapped to Make modules, and why a task is not an operation.

## Templates

${entries.length > 0 ? entries.join('\n') : '_No templates yet._'}

## Notes

- A blueprint carries no credentials, so imported modules are red until you connect them. Red is not broken.
- Operations and AI credits are separate meters in Make. Templates without AI modules spend no credits.
- Templates marked draft are not yet verified end to end and are excluded from the sitemap.
`;
}
