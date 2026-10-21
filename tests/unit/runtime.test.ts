import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadRuntimeConfig,
  parseResidentFamilyAccounts,
  requireResidentCaseFixtures,
  requireResidentCredentials,
  requireResidentFixture,
  requireResidentRegressionSelection,
  RESIDENT_REGRESSION_COHORTS,
} from '../../src/config/runtime.js';

const validEnvironment = {
  APP_TARGET: 'resident',
  APP_ENV: 'test',
  DEVICE_TARGET: 'emulator',
  ANDROID_UDID: 'emulator-5554',
  APP_SOURCE: 'installed',
  PLAYSTORE_BETA_CONFIRMED: 'true',
  PRODUCTION_SMOKE_CONFIRMED: 'false',
  PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED: 'false',
  PRODUCTION_TEST_ACCOUNT_CONFIRMED: 'false',
  TEST_API_BASE_URL: 'https://test.isocietymanager.com',
  ALLOW_MUTATIONS: 'false',
};

test('accepts an installed beta app with explicit confirmation', () => {
  const runtime = loadRuntimeConfig(validEnvironment, { requireAppFile: false });
  assert.equal(runtime.packageName, 'com.sumasamu.iSocietyManager');
  assert.equal(runtime.appSource, 'installed');
});

test('defaults Resident runs to the installed Google Play package', () => {
  const { APP_SOURCE: _appSource, ...environmentWithoutSource } = validEnvironment;
  const runtime = loadRuntimeConfig(environmentWithoutSource, { requireAppFile: false });
  assert.equal(runtime.app.target, 'resident');
  assert.equal(runtime.appSource, 'installed');
  assert.equal(runtime.packageName, 'com.sumasamu.iSocietyManager');
  assert.equal(runtime.appPath, undefined);
});

test('loads the approved Play Store version-code gate', () => {
  const runtime = loadRuntimeConfig(
    { ...validEnvironment, APP_EXPECTED_PLAYSTORE_VERSION_CODE: '485' },
    { requireAppFile: false },
  );
  assert.equal(runtime.expectedPlayStoreVersionCode, 485);
});

test('requires a single Resident source case and cohort for live regression', () => {
  const runtime = loadRuntimeConfig(
    {
      ...validEnvironment,
      APP_ENV: 'production',
      TEST_LANE: 'production-regression',
      RESET_MODE: 'retain',
      PRODUCTION_SMOKE_CONFIRMED: 'true',
      PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED: 'true',
      PRODUCTION_TEST_ACCOUNT_CONFIRMED: 'true',
      ALLOW_MUTATIONS: 'true',
    },
    { requireAppFile: false },
  );
  assert.throws(() => requireResidentRegressionSelection(runtime), /RESIDENT_SOURCE_CASE/);
});

test('selects exactly one Resident source case and account cohort', () => {
  const runtime = loadRuntimeConfig(
    {
      ...validEnvironment,
      APP_ENV: 'production',
      TEST_LANE: 'production-regression',
      RESET_MODE: 'retain',
      PRODUCTION_SMOKE_CONFIRMED: 'true',
      PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED: 'true',
      PRODUCTION_TEST_ACCOUNT_CONFIRMED: 'true',
      ALLOW_MUTATIONS: 'true',
      RESIDENT_SOURCE_CASE: 'ISM_SK011',
      RESIDENT_ACCOUNT_COHORT: 'legacy',
    },
    { requireAppFile: false },
  );
  assert.deepEqual(requireResidentRegressionSelection(runtime), {
    sourceCaseId: 'ISM_SK011',
    accountCohort: 'legacy',
  });
});

