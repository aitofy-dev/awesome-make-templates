/**
 * Import gate: create a scenario from a blueprint on the test team, read it back,
 * delete it. Exit 0 when Make accepts the blueprint, exit 1 with an actionable message.
 *
 * Usage: node --experimental-strip-types scripts/import-check.ts <blueprint.json>
 */
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const err = <T>(error: string): Result<T> => ({ ok: false, error });

type Credentials = { token: string; zone: string; teamId: number };

type Module = {
  id: number;
  module: string;
  version: number;
  parameters?: Record<string, unknown>;
  routes?: { flow: Module[] }[];
  onerror?: Module[];
};

type Blueprint = { name: string; flow: Module[]; metadata: Record<string, unknown> };

const NAME_PREFIX = '[import-check]';
const CONNECTION_FIELDS = ['__IMTCONN__', '__IMTKEY__', '__IMTHOOK__', 'makeConnectionId', 'account'];

function parseEnvFile(text: string): Record<string, string> {
  const entries = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line): [string, string] => {
      const eq = line.indexOf('=');
      return [line.slice(0, eq), line.slice(eq + 1).replace(/^["']|["']$/g, '')];
    });
  return Object.fromEntries(entries);
}

async function loadCredentials(): Promise<Result<Credentials>> {
  const fromFile = await readFile(join(homedir(), '.aff', 'make.env'), 'utf8')
    .then(parseEnvFile)
    .catch(() => ({}) as Record<string, string>);
  const get = (key: string): string => process.env[key] ?? fromFile[key] ?? '';
  const token = get('MAKE_API_TOKEN');
  const teamId = Number(get('MAKE_TEAM_ID'));
  if (token === '' || !Number.isInteger(teamId) || teamId <= 0) {
    return err('MAKE_API_TOKEN and MAKE_TEAM_ID must be set in the environment or ~/.aff/make.env.');
  }
  return ok({ token, zone: get('MAKE_ZONE') || 'us2', teamId });
}

type Api = (path: string, init?: RequestInit) => Promise<Result<unknown>>;

function makeApi({ token, zone }: Credentials): Api {
  const base = `https://${zone}.make.com/api/v2`;
  return async (path, init = {}) => {
    const headers = { Authorization: `Token ${token}`, 'Content-Type': 'application/json' };
    const response = await fetch(base + path, { ...init, headers }).catch((cause: unknown) => cause);
    if (response instanceof Error) return err(`${init.method ?? 'GET'} ${path} failed: ${response.message}`);
    const body: unknown = await (response as Response).json().catch(() => null);
    if (!(response as Response).ok) {
      return err(`${init.method ?? 'GET'} ${path} -> ${(response as Response).status} ${describe(body)}`);
    }
    return ok(body);
  };
}

function describe(body: unknown): string {
  if (body === null || typeof body !== 'object') return '';
  const { detail, message, suberrors } = body as Record<string, unknown>;
  const sub = Array.isArray(suberrors) ? suberrors.map((s) => describe(s)).join('; ') : '';
  return [detail, message, sub].filter((part) => typeof part === 'string' && part !== '').join(' | ');
}

function readBlueprint(text: string, file: string): Result<Blueprint> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (cause) {
    return err(`${file} is not valid JSON: ${(cause as Error).message}`);
  }
  const root = parsed as Partial<Blueprint>;
  if (typeof root.name !== 'string' || root.name === '') {
    return err(`${file}: top-level "name" is required — Make returns HTTP 500 without it.`);
  }
  if (!Array.isArray(root.flow) || root.flow.length === 0) {
    return err(`${file}: "flow" must be a non-empty array of modules.`);
  }
  if (root.metadata === undefined || root.metadata === null) {
    return err(`${file}: "metadata" is required by scenarios_create. An empty object is accepted.`);
  }
  return ok({ name: root.name, flow: root.flow, metadata: root.metadata });
}

function walk(flow: Module[]): Module[] {
  return flow.flatMap((node) => [node, ...walk(node.routes?.flatMap((route) => route.flow) ?? []), ...walk(node.onerror ?? [])]);
}

