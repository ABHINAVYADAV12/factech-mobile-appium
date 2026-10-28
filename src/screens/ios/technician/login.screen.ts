import { $, expect, browser } from '@wdio/globals';

export const technicianIosLoginScreen = {
  async waitForDisplayed(): Promise<void> {
    await expect(
      $('//XCUIElementTypeNavigationBar//XCUIElementTypeStaticText[@name="Login"] | //XCUIElementTypeStaticText[@name="Login"]'),
    ).toBeDisplayed();
  },

  async login(username: string, password: string): Promise<void> {
    await $(
      '//XCUIElementTypeTextField[@placeholderValue="Email Or Phone Number"] | //XCUIElementTypeTextField',
    ).setValue(username);

    await $(
      '//XCUIElementTypeSecureTextField[@placeholderValue="Password"] | //XCUIElementTypeSecureTextField',
    ).setValue(password);

    const doneBtn = $('~Done');
    const returnBtn = $('~Return');
    if (await doneBtn.isDisplayed().catch(() => false)) {
      await doneBtn.click();
    } else if (await returnBtn.isDisplayed().catch(() => false)) {
      await returnBtn.click();
    }

    const loginBtn = $(
      '//XCUIElementTypeOther[@name="Login" and @label="Login"] | //XCUIElementTypeButton[@name="Login"]',
    );
    await loginBtn.waitForDisplayed({ timeout: 10_000 });
    await loginBtn.click();
    await browser.pause(2000);

    // If "Select Account" sheet appears, choose the Groundstaff account
    await this.handleSelectAccount();
  },

  /**
   * Selects the Groundstaff / Technician account if the "Select Account" sheet appears.
   */
  async handleSelectAccount(accountIdentifier: string = 'Groundstaff'): Promise<void> {
    const selectAccountTitle = $(
      '//*[contains(@name, "Select Account") or contains(@label, "Select Account")]',
    );
    if (
      await selectAccountTitle
        .waitForDisplayed({ timeout: 6000 })
        .then(() => true)
        .catch(() => false)
    ) {
      const targetAccount = $(
        `//XCUIElementTypeOther[contains(@name, "${accountIdentifier}") or contains(@label, "${accountIdentifier}") or contains(@name, "Ajay Tayade") or contains(@label, "Ajay Tayade")] | //*[contains(@name, "${accountIdentifier}")]`,
      );
      await targetAccount.waitForDisplayed({
        timeout: 10_000,
        timeoutMsg: `Account "${accountIdentifier}" was not displayed in Select Account sheet`,
      });
      await targetAccount.click();
      await browser.pause(2000);
    }
  },

  async expectRejected(): Promise<void> {
    const popup = await $('~OK');
    await popup.waitForDisplayed({ timeout: 20_000 });
    await expect(popup).toBeDisplayed();
    await popup.click();
  },
};