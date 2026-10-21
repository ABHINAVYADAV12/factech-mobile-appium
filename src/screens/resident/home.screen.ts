import { $, expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';
import { residentTestIds } from './test-ids.js';

export const residentHomeScreen = {
  async isDisplayed(): Promise<boolean> {
    return (await byTestId('resident.home.screen', 'Resident home screen')).isDisplayed();
  },

  async waitForDisplayed(): Promise<void> {
    const screen = await byTestId('resident.home.screen', 'Resident home screen');
    await screen.waitForDisplayed({ timeout: 30_000 });
    await expect(screen).toBeDisplayed();
  },

  async openMore(): Promise<void> {
    await (await byTestId(residentTestIds.navigation.more, 'More tab')).click();
    await expect(await byTestId('resident.more.logout', 'Log out')).toBeDisplayed();
  },

  async openVisitors(): Promise<void> {
    await (await byTestId(residentTestIds.navigation.visitors, 'Visitors tab')).click();
  },

  async openServiceRequests(): Promise<void> {
    await (
      await byTestId(residentTestIds.navigation.serviceRequests, 'Service Requests tab')
    ).click();
  },

  async logout(): Promise<void> {
    await (await byTestId('resident.more.logout', 'Log out')).click();
    const confirm = $('(//android.widget.TextView[@text="Logout"])[last()]');
    await confirm.waitForDisplayed({ timeout: 10_000 });
    await confirm.click();
  },
};