function findShippedConnections(flow: Module[]): string[] {
  return walk(flow).flatMap((node) =>
    CONNECTION_FIELDS.filter((field) => {
      const value = node.parameters?.[field];
      return value !== undefined && value !== null && value !== '';
    }).map((field) => `module ${node.id} (${node.module}) ships parameters.${field}`),
  );
}

async function createScenario(api: Api, creds: Credentials, blueprint: Blueprint): Promise<Result<number>> {
  const payload = { ...blueprint, name: `${NAME_PREFIX} ${blueprint.name}` };
  const body = JSON.stringify({
    teamId: creds.teamId,
    scheduling: JSON.stringify({ type: 'on-demand' }),
    blueprint: JSON.stringify(payload),
  });
  const created = await api('/scenarios', { method: 'POST', body });
  if (!created.ok) return err(created.error);
  const id = (created.value as { scenario?: { id?: number } }).scenario?.id;
  return typeof id === 'number' ? ok(id) : err('Make accepted the blueprint but returned no scenario id.');
}

async function readBack(api: Api, id: number): Promise<Result<Blueprint>> {
  const got = await api(`/scenarios/${id}/blueprint`);
  if (!got.ok) return err(got.error);
  const blueprint = (got.value as { response?: { blueprint?: Blueprint } }).response?.blueprint;
  return blueprint === undefined ? err('GET /scenarios/{id}/blueprint returned no blueprint.') : ok(blueprint);
}

function compare(sent: Blueprint, back: Blueprint): Result<number> {
  const a = walk(sent.flow);
  const b = walk(back.flow);
  if (a.length !== b.length) {
    return err(`Make stored ${b.length} modules but the blueprint declares ${a.length}. Check nested routes/onerror.`);
  }
  const drifted = a.filter((node, i) => node.module !== b[i]?.module || node.version !== b[i]?.version);
  if (drifted.length > 0) {
    const names = drifted.map((node) => `${node.id}:${node.module}@${node.version}`).join(', ');
    return err(`Make rewrote these modules on import: ${names}. Pin the version Make returns.`);
  }
  return ok(a.length);
}

async function sweep(api: Api, creds: Credentials): Promise<void> {
  const listed = await api(`/scenarios?teamId=${creds.teamId}`);
  if (!listed.ok) return;
  const scenarios = (listed.value as { scenarios?: { id: number; name: string }[] }).scenarios ?? [];
  for (const scenario of scenarios.filter((s) => s.name.startsWith(NAME_PREFIX))) {
    await api(`/scenarios/${scenario.id}`, { method: 'DELETE' });
  }
}

async function run(file: string, api: Api, creds: Credentials): Promise<Result<string>> {
  const text = await readFile(file, 'utf8').catch((cause: unknown) => cause as Error);
  if (text instanceof Error) return err(`Cannot read ${file}: ${text.message}`);
  const blueprint = readBlueprint(text, file);
  if (!blueprint.ok) return err(blueprint.error);
  const leaked = findShippedConnections(blueprint.value.flow);
  if (leaked.length > 0) {
    return err(`Connection/key ids must not ship: ${leaked.join('; ')}. Remove the key so the module imports unconfigured.`);
  }
  await sweep(api, creds);
  const created = await createScenario(api, creds, blueprint.value);
  if (!created.ok) return err(created.error);
  try {
    const back = await readBack(api, created.value);
    if (!back.ok) return err(back.error);
    const compared = compare(blueprint.value, back.value);
    return compared.ok ? ok(`${file}: imported, ${compared.value} modules round-tripped.`) : err(compared.error);
  } finally {
    await api(`/scenarios/${created.value}`, { method: 'DELETE' });
  }
}

const file = process.argv[2];
if (file === undefined) {
  console.error('Usage: node --experimental-strip-types scripts/import-check.ts <blueprint.json>');
  process.exit(1);
}
const creds = await loadCredentials();
if (!creds.ok) {
  console.error(creds.error);
  process.exit(1);
}
const api = makeApi(creds.value);
const result = await run(file, api, creds.value);
await sweep(api, creds.value);
console[result.ok ? 'log' : 'error'](result.ok ? result.value : result.error);
process.exit(result.ok ? 0 : 1);