test('requires disposable contacts only for Resident cases that use them', () => {
  const withoutContact = loadRuntimeConfig(validEnvironment, { requireAppFile: false });
  assert.doesNotThrow(() => requireResidentCaseFixtures(withoutContact, 'ISM_SK011'));
  assert.throws(
    () => requireResidentCaseFixtures(withoutContact, 'ISM_SK002'),
    /RESIDENT_TEST_CONTACT_MOBILE/,
  );

  const withContact = loadRuntimeConfig(
    {
      ...validEnvironment,
      RESIDENT_TEST_CONTACT_MOBILE: '9999999999',
      RESIDENT_TEST_CONTACT_EMAIL: 'resident-test@example.invalid',
    },
    { requireAppFile: false },
  );
  assert.doesNotThrow(() => requireResidentCaseFixtures(withContact, 'ISM_SK002'));
  assert.doesNotThrow(() => requireResidentCaseFixtures(withContact, 'ISM_SK007'));
});

test('loads optional Resident fixture values without requiring them by default', () => {
  const runtime = loadRuntimeConfig(
    {
      ...validEnvironment,
      RESIDENT_TEST_GUEST_MOBILE: ' 9999999999 ',
      RESIDENT_TEST_COMPLAINT_CATEGORY: '',
      RESIDENT_TEST_SITE_ID: ' 670 ',
      RESIDENT_TEST_COMPLAINT_AREA_TYPE: 'common',
      RESIDENT_TEST_COMPLAINT_LOCATION: ' RECREATION ROOM ',
    },
    { requireAppFile: false },
  );
  assert.equal(runtime.residentFixtures.guestMobile, '9999999999');
  assert.equal(runtime.residentFixtures.complaintCategory, undefined);
  assert.equal(runtime.residentFixtures.siteId, '670');
  assert.equal(runtime.residentFixtures.complaintAreaType, 'common');
  assert.equal(runtime.residentFixtures.complaintLocation, 'RECREATION ROOM');
});

test('loads the controlled Technician QR expected work-order sequence', () => {
  const runtime = loadRuntimeConfig(
    { ...validEnvironment, TECHNICIAN_QR_EXPECTED_SEQUENCE: ' WO-12345 ' },
    { requireAppFile: false },
  );
  assert.equal(runtime.technicianQrExpectedSequence, 'WO-12345');
});

test('requires only the Resident fixture requested by a mutation test', () => {
  const runtime = loadRuntimeConfig(validEnvironment, { requireAppFile: false });
  assert.throws(
    () => requireResidentFixture(runtime, 'complaintCategory'),
    /RESIDENT_TEST_COMPLAINT_CATEGORY/,
  );
});

test('uses the new Resident account by default and exposes both regression cohorts', () => {
  const runtime = loadRuntimeConfig(
    {
      ...validEnvironment,
      RESIDENT_USERNAME: 'new@example.invalid',
      RESIDENT_PASSWORD: 'new-secret',
      RESIDENT_ACCOUNT_UNIT: 'NEW-001',
      RESIDENT_LEGACY_USERNAME: 'legacy@example.invalid',
      RESIDENT_LEGACY_PASSWORD: 'legacy-secret',
      RESIDENT_LEGACY_ACCOUNT_UNIT: 'OLD-001',
    },
    { requireAppFile: false },
  );
  assert.equal(runtime.credentials.username, 'new@example.invalid');
  assert.equal(runtime.credentials.accountUnit, 'NEW-001');
  assert.deepEqual(RESIDENT_REGRESSION_COHORTS, ['new', 'legacy']);
  assert.equal(requireResidentCredentials(runtime, 'new').username, 'new@example.invalid');
  assert.equal(requireResidentCredentials(runtime, 'legacy').username, 'legacy@example.invalid');
  assert.equal(requireResidentCredentials(runtime, 'new').accountUnit, 'NEW-001');
  assert.equal(requireResidentCredentials(runtime, 'legacy').accountUnit, 'OLD-001');
});

test('rejects a missing legacy Resident regression cohort', () => {
  const runtime = loadRuntimeConfig(validEnvironment, { requireAppFile: false });
  assert.throws(() => requireResidentCredentials(runtime, 'legacy'), /RESIDENT_LEGACY_USERNAME/);
});

