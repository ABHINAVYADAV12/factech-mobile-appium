import { browser } from '@wdio/globals';

import type { ResidentAccountCohort, RuntimeConfig } from '../config/runtime.js';
import { requireCredentials, requireResidentCredentials } from '../config/runtime.js';
import { residentHomeScreen } from '../screens/resident/home.screen.js';
import { residentLoginScreen } from '../screens/resident/login.screen.js';

export async function ensureResidentProductionHome(config: RuntimeConfig): Promise<void> {
  await browser.activateApp(config.packageName);

  const home = await residentHomeScreen.isDisplayed();
  if (home) return;

  const login = await residentLoginScreen.isDisplayed();
  if (!login) {
    throw new Error('Resident app is neither on the approved home screen nor the login screen');
  }

  const credentials = requireCredentials(config);
  await residentLoginScreen.login(
    credentials.username,
    credentials.password,
    credentials.accountUnit,
  );
  await residentHomeScreen.waitForDisplayed();
}

async function reachResidentHomeOrLogin(config: RuntimeConfig): Promise<'home' | 'login'> {
  await browser.activateApp(config.packageName);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (await residentHomeScreen.isDisplayed()) return 'home';
    if (await residentLoginScreen.isDisplayed()) return 'login';
    await browser.back();
    await browser.pause(500);
  }
  throw new Error('Unable to reach the Resident home or login screen for account selection');
}

export async function selectResidentProductionAccount(
  config: RuntimeConfig,
  cohort: ResidentAccountCohort,
): Promise<void> {
  const credentials = requireResidentCredentials(config, cohort);
  const state = await reachResidentHomeOrLogin(config);
  if (state === 'home') {
    await residentHomeScreen.openMore();
    await residentHomeScreen.logout();
    await residentLoginScreen.waitForDisplayed();
  }
  await residentLoginScreen.login(
    credentials.username,
    credentials.password,
    credentials.accountUnit,
  );
  await residentHomeScreen.waitForDisplayed();
}
