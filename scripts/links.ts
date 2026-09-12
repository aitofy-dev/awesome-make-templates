import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Where a click came from, so Make's affiliate report can tell the channels apart. */
export type AffSource = 'site' | 'github' | `reddit-${string}` | 'scenario-share';

const REGISTER_URL = 'https://www.make.com/en/register';
const AFF_ENV_FILE = join(homedir(), '.aff', 'make.env');

let cachedCode: string | undefined;

function readAffCodeFromEnvFile(): string | undefined {
  try {
    const line = readFileSync(AFF_ENV_FILE, 'utf8')
      .split('\n')
      .find((l) => l.startsWith('AFF_CODE='));
    return line?.slice('AFF_CODE='.length).trim() || undefined;
  } catch {
    return undefined;
  }
}

function affCode(): string {
  cachedCode ??= process.env.AFF_CODE?.trim() || readAffCodeFromEnvFile();
  if (!cachedCode) {
    throw new Error(
      `AFF_CODE is not set. Export AFF_CODE=<your Make partner code> or put AFF_CODE=... in ${AFF_ENV_FILE}.`,
    );
  }
  return cachedCode;
}

/** The only place a Make affiliate URL is built. Every CTA goes through here. */
export function affLink(source: AffSource): string {
  const url = new URL(REGISTER_URL);
  url.searchParams.set('pc', affCode());
  url.searchParams.set('affiliateSource', source);
  return url.toString();
}