test('parses verified legacy Resident family-account inventory', () => {
  const accounts = parseResidentFamilyAccounts(
    JSON.stringify([
      {
        label: 'sibling',
        username: 'family@example.invalid',
        password: 'secret',
        accountUnit: 'OLD-001',
      },
    ]),
  );
  assert.deepEqual(accounts, [
    {
      label: 'sibling',
      username: 'family@example.invalid',
      password: 'secret',
      accountUnit: 'OLD-001',
    },
  ]);
});

test('rejects malformed legacy Resident family-account inventory', () => {
  assert.throws(() => parseResidentFamilyAccounts('{not-json'), /must be valid JSON/);
  assert.throws(
    () => parseResidentFamilyAccounts(JSON.stringify([{ label: 'missing credentials' }])),
    /invalid account entry/,
  );
});

test('rejects an installed Play Store app without beta confirmation', () => {
  assert.throws(
    () =>
      loadRuntimeConfig(
        { ...validEnvironment, PLAYSTORE_BETA_CONFIRMED: 'false' },
        { requireAppFile: false },
      ),
    /PLAYSTORE_BETA_CONFIRMED/,
  );
});

test('selects the isolated E2E package for an APK run', () => {
  const runtime = loadRuntimeConfig(
    { ...validEnvironment, APP_SOURCE: 'apk', APP_PATH: 'resident.apk' },
    { requireAppFile: false },
  );
  assert.equal(runtime.packageName, 'com.sumasamu.iSocietyManager.e2e');
});

test('rejects a non-test API host', () => {
  assert.throws(
    () =>
      loadRuntimeConfig(
        { ...validEnvironment, TEST_API_BASE_URL: 'https://api.isocietymanager.com' },
        { requireAppFile: false },
      ),
    /Refusing non-test API host/,
  );
});

test('rejects mutation enablement outside the guarded production regression lane', () => {
  assert.throws(
    () =>
      loadRuntimeConfig(
        { ...validEnvironment, ALLOW_MUTATIONS: 'true' },
        { requireAppFile: false },
      ),
    /Mutation runs require/,
  );
});

test('requires physical selection for the hardware lane', () => {
  assert.throws(
    () =>
      loadRuntimeConfig(
        { ...validEnvironment, TEST_LANE: 'hardware', RUN_HARDWARE_TESTS: 'true' },
        { requireAppFile: false },
      ),
    /DEVICE_TARGET=physical/,
  );
});

test('accepts only the guarded installed production smoke lane', () => {
  const runtime = loadRuntimeConfig(
    {
      ...validEnvironment,
      APP_ENV: 'production',
      DEVICE_TARGET: 'physical',
      APP_SOURCE: 'installed',
      PLAYSTORE_BETA_CONFIRMED: 'false',
      PRODUCTION_SMOKE_CONFIRMED: 'true',
      PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED: 'false',
      TEST_LANE: 'production-smoke',
      RESET_MODE: 'retain',
      RUN_HARDWARE_TESTS: 'false',
    },
    { requireAppFile: false },
  );
  assert.equal(runtime.appEnvironment, 'production');
  assert.equal(runtime.testLane, 'production-smoke');
});

test('rejects production runs outside the guarded production smoke lane', () => {
  assert.throws(
    () =>
      loadRuntimeConfig(
        {
          ...validEnvironment,
          APP_ENV: 'production',
          PRODUCTION_SMOKE_CONFIRMED: 'true',
          TEST_LANE: 'smoke',
          RESET_MODE: 'retain',
        },
        { requireAppFile: false },
      ),
    /Production runs require APP_SOURCE=installed/,
  );
});

