import 'dotenv/config';

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

import { APP_PROFILES, type AppProfile } from './apps.js';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const optionalTrimmedString = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

const residentFamilyAccountSchema = z.object({
  label: z.string().trim().min(1),
  username: z.string().trim().min(1),
  password: z.string().min(1),
  accountUnit: z.string().trim().min(1),
});

export const RESIDENT_LIVE_SOURCE_CASES = [
  'ISM_SK002',
  'ISM_SK007',
  'ISM_SK011',
  'ISM_SK012',
] as const;
export type ResidentLiveSourceCase = (typeof RESIDENT_LIVE_SOURCE_CASES)[number];

const runtimeSchema = z.object({
  APP_TARGET: z.enum(['resident', 'technician']).default('resident'),
  APP_ENV: z.enum(['test', 'production']).default('test'),
  DEVICE_TARGET: z.enum(['emulator', 'physical']).default('emulator'),
  ANDROID_UDID: z.string().trim().min(1).default('emulator-5554'),
  IOS_UDID: optionalTrimmedString,
  IOS_PHYSICAL_UDID: optionalTrimmedString,
  APP_SOURCE: z.enum(['installed', 'apk']).default('installed'),
  APP_PATH: z.string().trim().optional(),
  PLAYSTORE_BETA_CONFIRMED: booleanString,
  APP_EXPECTED_PLAYSTORE_VERSION_CODE: z.coerce.number().int().positive().optional(),
  PRODUCTION_SMOKE_CONFIRMED: booleanString,
  PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED: booleanString,
  PRODUCTION_TEST_ACCOUNT_CONFIRMED: booleanString,
  TEST_API_BASE_URL: z.url().default('https://test.isocietymanager.com'),
  RESET_MODE: z.enum(['clean', 'retain']).default('clean'),
  TEST_LANE: z
    .enum(['smoke', 'regression', 'hardware', 'production-smoke', 'production-regression'])
    .default('smoke'),
  RUN_HARDWARE_TESTS: booleanString,
  ALLOW_MUTATIONS: booleanString,
  AVD_NAME: z.string().trim().min(1).default('Pixel_9_Pro'),
  RESIDENT_USERNAME: z.string().optional(),
  RESIDENT_PASSWORD: z.string().optional(),
  RESIDENT_ACCOUNT_UNIT: optionalTrimmedString,
  RESIDENT_LEGACY_USERNAME: z.string().optional(),
  RESIDENT_LEGACY_PASSWORD: z.string().optional(),
  RESIDENT_LEGACY_ACCOUNT_UNIT: optionalTrimmedString,
  RESIDENT_LEGACY_FAMILY_ACCOUNTS_JSON: optionalTrimmedString,
  RESIDENT_SOURCE_CASE: z.enum(RESIDENT_LIVE_SOURCE_CASES).optional(),
  RESIDENT_ACCOUNT_COHORT: z.enum(['new', 'legacy']).optional(),
  TECHNICIAN_USERNAME: z.string().optional(),
  TECHNICIAN_PASSWORD: z.string().optional(),
  INVALID_LOGIN_IDENTITY: z.string().default('appium.invalid@example.invalid'),
  TECHNICIAN_QR_PAYLOAD: z.string().optional(),
  TECHNICIAN_QR_EXPECTED_SEQUENCE: optionalTrimmedString,
  RESIDENT_TEST_GUEST_MOBILE: optionalTrimmedString,
  RESIDENT_TEST_CONTACT_MOBILE: optionalTrimmedString,
  RESIDENT_TEST_CONTACT_EMAIL: optionalTrimmedString,
  RESIDENT_TEST_FAMILY_MOBILE: optionalTrimmedString,
  RESIDENT_TEST_FAMILY_EMAIL: optionalTrimmedString,
  RESIDENT_TEST_COMPLAINT_CATEGORY: optionalTrimmedString,
  RESIDENT_TEST_COMPLAINT_SUBCATEGORY: optionalTrimmedString,
  RESIDENT_TEST_SITE_ID: optionalTrimmedString,
  RESIDENT_TEST_COMPLAINT_AREA_TYPE: z.enum(['unit', 'common']).optional(),
  RESIDENT_TEST_COMPLAINT_LOCATION: optionalTrimmedString,
});

export interface ResidentFixtures {
  contactMobile?: string;
  contactEmail?: string;
  guestMobile?: string;
  familyMobile?: string;
  familyEmail?: string;
  complaintCategory?: string;
  complaintSubcategory?: string;
  siteId?: string;
  complaintAreaType?: 'unit' | 'common';
  complaintLocation?: string;
}

