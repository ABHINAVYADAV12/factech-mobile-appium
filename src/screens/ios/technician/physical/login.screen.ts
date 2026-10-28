import { $, expect } from '@wdio/globals';

/**
 * Physical iOS login helper:
 * Seamlessly handles retained sessions (app already on Home dashboard via noReset: true)
 * as well as cold login when credentials need to be submitted.
 */
export const technicianPhysicalLoginScreen = {
  async ensureAuthenticated(username?: string, password?: string): Promise<void> {
    // 1. If Open Work Orders button is visible, we are already on Home!
    const openWoBtn = $(
      '//XCUIElementTypeOther[starts-with(@name, "Open Work Orders")]',
    );
    if (
      await openWoBtn
        .waitForDisplayed({ timeout: 5000 })
        .then(() => true)
        .catch(() => false)
    ) {
      return;
    }

    // 2. Only attempt login if an input field is actually present on screen
    const emailField = $('//XCUIElementTypeTextField');
    const isLoginScreen = await emailField
      .waitForDisplayed({ timeout: 4000 })
      .then(() => true)
      .catch(() => false);

    if (!isLoginScreen) {
      return; // Not on login screen, already authenticated
    }

    if (!username || !password) {
      throw new Error(
        'Missing TECHNICIAN_USERNAME or TECHNICIAN_PASSWORD for login',
      );
    }

    await emailField.setValue(username);

    const passwordField = $('//XCUIElementTypeSecureTextField');
    await passwordField.waitForDisplayed({ timeout: 10_000 });
    await passwordField.setValue(password);

    const doneBtn = $('~Done');
    const returnBtn = $('~Return');
    if (await doneBtn.isDisplayed().catch(() => false)) {
      await doneBtn.click();
    } else if (await returnBtn.isDisplayed().catch(() => false)) {
      await returnBtn.click();
    }

    const loginBtn = $(
      '//XCUIElementTypeOther[@name="Login" and @label="Login"]',
    );
    await loginBtn.waitForDisplayed({ timeout: 10_000 });
    await loginBtn.click();
    await browser.pause(2000);

    // If "Select Account" sheet appears, choose the Groundstaff account
    const selectAccountTitle = $(
      '//*[contains(@name, "Select Account") or contains(@label, "Select Account")]',
    );
    if (
      await selectAccountTitle
        .waitForDisplayed({ timeout: 6000 })
        .then(() => true)
        .catch(() => false)
    ) {
      const groundstaffAccount = $(
        '//XCUIElementTypeOther[contains(@name, "Groundstaff") or contains(@label, "Groundstaff") or contains(@name, "Ajay Tayade") or contains(@label, "Ajay Tayade")] | //*[contains(@name, "Groundstaff")]',
      );
      await groundstaffAccount.waitForDisplayed({
        timeout: 10_000,
        timeoutMsg: 'Groundstaff account was not displayed in Select Account sheet',
      });
      await groundstaffAccount.click();
      await browser.pause(2000);
    }

    // Verify arrival at Home dashboard
    await openWoBtn.waitForDisplayed({ timeout: 35_000 });
    await expect(openWoBtn).toBeDisplayed();
  },
};


