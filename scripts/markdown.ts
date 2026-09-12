import { esc } from './html.ts';

export interface MarkdownTable {
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

const SEPARATOR = /^\|?[\s:|-]+\|[\s:|-]*$/;

/** First pipe table under `## <heading>`, or null when the section or table is missing. */
export function extractTable(markdown: string, heading: string): MarkdownTable | null {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return null;
  const section = lines.slice(start + 1);
  const end = section.findIndex((line) => line.startsWith('## '));
  const scope = end < 0 ? section : section.slice(0, end);
  const head = scope.findIndex((line) => line.trim().startsWith('|'));
  if (head < 0 || !SEPARATOR.test(scope[head + 1] ?? '')) return null;
  const rows: string[][] = [];
  for (const line of scope.slice(head + 2)) {
    if (!line.trim().startsWith('|')) break;
    rows.push(splitRow(line));
  }
  return { headers: splitRow(scope[head]), rows };
}

/** Inline markdown a table cell may carry: bold, code, links are not expected. */
export function inlineToHtml(cell: string): string {
  return esc(cell)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