export const RESIDENT_REGRESSION_COHORTS = ['new', 'legacy'] as const;
export type ResidentAccountCohort = (typeof RESIDENT_REGRESSION_COHORTS)[number];

export interface AccountCredentials {
  username?: string;
  password?: string;
  accountUnit?: string;
}

export interface ResidentFamilyAccount extends Required<AccountCredentials> {
  label: string;
}

export interface RuntimeConfig {
  app: AppProfile;
  appSource: 'installed' | 'apk';
  appPath?: string;
  expectedPlayStoreVersionCode?: number;
  packageName: string;
  appEnvironment: 'test' | 'production';
  deviceTarget: 'emulator' | 'physical';
  androidUdid: string;
  iosUdid?: string;
  iosPhysicalUdid?: string;
  testApiBaseUrl: string;
  resetMode: 'clean' | 'retain';
  testLane: 'smoke' | 'regression' | 'hardware' | 'production-smoke' | 'production-regression';
  runHardwareTests: boolean;
  allowMutations: boolean;
  productionCredentialLoginConfirmed: boolean;
  productionTestAccountConfirmed: boolean;
  avdName: string;
  credentials: AccountCredentials;
  residentAccounts: Record<ResidentAccountCohort, AccountCredentials>;
  residentLegacyFamilyAccounts: ResidentFamilyAccount[];
  residentSourceCase?: ResidentLiveSourceCase;
  residentAccountCohort?: ResidentAccountCohort;
  invalidLoginIdentity: string;
  technicianQrPayload?: string;
  technicianQrExpectedSequence?: string;
  residentFixtures: ResidentFixtures;
}

