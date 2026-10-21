import { $, expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';
import { residentHomeScreen } from './home.screen.js';
import { residentTestIds } from './test-ids.js';

export type SinglePassType = 'delivery' | 'guest' | 'cab';

export const residentPassesScreen = {
  async openFromHome(): Promise<void> {
    await residentHomeScreen.openVisitors();
    await expect(await byTestId(residentTestIds.passes.screen, 'Visitor passes')).toBeDisplayed();
  },

  async createSinglePass(
    type: SinglePassType,
    marker: string,
    guestMobile?: string,
  ): Promise<void> {
    await (await byTestId(residentTestIds.passes.create, 'Create pass')).click();
    await (await byTestId(residentTestIds.passes.type(type), `${type} pass`)).click();
    const singleTab = await byTestId(residentTestIds.passes.singleTab, 'Single Visit');
    if (await singleTab.isExisting()) await singleTab.click();

    if (type === 'guest') {
      if (!guestMobile) throw new Error('Guest pass creation requires approved fixture mobile');
      await (
        await byTestId(residentTestIds.passes.guestName, 'Enter visitor name')
      ).setValue(marker);
      await (
        await byTestId(residentTestIds.passes.guestMobile, 'Enter 10-digit mobile')
      ).setValue(guestMobile);
      const dropOff = await byTestId(residentTestIds.passes.guestDropOff, 'For drop off only');
      if (await dropOff.isExisting()) await dropOff.click();
    } else if (type === 'delivery') {
      await (await byTestId(residentTestIds.passes.providerMore, 'More')).click();
      await (await byTestId(residentTestIds.passes.providerCustom, 'Custom')).click();
      await (await byTestId(residentTestIds.passes.company, 'Enter company name')).setValue(marker);
    } else {
      throw new Error(
        'Cab pass automation is blocked: the Resident form has no marker-capable persisted field',
      );
    }

    await (await byTestId(residentTestIds.passes.visitDate, 'Visit Date')).click();
    await (await byTestId(residentTestIds.passes.tomorrow, 'Tomorrow')).click();
    await (await byTestId(residentTestIds.passes.submit, `Schedule ${type}`)).click();
    await expect(await byTestId(residentTestIds.passes.success, 'Pass created')).toBeDisplayed();
    await expect(await byTestId(residentTestIds.passes.screen, 'Visitor passes')).toBeDisplayed();
    await expect(await byTestId(residentTestIds.passes.result(marker), marker)).toBeDisplayed();
  },

  async cancel(marker: string): Promise<void> {
    const result = await byTestId(residentTestIds.passes.result(marker), marker);
    if (!(await result.isExisting())) return;
    await result.click();
    await (await byTestId(residentTestIds.passes.cancel, 'Cancel pass')).click();
    const confirm = $('android=new UiSelector().text("Delete")');
    await confirm.waitForDisplayed({ timeout: 10_000 });
    await confirm.click();
    await expect(result).not.toBeDisplayed();
  },
};
