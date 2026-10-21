import {
  loadRuntimeConfig,
  requireResidentCredentials,
  requireResidentFixture,
  type AccountCredentials,
} from '../src/config/runtime.js';

const PRODUCTION_API_BASE_URL = 'https://api.isocietymanager.com';

interface LoginAccount {
  user_id?: unknown;
  society_id?: number;
  flat_no?: string;
}

interface LoginResponse {
  status?: string;
  message?: string;
  data?: LoginAccount[] | Record<string, unknown>;
}

interface AccountTarget extends Required<AccountCredentials> {
  label: string;
}

function parseSelectedIdentity(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || !value.startsWith('{')) return {};
  try {
    const decoded: unknown = JSON.parse(value);
    return typeof decoded === 'object' && decoded !== null
      ? (decoded as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

async function login(payload: Record<string, unknown>): Promise<LoginResponse> {
  const response = await fetch(`${PRODUCTION_API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Resident login API returned HTTP ${response.status}`);
  return (await response.json()) as LoginResponse;
}

function resolvedSiteAndUnit(data: Record<string, unknown>): {
  siteId?: string;
  accountUnit?: string;
} {
  const selected = parseSelectedIdentity(data.id);
  const siteId = selected.society_id ?? data.societyId ?? data.society_id;
  const accountUnit = selected.flat_no ?? data.flat_no;
  return {
    siteId: siteId === undefined ? undefined : String(siteId),
    accountUnit: accountUnit === undefined ? undefined : String(accountUnit),
  };
}

async function verifyAccount(target: AccountTarget, expectedSiteId: string): Promise<void> {
  const payload = {
    identity: target.username,
    password: target.password,
    tenant: 0,
    user_id: null,
    device_type: 'android',
  };
  const initial = await login(payload);
  let final = initial;

  if (initial.status === 'multipleLogin') {
    const accounts = Array.isArray(initial.data) ? initial.data : [];
    const selected = accounts.find(
      (account) =>
        String(account.society_id) === expectedSiteId && account.flat_no === target.accountUnit,
    );
    if (!selected) {
      throw new Error(`${target.label}: expected site/unit account was not offered`);
    }
    final = await login({ ...payload, user_id: selected.user_id });
  }

  if (final.status !== 'success' || Array.isArray(final.data) || !final.data) {
    throw new Error(`${target.label}: credential login was rejected`);
  }
  const resolved = resolvedSiteAndUnit(final.data);
  if (resolved.siteId !== expectedSiteId || resolved.accountUnit !== target.accountUnit) {
    throw new Error(`${target.label}: login resolved to an unexpected site or unit`);
  }
  console.log(`PASS ${target.label}: site ${expectedSiteId} account resolved.`);
}

const runtime = loadRuntimeConfig(undefined, { requireAppFile: false });
if (
  runtime.app.target !== 'resident' ||
  runtime.appEnvironment !== 'production' ||
  runtime.testLane !== 'production-regression' ||
  !runtime.productionTestAccountConfirmed ||
  !runtime.productionCredentialLoginConfirmed
) {
  throw new Error(
    'Resident account preflight requires the confirmed production-regression Resident lane',
  );
}

const expectedSiteId = requireResidentFixture(runtime, 'siteId');
const newAccount = requireResidentCredentials(runtime, 'new');
const legacyAccount = requireResidentCredentials(runtime, 'legacy');
if (!newAccount.accountUnit || !legacyAccount.accountUnit) {
  throw new Error('Resident account preflight requires explicit new and legacy account units');
}
if (runtime.residentLegacyFamilyAccounts.length === 0) {
  throw new Error('Resident account preflight requires verified legacy family-account inventory');
}

await verifyAccount({ label: 'new-resident', ...newAccount } as AccountTarget, expectedSiteId);
await verifyAccount(
  { label: 'legacy-resident', ...legacyAccount } as AccountTarget,
  expectedSiteId,
);
for (const account of runtime.residentLegacyFamilyAccounts) {
  await verifyAccount({ ...account, label: `legacy-family-${account.label}` }, expectedSiteId);
}

console.log('PASS Resident A/B and legacy family account preflight completed without mutations.');
