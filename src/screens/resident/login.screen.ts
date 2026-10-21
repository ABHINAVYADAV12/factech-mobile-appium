import { $, browser, expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';

async function testIdOrVisibleText(testId: string, text: string) {
  const byId = await byTestId(testId);
  if (await byId.isExisting()) return byId;
  return $(`android=new UiSelector().text("${text}")`);
}

export const residentLoginScreen = {
  async isDisplayed(): Promise<boolean> {
    const screen = await byTestId('resident.login.screen', 'Resident sign in screen');
    if (await screen.isDisplayed()) return true;
    return (
      await testIdOrVisibleText('resident.login.identity', 'Email or Mobile Number')
    ).isDisplayed();
  },

  async waitForDisplayed(): Promise<void> {
    await expect(
      await byTestId('resident.login.screen', 'Resident sign in screen'),
    ).toBeDisplayed();
  },

  async login(username: string, password: string, accountUnit?: string): Promise<void> {
    const identity = await testIdOrVisibleText('resident.login.identity', 'Email or Mobile Number');
    const passwordInput = await testIdOrVisibleText('resident.login.password', 'Password');
    await identity.setValue(username);
    await passwordInput.setValue(password);
    await (await testIdOrVisibleText('resident.login.submit', 'Sign in')).click();
    if (accountUnit) {
      const accountSelector = await byTestId('resident.login.account-selector', 'Select Account');
      const shown = await accountSelector.waitForDisplayed({ timeout: 5_000 }).then(
        () => true,
        () => false,
      );
      if (shown) {
        await (await byTestId(`resident.login.account.${accountUnit}`, accountUnit)).click();
      }
    }
  },

  async expectRejected(): Promise<void> {
    await browser.waitUntil(
      async () => {
        const identityError = await byTestId('resident.login.identity-error');
        const passwordError = await byTestId('resident.login.password-error');
        return (await identityError.isDisplayed()) || (await passwordError.isDisplayed());
      },
      { timeout: 20_000, timeoutMsg: 'Expected resident login rejection evidence' },
    );
    const okButton = $('android=new UiSelector().text("OK")');
    if (await okButton.isDisplayed()) await okButton.click();
  },
};
