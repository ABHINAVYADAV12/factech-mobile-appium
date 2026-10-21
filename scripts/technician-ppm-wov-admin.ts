import 'dotenv/config';

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type JsonRecord = Record<string, unknown>;
type PermissionMap = Record<string, number>;

interface AuthUser {
  apiToken: string;
  id: string;
  roleId: string;
  societyId: string;
  role: string;
}

interface PermissionGateState {
  version: 1;
  preparedAt: string;
  siteId: string;
  technicianRoleId: string;
  technicianIdentity: string;
  originalPermissions: PermissionMap;
}

const permissionModule = 'PPM_WOV';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for the PPM_WOV admin gate`);
  return value;
}

function asRecord(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} did not return an object`);
  }
  return value as JsonRecord;
}

function stringField(record: JsonRecord, names: string[], label: string): string {
  for (const name of names) {
    const value = record[name];
    if (typeof value === 'string' || typeof value === 'number') return String(value);
  }
  throw new Error(`${label} is missing ${names.join('/')}`);
}

function normalizePermissions(value: unknown): PermissionMap {
  const record = asRecord(value ?? {}, 'Role permissions');
  return Object.fromEntries(
    Object.entries(record)
      .filter(([, enabled]) => enabled === 1 || enabled === true || enabled === '1')
      .map(([key]) => [key, 1]),
  );
}

function samePermissions(left: PermissionMap, right: PermissionMap): boolean {
  const leftEntries = Object.entries(left).sort(([a], [b]) => a.localeCompare(b));
  const rightEntries = Object.entries(right).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(leftEntries) === JSON.stringify(rightEntries);
}

export function setModuleRead(permissions: PermissionMap, enabled: boolean): PermissionMap {
  const next = { ...permissions };
  const rights = new Set<string>();
  for (const key of Object.keys(next)) {
    const [module, configuredRights = ''] = key.split('.', 2);
    if (module !== permissionModule) continue;
    delete next[key];
    for (const right of configuredRights) rights.add(right);
  }
  if (enabled) rights.add('R');
  else rights.delete('R');
  const orderedRights = ['R', 'C', 'U', 'D'].filter((right) => rights.has(right)).join('');
  if (orderedRights) next[`${permissionModule}.${orderedRights}`] = 1;
  return next;
}

export function hasModuleRead(permissions: PermissionMap): boolean {
  return Object.keys(permissions).some((key) => {
    const [module, rights = ''] = key.split('.', 2);
    return module === permissionModule && rights.includes('R');
  });
}

function authHeaders(user: AuthUser): Record<string, string> {
  return {
    'content-type': 'application/json',
    'ism-auth': JSON.stringify({
      'api-token': user.apiToken,
      'user-id': user.id,
      'group-id': user.roleId,
      'site-id': user.societyId,
    }),
  };
}

