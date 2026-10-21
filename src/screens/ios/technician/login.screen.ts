import { $, expect } from '@wdio/globals';

export const technicianIosLoginScreen = {
  async waitForDisplayed(): Promise<void> {
    await expect(
      $('//XCUIElementTypeNavigationBar//XCUIElementTypeStaticText[@name="Login"]'),
    ).toBeDisplayed();
  },

  async login(username: string, password: string): Promise<void> {
    await $(
      '//XCUIElementTypeTextField[@placeholderValue="Email Or Phone Number"]',
    ).setValue(username);

    await $(
      '//XCUIElementTypeSecureTextField[@placeholderValue="Password"]',
    ).setValue(password);

    const returnBtn = $('~Return');
    if (await returnBtn.isDisplayed()) {
      await returnBtn.click();
    }

    const loginBtn = $(
      '//XCUIElementTypeOther[@name="Login" and @label="Login"]',
    );
    await loginBtn.waitForDisplayed({ timeout: 10_000 });
    await loginBtn.click();
  },
  async expectRejected(): Promise<void> {
    const popup = await $('~OK');
    await popup.waitForDisplayed({ timeout: 20_000 });
    await expect(popup).toBeDisplayed();
    await popup.click();
  },
};