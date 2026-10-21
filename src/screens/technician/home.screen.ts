import { $, browser, expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';

export const technicianHomeScreen = {
  async returnToHome(): Promise<void> {
    const homeMarker = await $('android=new UiSelector().text("Scan QR")');
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (await homeMarker.isDisplayed()) return;
      await browser.back();
      await browser.pause(750);
    }
    await homeMarker.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: 'Technician Home was not reachable through back navigation',
    });
  },

  async waitForDisplayed(): Promise<void> {
    const screen = await byTestId('technician.home.screen', 'Technician home screen');
    await screen.waitForDisplayed({ timeout: 30_000 });
    await expect(screen).toBeDisplayed();
  },

  async openWorkOrders(): Promise<void> {
    await (await byTestId('technician.nav.work-orders', 'Open Work Orders')).click();
  },

  async openQrScanner(): Promise<void> {
    await (await byTestId('technician.nav.qr-code')).click();
  },

  async logout(): Promise<void> {
    const legacyLogout = await byTestId('technician.header.logout', 'Log out');
    if (await legacyLogout.isDisplayed()) {
      await legacyLogout.click();
    } else {
      const refresh = await $('android=new UiSelector().text("Refresh")');
      await refresh.waitForDisplayed({
        timeout: 30_000,
        timeoutMsg: 'Technician Home did not expose the More-page shortcut',
      });
      await refresh.click();
      const currentLogout = await $('//*[@text="Logout"]/ancestor::*[@clickable="true"][1]');
      await currentLogout.waitForDisplayed({
        timeout: 30_000,
        timeoutMsg: 'Technician More page did not expose Logout',
      });
      await currentLogout.click();
    }

    const confirmation = await $('android=new UiSelector().textContains("You will be logged out")');
    await confirmation.waitForDisplayed({ timeout: 15_000 });
    await (await $('android=new UiSelector().text("OK")')).click();
    await (await $('~Login')).waitForDisplayed({ timeout: 30_000 });
  },

  async ensureExpectedGreeting(expectedGreeting: string): Promise<void> {
    const expected = await $(`android=new UiSelector().text(${JSON.stringify(expectedGreeting)})`);
    if (await expected.isDisplayed()) return;

    const visibleGreeting = await $('android=new UiSelector().textStartsWith("Hi ")');
    const actualGreeting = (await visibleGreeting.isDisplayed())
      ? await visibleGreeting.getText()
      : 'no visible greeting';
    await this.logout();
    throw new Error(
      `Wrong retained Technician account: expected ${expectedGreeting}, observed ${actualGreeting}. The mismatched session was logged out; authenticate the approved account before rerunning.`,
    );
  },
};
