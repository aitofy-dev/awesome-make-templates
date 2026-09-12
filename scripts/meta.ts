import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type TemplateStatus = 'draft' | 'validated' | 'published';

export interface FaqEntry {
  readonly q: string;
  readonly a: string;
}

export interface TemplateMeta {
  readonly slug: string;
  readonly title: string;
  readonly h1: string;
  readonly query: string;
  readonly apps: readonly string[];
  readonly connections: number;
  readonly opsPerRun: number;
  readonly aiCreditsPerRun: number | null;
  readonly opsNote: string;
  readonly shareUrl: string | null;
  readonly screenshot: string | null;
  readonly faq: readonly FaqEntry[];
  readonly related: readonly string[];
  readonly department: string;
  readonly status: TemplateStatus;
}

export interface Template {
  readonly meta: TemplateMeta;
  readonly dir: string;
  readonly blueprintPath: string;
  /** Set only when meta.screenshot names a file that is actually on disk. */
  readonly screenshotPath: string | null;
}

const STATUSES: readonly TemplateStatus[] = ['draft', 'validated', 'published'];

function fail(file: string, problem: string): never {
  throw new Error(`${file}: ${problem}. Fix meta.json before running the generator.`);
}

function str(record: Record<string, unknown>, key: string, file: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) fail(file, `"${key}" must be a non-empty string`);
  return value;
}

function num(record: Record<string, unknown>, key: string, file: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(file, `"${key}" must be a number`);
  return value;
}

function nullableStr(record: Record<string, unknown>, key: string, file: string): string | null {
  const value = record[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') fail(file, `"${key}" must be a string or null`);
  return value;
}

function strList(record: Record<string, unknown>, key: string, file: string): string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    fail(file, `"${key}" must be an array of strings`);
  }
  return value as string[];
}

function faqList(record: Record<string, unknown>, file: string): FaqEntry[] {
  const value = record.faq;
  if (!Array.isArray(value)) fail(file, '"faq" must be an array');
  return value.map((entry, index) => {
    const item = entry as Record<string, unknown>;
    if (typeof item?.q !== 'string' || typeof item?.a !== 'string') {
      fail(file, `"faq[${index}]" must be { q: string, a: string }`);
    }
    return { q: item.q as string, a: item.a as string };
  });
}

function parseStatus(record: Record<string, unknown>, file: string): TemplateStatus {
  const value = record.status;
  if (typeof value !== 'string' || !STATUSES.includes(value as TemplateStatus)) {
    fail(file, `"status" must be one of ${STATUSES.join(', ')}`);
  }
  return value as TemplateStatus;
}

export function parseMeta(raw: unknown, file: string, folderName: string): TemplateMeta {
  if (typeof raw !== 'object' || raw === null) fail(file, 'must contain a JSON object');
  const record = raw as Record<string, unknown>;
  const slug = str(record, 'slug', file);
  if (slug !== folderName) fail(file, `"slug" is "${slug}" but the folder is "${folderName}"`);
  return {
    slug,
    title: str(record, 'title', file),
    h1: str(record, 'h1', file),
    query: str(record, 'query', file),
    apps: strList(record, 'apps', file),
    connections: num(record, 'connections', file),
    opsPerRun: num(record, 'opsPerRun', file),
    aiCreditsPerRun: typeof record.aiCreditsPerRun === 'number' ? record.aiCreditsPerRun : null,
    opsNote: str(record, 'opsNote', file),
    shareUrl: nullableStr(record, 'shareUrl', file),
    screenshot: nullableStr(record, 'screenshot', file),
    faq: faqList(record, file),
    related: strList(record, 'related', file),
    department: str(record, 'department', file),
    status: parseStatus(record, file),
  };
}

export function loadTemplates(templatesRoot: string): Template[] {
  return readdirSync(templatesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .filter((name) => existsSync(join(templatesRoot, name, 'meta.json')))
    .map((name) => {
      const dir = join(templatesRoot, name);
      const file = join(dir, 'meta.json');
      const meta = parseMeta(JSON.parse(readFileSync(file, 'utf8')), file, name);
      const shot = meta.screenshot ? join(dir, meta.screenshot) : null;
      return {
        meta,
        dir,
        blueprintPath: join(dir, 'blueprint.json'),
        screenshotPath: shot && existsSync(shot) ? shot : null,
      };
    });
}

const APP_NAMES: Readonly<Record<string, string>> = {
  'google-forms': 'Google Forms',
  'google-sheets': 'Google Sheets',
  'google-drive': 'Google Drive',
  gmail: 'Gmail',
  notion: 'Notion',
  slack: 'Slack',
  openai: 'OpenAI',
  'openai-gpt-3': 'OpenAI',
  airtable: 'Airtable',
  stripe: 'Stripe',
  hubspot: 'HubSpot',
};

/** Human label for an app id; unknown ids fall back to title-cased slug parts. */
export function appName(id: string): string {
  return APP_NAMES[id] ?? id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
}

export function appNames(ids: readonly string[]): string[] {
  return ids.map(appName);
}

export function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}
