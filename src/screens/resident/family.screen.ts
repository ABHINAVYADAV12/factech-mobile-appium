import { $, expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';
import { residentTestIds } from './test-ids.js';

export const residentFamilyScreen = {
  async openFromHome(): Promise<void> {
    await (await byTestId(residentTestIds.family.open, 'Family members')).click();
    await expect(await byTestId(residentTestIds.family.screen, 'Family members')).toBeDisplayed();
  },

  async add(marker: string, mobile: string, email?: string): Promise<void> {
    await (await byTestId(residentTestIds.family.add, 'Add family member')).click();
    await (await byTestId(residentTestIds.family.name, 'Enter full name')).setValue(marker);
    await (await byTestId(residentTestIds.family.mobile, 'Enter mobile number')).setValue(mobile);
    if (email) {
      await (await byTestId(residentTestIds.family.email, 'Enter email address')).setValue(email);
    }
    await (await byTestId(residentTestIds.family.relation, 'Select relation')).click();
    await (await byTestId(residentTestIds.family.relationOther, 'Other')).click();
    await (await byTestId(residentTestIds.family.submit, 'Add Member')).click();
    await expect(
      await byTestId(residentTestIds.family.success, 'Family member added'),
    ).toBeDisplayed();
    await expect(await byTestId(residentTestIds.family.screen, 'Family members')).toBeDisplayed();
    await expect(await byTestId(residentTestIds.family.result(marker), marker)).toBeDisplayed();
  },

  async remove(marker: string): Promise<void> {
    const result = await byTestId(residentTestIds.family.result(marker), marker);
    if (!(await result.isExisting())) return;
    await result.click();
    await (await byTestId(residentTestIds.family.remove, 'Remove family member')).click();
    const confirm = $('android=new UiSelector().text("Delete")');
    await confirm.waitForDisplayed({ timeout: 10_000 });
    await confirm.click();
    await expect(result).not.toBeDisplayed();
  },
};
