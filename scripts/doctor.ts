import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import {
  assertInstalledApp,
  assertSafeApk,
  assertSelectedDevice,
  resolveAapt,
  resolveAdb,
  resolveAndroidSdk,
} from '../src/config/android-tools.js';
import { loadRuntimeConfig } from '../src/config/runtime.js';

function checkCommand(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true });
  return result.status === 0;
}

const checks: Array<[string, () => void]> = [
  [
    'Node 24',
    () => {
      if (Number(process.versions.node.split('.')[0]) !== 24) throw new Error(process.version);
    },
  ],
  [
    'Java',
    () => {
      if (!checkCommand('java', ['-version'])) throw new Error('java not available');
    },
  ],
  [
    'Android SDK',
    () => {
      resolveAndroidSdk();
    },
  ],
  [
    'ADB',
    () => {
      resolveAdb();
    },
  ],
  [
    'aapt',
    () => {
      resolveAapt();
    },
  ],
  [
    'Appium',
    () => {
      const appium = resolve('node_modules', 'appium', 'index.js');
      if (!checkCommand(process.execPath, [appium, '--version'])) throw new Error('run npm ci');
    },
  ],
  [
    'UiAutomator2 8.5.0',
    () => {
      const appium = resolve('node_modules', 'appium', 'index.js');
      const result = spawnSync(
        process.execPath,
        [appium, 'driver', 'list', '--installed', '--json'],
        {
          env: { ...process.env, APPIUM_HOME: resolve('.appium') },
          encoding: 'utf8',
          windowsHide: true,
        },
      );
      if (
        result.status !== 0 ||
        !result.stdout.includes('uiautomator2') ||
        !result.stdout.includes('8.5.0')
      ) {
        throw new Error('run npm run appium:setup');
      }
    },
  ],
];

let failed = false;
for (const [name, check] of checks) {
  try {
    check();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${name}: ${String(error)}`);
  }
}

if (process.env.ANDROID_UDID) {
  try {
    const runtime = loadRuntimeConfig();
    assertSafeApk(runtime);
    assertSelectedDevice(runtime);
    assertInstalledApp(runtime);
    console.log(
      `PASS selected ${runtime.deviceTarget}, ${runtime.appSource}, and ${runtime.packageName}`,
    );
  } catch (error) {
    failed = true;
    console.error(`FAIL runtime selection: ${String(error)}`);
  }
} else {
  console.log('INFO Set ANDROID_UDID for strict app/device checks.');
}

if (failed) process.exit(1);
