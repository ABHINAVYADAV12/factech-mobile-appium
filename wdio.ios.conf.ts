import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { browser } from '@wdio/globals';

import { ReportingLabsWdioReporter as ReportingLabsReporter, reportingLabsComplete } from 'reporting-labs/wdio';

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
// Xcode 27's `devicectl list devices` also reports booted simulators, and the
// XCUITest driver then treats the simulator UDID as a real device. Only prefer
// devicectl discovery for physical-device runs.
if (process.env.DEVICE_TARGET === 'physical') {
  process.env.APPIUM_XCUITEST_PREFER_DEVICECTL = process.env.APPIUM_XCUITEST_PREFER_DEVICECTL || 'true';
} else {
  delete process.env.APPIUM_XCUITEST_PREFER_DEVICECTL;
}

const residentSelection =
  runtime.app.target === 'resident' &&
  runtime.testLane === 'production-regression'
    ? requireResidentRegressionSelection(runtime)
    : undefined;

if (residentSelection) {
  requireResidentCaseFixtures(runtime, residentSelection.sourceCaseId);
}

const reportingLabsOptions = {
  outputFolder: './artifacts/reporting-labs',
  title: 'Factech iOS Appium Test Report',
  screenshot: 'on-failure' as const,
};

export const config: WebdriverIO.Config = {
  runner: 'local',

  specs: ['./tests/ios/**/*.spec.ts'],
  exclude:
    process.env.DEVICE_TARGET === 'physical'
      ? []
      : ['./tests/ios/**/physical/**/*.spec.ts'],

  maxInstances: 1,

  logLevel:
    runtime.appEnvironment === 'production' ? 'error' : 'info',

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
    [ReportingLabsReporter, reportingLabsOptions],
  ],

  services: [
    [
      'appium',
      {
        logPath: './artifacts/appium',
        appiumStartTimeout: 60_000,
        args: {
          address: process.env.APPIUM_HOST || '127.0.0.1',
          port: Number(process.env.APPIUM_PORT) || 4723,
          basePath: '/',
          ...(runtime.appEnvironment === 'production'
            ? { logLevel: 'info:error' }
            : {}),
        },
      },
    ],
  ],

  capabilities: [
    process.env.DEVICE_TARGET === 'physical'
      ? {
          platformName: 'iOS',
          'appium:automationName': 'XCUITest',
          'appium:udid':
            process.env.IOS_PHYSICAL_UDID ||
            process.env.IOS_UDID,
          'appium:deviceName': process.env.IOS_DEVICE_NAME ,
          'appium:bundleId':
            process.env.IOS_BUNDLE_ID ||
            (runtime.app.target === 'resident'
              ? 'com.sumasamu.iSocietyManager'
              : 'com.sumasamu.isocietyManagerAdmin'),
          'appium:xcodeOrgId': process.env.IOS_XCODE_ORG_ID,
          'appium:xcodeSigningId':
            process.env.IOS_XCODE_SIGNING_ID,
          'appium:updatedWDABundleId':
            process.env.IOS_WDA_BUNDLE_ID,
          'appium:noReset': true,
          'appium:newCommandTimeout': 240,
          'appium:wdaLaunchTimeout': 120_000,
          'appium:wdaStartupRetries': 4,
        }
      : {
          platformName: 'iOS',
          'appium:automationName': 'XCUITest',
          'appium:udid':
            process.env.IOS_UDID,
          'appium:deviceName':
            process.env.IOS_DEVICE_NAME,
          'appium:platformVersion':
            process.env.IOS_PLATFORM_VERSION,
          'appium:bundleId':
            process.env.IOS_BUNDLE_ID ||
            (runtime.app.target === 'resident'
              ? 'com.sumasamu.iSocietyManager'
              : 'com.sumasamu.isocietyManagerAdmin'),
          'appium:noReset': false,
          'appium:newCommandTimeout': 180,
        },
  ],

  mochaOpts: {
    ui: 'bdd',
    timeout: 900_000,
  },

  onPrepare() {
    mkdirSync(resolve('artifacts'), { recursive: true });
  },

  async before() {
    await browser.setTimeout({ implicit: 0 });
  },

  async afterTest(test, _context, result) {
    if (result.passed) return;

    if (
      failureArtifactPolicy(runtime.appEnvironment) ===
      'screenshot-only'
    ) {
      await captureProductionFailureScreenshot(test.title);
      return;
    }

    await captureFailureArtifacts(runtime, test.title);
  },

  async onComplete() {
    await reportingLabsComplete({
      ...reportingLabsOptions,
    });
  },
};
