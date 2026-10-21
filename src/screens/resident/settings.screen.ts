import { browser, expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';
import { residentHomeScreen } from './home.screen.js';
import { residentTestIds } from './test-ids.js';

export interface ResidentSettingsState {
  homeAway: boolean;
  ivr: boolean;
  visitNotifications: boolean;
}

async function toggleValue(testId: string, label: string): Promise<boolean> {
  const toggle = await byTestId(testId, label);
  const checked = await toggle.getAttribute('checked');
  if (checked === 'true' || checked === 'false') return checked === 'true';
  const selected = await toggle.getAttribute('selected');
  if (selected === 'true' || selected === 'false') return selected === 'true';
  throw new Error(`${testId} must expose checked or selected state`);
}

async function setToggle(testId: string, label: string, desired: boolean): Promise<void> {
  const current = await toggleValue(testId, label);
  if (current === desired) return;
  await (await byTestId(testId, label)).click();
  await browser.waitUntil(async () => (await toggleValue(testId, label)) === desired, {
    timeout: 15_000,
    timeoutMsg: `${testId} did not persist ${desired}`,
  });
}

export const residentSettingsScreen = {
  async openFromHome(): Promise<void> {
    await residentHomeScreen.openMore();
    await (await byTestId(residentTestIds.settings.open, 'Settings')).click();
    await expect(await byTestId(residentTestIds.settings.screen, 'Settings')).toBeDisplayed();
  },

  async readState(): Promise<ResidentSettingsState> {
    return {
      homeAway: await toggleValue(residentTestIds.settings.homeAway, 'Home Away'),
      ivr: await toggleValue(residentTestIds.settings.ivr, 'Enable IVR'),
      visitNotifications: await toggleValue(
        residentTestIds.settings.visitNotifications,
        'Visit notifications',
      ),
    };
  },

  async setState(state: ResidentSettingsState): Promise<void> {
    await setToggle(residentTestIds.settings.homeAway, 'Home Away', state.homeAway);
    await setToggle(residentTestIds.settings.ivr, 'Enable IVR', state.ivr);
    await setToggle(
      residentTestIds.settings.visitNotifications,
      'Visit notifications',
      state.visitNotifications,
    );
  },

  async reopen(): Promise<void> {
    await browser.back();
    await residentHomeScreen.openMore();
    await (await byTestId(residentTestIds.settings.open, 'Settings')).click();
    await expect(await byTestId(residentTestIds.settings.screen, 'Settings')).toBeDisplayed();
  },

  async expectState(expected: ResidentSettingsState): Promise<void> {
    const actual = await this.readState();
    if (
      actual.homeAway !== expected.homeAway ||
      actual.ivr !== expected.ivr ||
      actual.visitNotifications !== expected.visitNotifications
    ) {
      throw new Error(`Resident settings mismatch: ${JSON.stringify({ expected, actual })}`);
    }
  },
};
