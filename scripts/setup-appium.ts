import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const appiumHome = resolve('.appium');
const appium = resolve('node_modules', 'appium', 'index.js');
const environment = { ...process.env, APPIUM_HOME: appiumHome };

mkdirSync(appiumHome, { recursive: true });

const list = spawnSync(process.execPath, [appium, 'driver', 'list', '--installed', '--json'], {
  env: environment,
  encoding: 'utf8',
  windowsHide: true,
});

if (list.status === 0 && list.stdout.includes('uiautomator2') && list.stdout.includes('8.5.0')) {
  console.log('UiAutomator2 8.5.0 is already installed in the repository Appium home.');
  process.exit(0);
}

const install = spawnSync(process.execPath, [appium, 'driver', 'install', 'uiautomator2@8.5.0'], {
  env: environment,
  stdio: 'inherit',
  windowsHide: true,
});

if (install.status !== 0) process.exit(install.status ?? 1);
