import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  assertExpectedInstalledVersion,
  assertInstalledApp,
  assertSafeApk,
  assertSelectedDevice,
} from './src/config/android-tools.js';
import {
  loadRuntimeConfig,
  requireResidentCaseFixtures,
  requireResidentRegressionSelection,
} from './src/config/runtime.js';
import {
  captureFailureArtifacts,
  captureProductionFailureScreenshot,
  failureArtifactPolicy,
} from './src/reporting/artifacts.js';

const runtime = loadRuntimeConfig();
process.env.APPIUM_HOME = resolve('.appium');

if (runtime.appSource === 'installed' && runtime.appEnvironment === 'production') {
  assertExpectedInstalledVersion(runtime);
}

const residentSelection =
  runtime.app.target === 'resident' && runtime.testLane === 'production-regression'
    ? requireResidentRegressionSelection(runtime)
    : undefined;
if (residentSelection) requireResidentCaseFixtures(runtime, residentSelection.sourceCaseId);

const productionRegressionSpecs = runtime.runHardwareTests
  ? [`./tests/${runtime.app.target}/production-regression/hardware/**/*.spec.ts`]
  : [`./tests/${runtime.app.target}/production-regression/**/*.spec.ts`];

const specsByLane = {
  smoke: [`./tests/${runtime.app.target}/smoke/**/*.spec.ts`],
  regression: [`./tests/${runtime.app.target}/regression/**/*.spec.ts`],
  hardware: [`./tests/${runtime.app.target}/hardware/**/*.spec.ts`],
  'production-smoke': [`./tests/${runtime.app.target}/production-smoke/**/*.spec.ts`],
  'production-regression': productionRegressionSpecs,
};

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: specsByLane[runtime.testLane],
  exclude:
    runtime.testLane === 'production-regression' && !runtime.runHardwareTests
      ? [`./tests/${runtime.app.target}/production-regression/hardware/**/*.spec.ts`]
      : [],
  maxInstances: 1,
  logLevel: runtime.appEnvironment === 'production' ? 'error' : 'info',
  bail: 0,
  waitforTimeout: 15_000,
  connectionRetryTimeout: 180_000,
  connectionRetryCount: 1,
  framework: 'mocha',
  reporters: [
    'spec',
    [
      'junit',
      {
        outputDir: './artifacts/junit',
        outputFileFormat: ({ cid }) => `results-${cid}.xml`,
      },
    ],
    [
      'allure',
      {
        outputDir: './artifacts/allure-results',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
      },
    ],
  ],
  services: [
    [
      'appium',
      {
        logPath: './artifacts/appium',
        appiumStartTimeout: 60_000,
        args: {
          address: '127.0.0.1',
          port: 4723,
          basePath: '/',
          ...(runtime.appEnvironment === 'production' ? { logLevel: 'info:error' } : {}),
        },
      },
    ],
  ],
  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:udid': runtime.androidUdid,
      'appium:deviceName': runtime.androidUdid,
      ...(runtime.appSource === 'apk' ? { 'appium:app': runtime.appPath } : {}),
      'appium:appPackage': runtime.packageName,
      'appium:appActivity': runtime.app.activityName,
      'appium:appWaitActivity': '*',
      'appium:autoGrantPermissions': runtime.deviceTarget === 'emulator',
      'appium:noReset': runtime.resetMode === 'retain',
      'appium:fullReset': false,
      'appium:newCommandTimeout': 180,
    },
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 900_000,
    ...(residentSelection
      ? {
          grep: `\\[${residentSelection.sourceCaseId}\\].*\\[${residentSelection.accountCohort}-account\\]`,
        }
      : {}),
  },
  onPrepare() {
    mkdirSync(resolve('artifacts'), { recursive: true });
    assertSafeApk(runtime);
    assertSelectedDevice(runtime);
    assertInstalledApp(runtime);
  },
  async before() {
    await browser.setTimeout({ implicit: 0 });
  },
  async afterTest(test, _context, result) {
    if (result.passed) return;
    if (failureArtifactPolicy(runtime.appEnvironment) === 'screenshot-only') {
      await captureProductionFailureScreenshot(test.title);
      return;
    }
    await captureFailureArtifacts(runtime, test.title);
  },
};