class AdminApi {
  readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async json(path: string, init: RequestInit): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${path.replace(/^\/+/, '')}`, init);
    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`${init.method ?? 'GET'} ${path} returned non-JSON (${response.status})`);
    }
    if (!response.ok)
      throw new Error(`${init.method ?? 'GET'} ${path} failed (${response.status})`);
    const envelope =
      body && typeof body === 'object' && !Array.isArray(body) ? (body as JsonRecord) : undefined;
    if (String(envelope?.status ?? '').toLowerCase() === 'error') {
      throw new Error(`${init.method ?? 'GET'} ${path} returned an error envelope`);
    }
    return body;
  }

  async login(identity: string, password: string): Promise<AuthUser> {
    const body = asRecord(
      await this.json('login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identity, password, action: 'Login' }),
      }),
      'Login',
    );
    const data = asRecord(body.data ?? body, 'Login data');
    return {
      apiToken: stringField(data, ['api_token', 'apiToken'], 'Login data'),
      id: stringField(data, ['id', 'user_id'], 'Login data'),
      roleId: stringField(data, ['role_id', 'group_id'], 'Login data'),
      societyId: stringField(data, ['societyId', 'society_id'], 'Login data'),
      role: typeof data.role === 'string' ? data.role : '',
    };
  }

  async roles(admin: AuthUser): Promise<JsonRecord[]> {
    const body = await this.json('roles', { method: 'GET', headers: authHeaders(admin) });
    const value = Array.isArray(body) ? body : asRecord(body, 'Roles').data;
    if (!Array.isArray(value)) throw new Error('Roles response did not contain an array');
    return value.map((role) => asRecord(role, 'Role'));
  }

  async updatePermissions(
    admin: AuthUser,
    roleId: string,
    permissions: PermissionMap,
  ): Promise<void> {
    await this.json('updatePermissions', {
      method: 'POST',
      headers: authHeaders(admin),
      body: JSON.stringify({ id: roleId, permissions }),
    });
  }
}

function statePath(): string {
  return resolve(
    process.env.TECHNICIAN_ADMIN_PERMISSION_STATE_FILE?.trim() ||
      'artifacts/admin-gates/technician-ppm-wov.json',
  );
}

function findRole(roles: JsonRecord[], roleId: string): JsonRecord {
  const role = roles.find((candidate) => String(candidate.id ?? candidate.role_id) === roleId);
  if (!role) throw new Error(`Technician role ${roleId} was not returned by the admin account`);
  return role;
}

async function verifiedPermissions(
  api: AdminApi,
  admin: AuthUser,
  roleId: string,
): Promise<PermissionMap> {
  return normalizePermissions(findRole(await api.roles(admin), roleId).permissions);
}

async function applyAndVerify(
  api: AdminApi,
  admin: AuthUser,
  roleId: string,
  permissions: PermissionMap,
  expectedRead: boolean,
): Promise<void> {
  await api.updatePermissions(admin, roleId, permissions);
  const observed = await verifiedPermissions(api, admin, roleId);
  if (hasModuleRead(observed) !== expectedRead) {
    throw new Error(`Admin verification did not observe PPM_WOV.R=${expectedRead}`);
  }
}

async function prepare(): Promise<void> {
  if (process.env.TECHNICIAN_ADMIN_PERMISSION_MUTATION_CONFIRMED !== 'true') {
    throw new Error('TECHNICIAN_ADMIN_PERMISSION_MUTATION_CONFIRMED=true is required');
  }
  const api = new AdminApi(required('ISM_API_BASE_URL'));
  const admin = await api.login(required('ADMIN_USER'), required('ADMIN_PASSWORD'));
  if (admin.role && admin.role !== 'admin' && admin.role !== 'superadmin') {
    throw new Error(`ADMIN_USER logged in as '${admin.role}', not an admin role`);
  }
  const technicianIdentity = required('TECHNICIAN_USERNAME');
  const technician = await api.login(technicianIdentity, required('TECHNICIAN_PASSWORD'));
  if (admin.societyId !== technician.societyId) {
    throw new Error('Admin and Technician credentials do not belong to the same site');
  }

  const originalPermissions = await verifiedPermissions(api, admin, technician.roleId);
  const state: PermissionGateState = {
    version: 1,
    preparedAt: new Date().toISOString(),
    siteId: technician.societyId,
    technicianRoleId: technician.roleId,
    technicianIdentity,
    originalPermissions,
  };
  const file = statePath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2), { flag: 'wx' });

  try {
    await applyAndVerify(
      api,
      admin,
      technician.roleId,
      setModuleRead(originalPermissions, true),
      true,
    );
    console.log('Verified PPM_WOV.R=ON through the admin API.');
    await applyAndVerify(
      api,
      admin,
      technician.roleId,
      setModuleRead(originalPermissions, false),
      false,
    );
    console.log('Verified PPM_WOV.R=OFF; Technician smoke will use QR routing.');
  } catch (error) {
    await api
      .updatePermissions(admin, technician.roleId, originalPermissions)
      .catch(() => undefined);
    throw error;
  }
}

async function restore(): Promise<void> {
  const file = statePath();
  if (!existsSync(file)) return;
  const state = asRecord(JSON.parse(readFileSync(file, 'utf8')), 'Permission gate state');
  if (state.version !== 1) throw new Error('Unsupported permission gate state version');
  const originalPermissions = normalizePermissions(state.originalPermissions);
  const roleId = stringField(state, ['technicianRoleId'], 'Permission gate state');
  const api = new AdminApi(required('ISM_API_BASE_URL'));
  const admin = await api.login(required('ADMIN_USER'), required('ADMIN_PASSWORD'));
  if (admin.societyId !== String(state.siteId)) {
    throw new Error('Restore admin site does not match the saved permission state');
  }
  await api.updatePermissions(admin, roleId, originalPermissions);
  const observed = await verifiedPermissions(api, admin, roleId);
  if (!samePermissions(observed, originalPermissions)) {
    throw new Error('The original Technician role permission map was not restored exactly');
  }
  const restoredStamp = new Date().toISOString().replace(/[:.]/g, '-');
  renameSync(file, `${file}.restored-${restoredStamp}.json`);
  console.log(
    `Restored the original PPM_WOV state (${hasModuleRead(originalPermissions) ? 'ON' : 'OFF'}).`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const mode = process.argv[2];
  if (mode === 'prepare') await prepare();
  else if (mode === 'restore') await restore();
  else throw new Error('Usage: technician-ppm-wov-admin.ts <prepare|restore>');
}