test('accepts the guarded production regression lane for an approved test account', () => {
  const runtime = loadRuntimeConfig(
    {
      ...validEnvironment,
      APP_TARGET: 'technician',
      APP_ENV: 'production',
      DEVICE_TARGET: 'physical',
      APP_SOURCE: 'installed',
      PLAYSTORE_BETA_CONFIRMED: 'false',
      PRODUCTION_SMOKE_CONFIRMED: 'true',
      PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED: 'true',
      PRODUCTION_TEST_ACCOUNT_CONFIRMED: 'true',
      TEST_LANE: 'production-regression',
      RESET_MODE: 'retain',
      RUN_HARDWARE_TESTS: 'false',
      ALLOW_MUTATIONS: 'true',
    },
    { requireAppFile: false },
  );
  assert.equal(runtime.testLane, 'production-regression');
  assert.equal(runtime.allowMutations, true);
  assert.equal(runtime.productionTestAccountConfirmed, true);
});

test('accepts the production regression lane on a selected Android Studio emulator', () => {
  const runtime = loadRuntimeConfig(
    {
      ...validEnvironment,
      APP_TARGET: 'technician',
      APP_ENV: 'production',
      DEVICE_TARGET: 'emulator',
      ANDROID_UDID: 'emulator-5554',
      APP_SOURCE: 'installed',
      PLAYSTORE_BETA_CONFIRMED: 'false',
      PRODUCTION_SMOKE_CONFIRMED: 'true',
      PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED: 'true',
      PRODUCTION_TEST_ACCOUNT_CONFIRMED: 'true',
      TEST_LANE: 'production-regression',
      RESET_MODE: 'retain',
      RUN_HARDWARE_TESTS: 'false',
      ALLOW_MUTATIONS: 'true',
    },
    { requireAppFile: false },
  );
  assert.equal(runtime.deviceTarget, 'emulator');
  assert.equal(runtime.androidUdid, 'emulator-5554');
});

test('accepts explicitly selected physical production hardware regression', () => {
  const runtime = loadRuntimeConfig(
    {
      ...validEnvironment,
      APP_ENV: 'production',
      DEVICE_TARGET: 'physical',
      ANDROID_UDID: 'approved-physical-device',
      APP_SOURCE: 'installed',
      PLAYSTORE_BETA_CONFIRMED: 'false',
      PRODUCTION_SMOKE_CONFIRMED: 'true',
      PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED: 'true',
      PRODUCTION_TEST_ACCOUNT_CONFIRMED: 'true',
      TEST_LANE: 'production-regression',
      RESET_MODE: 'retain',
      RUN_HARDWARE_TESTS: 'true',
      ALLOW_MUTATIONS: 'true',
    },
    { requireAppFile: false },
  );
  assert.equal(runtime.runHardwareTests, true);
  assert.equal(runtime.deviceTarget, 'physical');
});

test('rejects production hardware regression on an emulator', () => {
  assert.throws(
    () =>
      loadRuntimeConfig(
        {
          ...validEnvironment,
          APP_ENV: 'production',
          APP_SOURCE: 'installed',
          PLAYSTORE_BETA_CONFIRMED: 'false',
          PRODUCTION_SMOKE_CONFIRMED: 'true',
          PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED: 'true',
          PRODUCTION_TEST_ACCOUNT_CONFIRMED: 'true',
          TEST_LANE: 'production-regression',
          RESET_MODE: 'retain',
          RUN_HARDWARE_TESTS: 'true',
          ALLOW_MUTATIONS: 'true',
        },
        { requireAppFile: false },
      ),
    /DEVICE_TARGET=physical/,
  );
});

test('rejects production regression without explicit test-account confirmation', () => {
  assert.throws(
    () =>
      loadRuntimeConfig(
        {
          ...validEnvironment,
          APP_TARGET: 'technician',
          APP_ENV: 'production',
          DEVICE_TARGET: 'physical',
          APP_SOURCE: 'installed',
          PRODUCTION_SMOKE_CONFIRMED: 'true',
          PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED: 'true',
          TEST_LANE: 'production-regression',
          RESET_MODE: 'retain',
          ALLOW_MUTATIONS: 'true',
        },
        { requireAppFile: false },
      ),
    /PRODUCTION_TEST_ACCOUNT_CONFIRMED=true/,
  );
});
