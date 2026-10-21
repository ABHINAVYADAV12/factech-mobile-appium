import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

import type { RuntimeConfig } from './runtime.js';

function firstExisting(paths: Array<string | undefined>): string | undefined {
  return paths.find((candidate): candidate is string =>
    Boolean(candidate && existsSync(candidate)),
  );
}

export function resolveAndroidSdk(environment: NodeJS.ProcessEnv = process.env): string {
  const sdk = firstExisting([
    environment.ANDROID_HOME,
    environment.ANDROID_SDK_ROOT,
    environment.LOCALAPPDATA ? join(environment.LOCALAPPDATA, 'Android', 'Sdk') : undefined,
  ]);
  if (!sdk) throw new Error('Android SDK not found; set ANDROID_HOME');
  return resolve(sdk);
}

export function resolveAdb(environment: NodeJS.ProcessEnv = process.env): string {
  const sdkAdb = join(
    resolveAndroidSdk(environment),
    'platform-tools',
    process.platform === 'win32' ? 'adb.exe' : 'adb',
  );
  if (existsSync(sdkAdb)) return sdkAdb;
  throw new Error(`ADB not found: ${sdkAdb}`);
}

export function resolveAapt(environment: NodeJS.ProcessEnv = process.env): string {
  const buildTools = join(resolveAndroidSdk(environment), 'build-tools');
  const executable = process.platform === 'win32' ? 'aapt.exe' : 'aapt';
  const versions = readdirSync(buildTools, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  const aapt = firstExisting(versions.map((version) => join(buildTools, version, executable)));
  if (!aapt) throw new Error(`aapt not found below ${buildTools}`);
  return aapt;
}

export function inspectApkPackage(appPath: string): string {
  const output = execFileSync(resolveAapt(), ['dump', 'badging', appPath], {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
  const match = output.match(/^package: name='([^']+)'/m);
  if (!match?.[1]) throw new Error(`Unable to read package name from ${appPath}`);
  return match[1];
}

export function assertSafeApk(config: RuntimeConfig): void {
  if (config.appSource !== 'apk' || !config.appPath) return;
  const actualPackage = inspectApkPackage(config.appPath);
  if (!actualPackage.endsWith('.e2e') || actualPackage !== config.packageName) {
    throw new Error(
      `Refusing APK package ${actualPackage}; expected test package ${config.packageName}`,
    );
  }
}

export function assertInstalledApp(config: RuntimeConfig): void {
  if (config.appSource !== 'installed') return;
  const output = adb(config.androidUdid, ['shell', 'pm', 'path', config.packageName]);
  if (!output.startsWith('package:')) {
    throw new Error(
      `Play Store beta package ${config.packageName} is not installed on ${config.androidUdid}`,
    );
  }
}

export function readInstalledAppVersion(config: RuntimeConfig): {
  versionName: string;
  versionCode: string;
} {
  const output = adb(config.androidUdid, ['shell', 'dumpsys', 'package', config.packageName]);
  const versionName = output.match(/^\s*versionName=(.+)$/m)?.[1]?.trim() ?? 'unknown';
  const versionCode = output.match(/^\s*versionCode=(\d+)/m)?.[1] ?? 'unknown';
  return { versionName, versionCode };
}

export function assertExpectedInstalledVersion(config: RuntimeConfig): {
  versionName: string;
  versionCode: string;
} {
  const version = readInstalledAppVersion(config);
  if (
    config.app.target === 'resident' &&
    config.appEnvironment === 'production' &&
    !config.expectedPlayStoreVersionCode
  ) {
    throw new Error('Resident production runs require APP_EXPECTED_PLAYSTORE_VERSION_CODE');
  }
  if (
    config.expectedPlayStoreVersionCode &&
    Number(version.versionCode) < config.expectedPlayStoreVersionCode
  ) {
    throw new Error(
      `Installed ${config.app.displayName} version code ${version.versionCode} is below expected ${config.expectedPlayStoreVersionCode}`,
    );
  }
  return version;
}

export function adb(udid: string, args: string[]): string {
  return execFileSync(resolveAdb(), ['-s', udid, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 30_000,
    maxBuffer: 8 * 1024 * 1024,
  }).trim();
}

export function assertSelectedDevice(config: RuntimeConfig): void {
  const state = adb(config.androidUdid, ['get-state']);
  if (state !== 'device') throw new Error(`ADB device is not ready: ${config.androidUdid}`);
  const isEmulator = adb(config.androidUdid, ['shell', 'getprop', 'ro.kernel.qemu']) === '1';
  if (config.deviceTarget === 'emulator' && !isEmulator) {
    throw new Error(`DEVICE_TARGET=emulator but ${config.androidUdid} is physical`);
  }
  if (config.deviceTarget === 'physical' && isEmulator) {
    throw new Error(`DEVICE_TARGET=physical but ${config.androidUdid} is an emulator`);
  }
}