export function loadRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
  options: { requireAppFile?: boolean } = { requireAppFile: true },
): RuntimeConfig {
  const parsed = runtimeSchema.parse(environment);
  const app = APP_PROFILES[parsed.APP_TARGET];
  const appPath = parsed.APP_PATH ? resolve(parsed.APP_PATH) : undefined;
  const testUrl = new URL(parsed.TEST_API_BASE_URL);
  const residentLegacyFamilyAccounts = parseResidentFamilyAccounts(
    parsed.RESIDENT_LEGACY_FAMILY_ACCOUNTS_JSON,
  );

  if (parsed.APP_ENV === 'test' && testUrl.hostname !== 'test.isocietymanager.com') {
    throw new Error(`Refusing non-test API host: ${testUrl.hostname}`);
  }
  if (
    parsed.ALLOW_MUTATIONS &&
    (parsed.APP_ENV !== 'production' ||
      parsed.TEST_LANE !== 'production-regression' ||
      !parsed.PRODUCTION_TEST_ACCOUNT_CONFIRMED)
  ) {
    throw new Error(
      'Mutation runs require APP_ENV=production, TEST_LANE=production-regression, and PRODUCTION_TEST_ACCOUNT_CONFIRMED=true',
    );
  }
  if (
    parsed.APP_ENV === 'test' &&
    parsed.APP_SOURCE === 'installed' &&
    !parsed.PLAYSTORE_BETA_CONFIRMED
  ) {
    throw new Error(
      'Installed-app runs require PLAYSTORE_BETA_CONFIRMED=true; production Play Store builds are forbidden',
    );
  }
  if (parsed.APP_ENV === 'production') {
    if (!parsed.PRODUCTION_SMOKE_CONFIRMED) {
      throw new Error('Production runs require PRODUCTION_SMOKE_CONFIRMED=true');
    }
    const productionLane =
      parsed.TEST_LANE === 'production-smoke' || parsed.TEST_LANE === 'production-regression';
    if (parsed.APP_SOURCE !== 'installed' || !productionLane || parsed.RESET_MODE !== 'retain') {
      throw new Error(
        'Production runs require APP_SOURCE=installed, a production test lane, and RESET_MODE=retain',
      );
    }
    if (parsed.TEST_LANE === 'production-smoke' && parsed.ALLOW_MUTATIONS) {
      throw new Error('The production-smoke lane does not allow mutations');
    }
    if (
      parsed.TEST_LANE === 'production-regression' &&
      (!parsed.ALLOW_MUTATIONS ||
        !parsed.PRODUCTION_TEST_ACCOUNT_CONFIRMED ||
        !parsed.PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED)
    ) {
      throw new Error(
        'Production regression requires ALLOW_MUTATIONS=true, PRODUCTION_TEST_ACCOUNT_CONFIRMED=true, and PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED=true',
      );
    }
    if (
      parsed.RUN_HARDWARE_TESTS &&
      (parsed.TEST_LANE !== 'production-regression' || parsed.DEVICE_TARGET !== 'physical')
    ) {
      throw new Error(
        'Production hardware regression requires TEST_LANE=production-regression and DEVICE_TARGET=physical',
      );
    }
  }
  if (
    parsed.APP_SOURCE === 'apk' &&
    options.requireAppFile !== false &&
    (!appPath || !existsSync(appPath) || !appPath.endsWith('.apk'))
  ) {
    throw new Error(`APP_PATH must identify an existing APK: ${appPath ?? '<unset>'}`);
  }
  if (parsed.TEST_LANE === 'hardware') {
    if (parsed.DEVICE_TARGET !== 'physical' || !parsed.RUN_HARDWARE_TESTS) {
      throw new Error('Hardware tests require DEVICE_TARGET=physical and RUN_HARDWARE_TESTS=true');
    }
  }

  return {
    app,
    appSource: parsed.APP_SOURCE,
    appPath,
    expectedPlayStoreVersionCode: parsed.APP_EXPECTED_PLAYSTORE_VERSION_CODE,
    packageName: parsed.APP_SOURCE === 'installed' ? app.installedPackageName : app.e2ePackageName,
    appEnvironment: parsed.APP_ENV,
    deviceTarget: parsed.DEVICE_TARGET,
    androidUdid: parsed.ANDROID_UDID,
    iosUdid: parsed.IOS_UDID,
    iosPhysicalUdid: parsed.IOS_PHYSICAL_UDID,
    testApiBaseUrl: parsed.TEST_API_BASE_URL,
    resetMode: parsed.RESET_MODE,
    testLane: parsed.TEST_LANE,
    runHardwareTests: parsed.RUN_HARDWARE_TESTS,
    allowMutations: parsed.ALLOW_MUTATIONS,
    productionCredentialLoginConfirmed: parsed.PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED,
    productionTestAccountConfirmed: parsed.PRODUCTION_TEST_ACCOUNT_CONFIRMED,
    avdName: parsed.AVD_NAME,
    credentials: {
      username: parsed[app.usernameVariable],
      password: parsed[app.passwordVariable],
      accountUnit: app.target === 'resident' ? parsed.RESIDENT_ACCOUNT_UNIT : undefined,
    },
    residentAccounts: {
      new: {
        username: parsed.RESIDENT_USERNAME,
        password: parsed.RESIDENT_PASSWORD,
        accountUnit: parsed.RESIDENT_ACCOUNT_UNIT,
      },
      legacy: {
        username: parsed.RESIDENT_LEGACY_USERNAME,
        password: parsed.RESIDENT_LEGACY_PASSWORD,
        accountUnit: parsed.RESIDENT_LEGACY_ACCOUNT_UNIT,
      },
    },
    residentLegacyFamilyAccounts,
    residentSourceCase: parsed.RESIDENT_SOURCE_CASE,
    residentAccountCohort: parsed.RESIDENT_ACCOUNT_COHORT,
    invalidLoginIdentity: parsed.INVALID_LOGIN_IDENTITY,
    technicianQrPayload: parsed.TECHNICIAN_QR_PAYLOAD,
    technicianQrExpectedSequence: parsed.TECHNICIAN_QR_EXPECTED_SEQUENCE,
    residentFixtures: {
      contactMobile: parsed.RESIDENT_TEST_CONTACT_MOBILE,
      contactEmail: parsed.RESIDENT_TEST_CONTACT_EMAIL,
      guestMobile: parsed.RESIDENT_TEST_GUEST_MOBILE,
      familyMobile: parsed.RESIDENT_TEST_FAMILY_MOBILE,
      familyEmail: parsed.RESIDENT_TEST_FAMILY_EMAIL,
      complaintCategory: parsed.RESIDENT_TEST_COMPLAINT_CATEGORY,
      complaintSubcategory: parsed.RESIDENT_TEST_COMPLAINT_SUBCATEGORY,
      siteId: parsed.RESIDENT_TEST_SITE_ID,
      complaintAreaType: parsed.RESIDENT_TEST_COMPLAINT_AREA_TYPE,
      complaintLocation: parsed.RESIDENT_TEST_COMPLAINT_LOCATION,
    },
  };
}

