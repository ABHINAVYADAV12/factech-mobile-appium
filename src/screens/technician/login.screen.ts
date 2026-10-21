import {browser, expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';

export const technicianLoginScreen = {
  async waitForDisplayed(): Promise<void> {
    await expect(
      await byTestId('technician.login.screen', 'Technician sign in screen'),
    ).toBeDisplayed();
  },
  async login(username: string, password: string): Promise<void> {
    await (await byTestId('technician.login.identity', 'Email or phone number')).setValue(username);
    await (await byTestId('technician.login.password', 'Password')).setValue(password);
    await (await byTestId('technician.login.submit', 'Log in')).click();
  },

  async expectRejected(): Promise<void> {
    const popup = await byTestId('technician.popup');
    await popup.waitForDisplayed({ timeout: 20_000 });
    await expect(popup).toBeDisplayed();
    await (await byTestId('technician.popup.ok', 'OK')).click();
  },
};
