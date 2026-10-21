import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { adb, resolveAndroidSdk } from '../src/config/android-tools.js';

const avdName = process.env.AVD_NAME || 'Pixel_9_Pro';
const udid = process.env.ANDROID_UDID || 'emulator-5554';
const emulator = join(
  resolveAndroidSdk(),
  'emulator',
  process.platform === 'win32' ? 'emulator.exe' : 'emulator',
);

if (!existsSync(emulator)) throw new Error(`Android emulator not found: ${emulator}`);

try {
  if (adb(udid, ['get-state']) === 'device') {
    console.log(`${udid} is already running.`);
    process.exit(0);
  }
} catch {
  // Start the requested AVD below.
}

const child = spawn(emulator, ['-avd', avdName, '-no-snapshot-save'], {
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
});
child.unref();

const deadline = Date.now() + 180_000;
while (Date.now() < deadline) {
  try {
    if (adb(udid, ['shell', 'getprop', 'sys.boot_completed']) === '1') {
      console.log(`${avdName} is ready as ${udid}.`);
      process.exit(0);
    }
  } catch {
    // Device is still starting.
  }
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 2_000));
}

throw new Error(`Timed out waiting for ${avdName} on ${udid}`);
