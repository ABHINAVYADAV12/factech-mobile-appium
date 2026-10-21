import { $, browser } from '@wdio/globals';

import { requireCredentials, type RuntimeConfig } from '../config/runtime.js';

function descriptionContains(text: string) {
  return $(`android=new UiSelector().descriptionContains("${text}")`);
}

async function loginWithApprovedCredentials(runtime: RuntimeConfig): Promise<void> {
  if (!runtime.productionCredentialLoginConfirmed) {
    throw new Error('Fresh production login requires PRODUCTION_CREDENTIAL_LOGIN_CONFIRMED=true.');
  }

  const credentials = requireCredentials(runtime);
  const identity = await $(
    'android=new UiSelector().className("android.widget.EditText").text("Email Or Phone Number")',
  );
  const password = await $(
    'android=new UiSelector().className("android.widget.EditText").text("Password")',
  );
  const login = await $('~Login');

  // Resolve both placeholder-based elements before editing either field. Android
  // autofill can replace the password placeholder as soon as identity is entered.
  await Promise.all([
    identity.waitForDisplayed({ timeout: 30_000 }),
    password.waitForDisplayed({ timeout: 30_000 }),
  ]);
  await identity.setValue(credentials.username);
  await password.setValue(credentials.password);

  const home = await descriptionContains('Open Work Orders');
  if (await home.isDisplayed()) return;

  try {
    await login.click();
  } catch (error) {
    // Some Android/autofill combinations submit as soon as the password value is
    // committed, so the Login element can disappear between lookup and click.
    if (await home.isDisplayed()) return;
    throw error;
  }
}

async function allowVisibleAppPermission(): Promise<boolean> {
  const permissionButtons = [
    await $(
      'android=new UiSelector().resourceId("com.android.permissioncontroller:id/permission_allow_foreground_only_button")',
    ),
    await $(
      'android=new UiSelector().resourceId("com.android.permissioncontroller:id/permission_allow_button")',
    ),
  ];

  for (const button of permissionButtons) {
    if (await button.isDisplayed()) {
      await button.click();
      await browser.pause(500);
      return true;
    }
  }

  return false;
}

async function waitForHomeAfterLogin(home: ReturnType<typeof $>): Promise<void> {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    if (await allowVisibleAppPermission()) continue;

    if (await home.isDisplayed()) {
      await browser.pause(1_000);
      if (!(await allowVisibleAppPermission())) return;
    }

    await browser.pause(500);
  }

  throw new Error(
    'Technician home is unavailable after approved credential login and permission handling.',
  );
}

async function settleOnHomeOrLogin(
  runtime: RuntimeConfig,
  home: ReturnType<typeof $>,
  login: ReturnType<typeof $>,
  timeout: number,
): Promise<boolean> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (await allowVisibleAppPermission()) continue;
    if (await home.isDisplayed()) return true;
    if (await login.isDisplayed()) {
      await loginWithApprovedCredentials(runtime);
      await waitForHomeAfterLogin(home);
      return true;
    }
    await browser.pause(500);
  }

  return false;
}

export async function ensureTechnicianProductionHome(runtime: RuntimeConfig): Promise<void> {
  await browser.activateApp(runtime.packageName);
  const home = await descriptionContains('Open Work Orders');
  const login = await $('~Login');

  if (await settleOnHomeOrLogin(runtime, home, login, 15_000)) return;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (await allowVisibleAppPermission()) {
      continue;
    }

    if (await home.isDisplayed()) return;

    if (await login.isDisplayed()) {
      await loginWithApprovedCredentials(runtime);
      await waitForHomeAfterLogin(home);
      return;
    }

    await browser.back();
    await browser.pause(750);
    if (await settleOnHomeOrLogin(runtime, home, login, 2_000)) return;
  }

  // Back navigation may leave the app after unwinding its root route.
  await browser.activateApp(runtime.packageName);
  if (await settleOnHomeOrLogin(runtime, home, login, 60_000)) return;

  throw new Error('Technician home and login are unavailable after retained-session recovery');
}