export function parseResidentFamilyAccounts(value?: string): ResidentFamilyAccount[] {
  if (!value) return [];
  let decoded: unknown;
  try {
    decoded = JSON.parse(value);
  } catch {
    throw new Error('RESIDENT_LEGACY_FAMILY_ACCOUNTS_JSON must be valid JSON');
  }
  const parsed = z.array(residentFamilyAccountSchema).min(1).safeParse(decoded);
  if (!parsed.success) {
    throw new Error('RESIDENT_LEGACY_FAMILY_ACCOUNTS_JSON has an invalid account entry');
  }
  return parsed.data;
}

export function requireCredentials(config: RuntimeConfig): {
  username: string;
  password: string;
  accountUnit?: string;
} {
  const { username, password, accountUnit } = config.credentials;
  if (!username || !password) {
    throw new Error(
      `Missing ${config.app.usernameVariable}/${config.app.passwordVariable} for ${config.app.target}`,
    );
  }
  return { username, password, accountUnit };
}

export function requireResidentCredentials(
  config: RuntimeConfig,
  cohort: ResidentAccountCohort,
): { username: string; password: string; accountUnit?: string } {
  if (config.app.target !== 'resident') {
    throw new Error('Resident account cohorts require APP_TARGET=resident');
  }
  const { username, password, accountUnit } = config.residentAccounts[cohort];
  if (!username || !password) {
    const prefix = cohort === 'new' ? 'RESIDENT' : 'RESIDENT_LEGACY';
    throw new Error(`Missing ${prefix}_USERNAME/${prefix}_PASSWORD for ${cohort} cohort`);
  }
  return { username, password, accountUnit };
}

export function requireResidentFixture<K extends keyof ResidentFixtures>(
  config: RuntimeConfig,
  key: K,
): string {
  const value = config.residentFixtures[key];
  if (!value) {
    const environmentName = {
      guestMobile: 'RESIDENT_TEST_GUEST_MOBILE',
      contactMobile: 'RESIDENT_TEST_CONTACT_MOBILE',
      contactEmail: 'RESIDENT_TEST_CONTACT_EMAIL',
      familyMobile: 'RESIDENT_TEST_FAMILY_MOBILE',
      familyEmail: 'RESIDENT_TEST_FAMILY_EMAIL',
      complaintCategory: 'RESIDENT_TEST_COMPLAINT_CATEGORY',
      complaintSubcategory: 'RESIDENT_TEST_COMPLAINT_SUBCATEGORY',
      siteId: 'RESIDENT_TEST_SITE_ID',
      complaintAreaType: 'RESIDENT_TEST_COMPLAINT_AREA_TYPE',
      complaintLocation: 'RESIDENT_TEST_COMPLAINT_LOCATION',
    } satisfies Record<keyof ResidentFixtures, string>;
    throw new Error(`Missing ${environmentName[key]} for Resident production regression`);
  }
  return value;
}

export function requireResidentRegressionSelection(config: RuntimeConfig): {
  sourceCaseId: ResidentLiveSourceCase;
  accountCohort: ResidentAccountCohort;
} {
  if (config.app.target !== 'resident' || config.testLane !== 'production-regression') {
    throw new Error('Resident live selection requires the Resident production-regression lane');
  }
  if (!config.residentSourceCase || !config.residentAccountCohort) {
    throw new Error(
      'Resident production regression requires RESIDENT_SOURCE_CASE and RESIDENT_ACCOUNT_COHORT',
    );
  }
  return {
    sourceCaseId: config.residentSourceCase,
    accountCohort: config.residentAccountCohort,
  };
}

export function requireResidentCaseFixtures(
  config: RuntimeConfig,
  sourceCaseId: ResidentLiveSourceCase,
): void {
  if (sourceCaseId === 'ISM_SK002' || sourceCaseId === 'ISM_SK007') {
    const mobile = requireResidentFixture(config, 'contactMobile');
    if (!/^\d{10}$/.test(mobile)) {
      throw new Error('RESIDENT_TEST_CONTACT_MOBILE must contain exactly 10 digits');
    }
  }
  if (sourceCaseId === 'ISM_SK007') {
    requireResidentFixture(config, 'contactEmail');
  }
  if (sourceCaseId === 'ISM_SK012') {
    for (const key of [
      'complaintCategory',
      'complaintSubcategory',
      'siteId',
      'complaintAreaType',
    ] as const) {
      requireResidentFixture(config, key);
    }
    if (config.residentFixtures.complaintAreaType === 'common') {
      requireResidentFixture(config, 'complaintLocation');
    }
  }
}
