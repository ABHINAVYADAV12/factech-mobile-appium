import { spawnSync } from 'node:child_process';

import {
  assertExpectedInstalledVersion,
  assertSelectedDevice,
  resolveAdb,
} from '../src/config/android-tools.js';
import {
  findPlayStoreAction,
  playStoreNeedsUserSignIn,
  type PlayStoreAction,
} from '../src/config/play-store-ui.js';
import { loadRuntimeConfig } from '../src/config/runtime.js';

const runtime = loadRuntimeConfig(undefined, { requireAppFile: false });
const adbPath = resolveAdb();

function assertExpectedVersion(): { versionName: string; versionCode: string } {
  try {
    return assertExpectedInstalledVersion(runtime);
  } catch (error) {
    throw new Error(
      `${String(error)}; the selected Play Store account/track has not received the required release`,
    );
  }
}

function adb(args: string[], allowFailure = false): string {
  const result = spawnSync(adbPath, ['-s', runtime.androidUdid, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 60_000,
  });
  if (!allowFailure && result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `ADB exited ${result.status}`).trim());
  }
  return (result.stdout || '').trim();
}

function packageInstalled(packageName: string): boolean {
  return adb(['shell', 'pm', 'path', packageName], true).startsWith('package:');
}

function grantEmulatorRuntimePermissions(): void {
  if (runtime.deviceTarget !== 'emulator') return;

  for (const permission of [
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.CAMERA',
    'android.permission.POST_NOTIFICATIONS',
  ]) {
    adb(['shell', 'pm', 'grant', runtime.packageName, permission]);
  }
}

function dumpUi(): string {
  const remotePath = '/sdcard/factech-playstore-window.xml';
  adb(['shell', 'uiautomator', 'dump', remotePath]);
  const xml = adb(['exec-out', 'cat', remotePath]);
  adb(['shell', 'rm', remotePath], true);
  return xml;
}

function tap(action: PlayStoreAction): void {
  adb(['shell', 'input', 'tap', String(action.x), String(action.y)]);
}

function wait(milliseconds: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function waitForListing(): { action?: PlayStoreAction; xml: string } {
  let lastXml = '';
  for (let attempt = 0; attempt < 45; attempt += 1) {
    lastXml = dumpUi();
    if (playStoreNeedsUserSignIn(lastXml)) {
      throw new Error(
        'Google Play requires sign-in on the selected emulator. Sign in, then rerun the command.',
      );
    }
    const action = findPlayStoreAction(lastXml);
    if (action) return { action, xml: lastXml };
    wait(2_000);
  }
  return { xml: lastXml };
}

if (
  runtime.appEnvironment !== 'production' ||
  !['production-smoke', 'production-regression'].includes(runtime.testLane) ||
  runtime.appSource !== 'installed'
) {
  throw new Error('Play Store preflight requires the selected installed app in a production lane');
}

assertSelectedDevice(runtime);
if (adb(['shell', 'pidof', 'io.appium.uiautomator2.server'], true)) {
  throw new Error(
    `The selected device ${runtime.androidUdid} already has an active Appium UiAutomator2 session; stop that run or select another device before Play Store preflight`,
  );
}
if (!packageInstalled('com.android.vending')) {
  throw new Error('Google Play Store is not installed on the selected Android image');
}

adb(['shell', 'wm', 'dismiss-keyguard'], true);
adb([
  'shell',
  'am',
  'start',
  '-W',
  '-a',
  'android.intent.action.VIEW',
  '-d',
  `market://details?id=${runtime.packageName}`,
  'com.android.vending',
]);

const listing = waitForListing();
if (!listing.action) {
  throw new Error(`Google Play did not expose Install, Update, or Open for ${runtime.packageName}`);
}

if (listing.action.name === 'Open') {
  if (!packageInstalled(runtime.packageName)) {
    throw new Error(`Google Play reports Open but ${runtime.packageName} is not installed`);
  }
  grantEmulatorRuntimePermissions();
  const version = assertExpectedVersion();
  console.log(
    `PASS Google Play reports Open and ${runtime.app.displayName} meets the expected version (${version.versionName}/${version.versionCode}).`,
  );
  process.exit(0);
}

console.log(
  `${listing.action.name.toUpperCase()} latest live ${runtime.app.displayName} from Google Play.`,
);
tap(listing.action);

for (let attempt = 0; attempt < 180; attempt += 1) {
  wait(2_000);
  const xml = dumpUi();
  if (playStoreNeedsUserSignIn(xml)) {
    throw new Error(`Google Play requested sign-in while installing ${runtime.app.displayName}`);
  }
  const action = findPlayStoreAction(xml);
  if (action?.name === 'Open' && packageInstalled(runtime.packageName)) {
    grantEmulatorRuntimePermissions();
    const version = assertExpectedVersion();
    console.log(
      `PASS ${runtime.app.displayName} installed from Google Play and meets the expected version (${version.versionName}/${version.versionCode}).`,
    );
    process.exit(0);
  }
}

throw new Error(`Google Play did not finish installing ${runtime.packageName} within six minutes`);
