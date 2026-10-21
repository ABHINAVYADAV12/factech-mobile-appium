import { $, browser, expect } from '@wdio/globals';

import { byTestId } from '../../selectors/test-id.js';

export const technicianWorkOrdersScreen = {
  async waitForDisplayed(): Promise<void> {
    const screen = await byTestId('technician.workorders.screen', 'Work orders screen');
    await screen.waitForDisplayed({ timeout: 30_000 });
    await expect(screen).toBeDisplayed();
  },

  async expectLoadedState(): Promise<void> {
    await browser.waitUntil(
      async () => {
        const list = await byTestId('technician.workorders.list', 'Work orders list');
        const empty = await byTestId('technician.workorders.empty', 'No work orders found');
        return (await list.isDisplayed()) || (await empty.isDisplayed());
      },
      { timeout: 30_000, timeoutMsg: 'Work orders did not reach list or empty state' },
    );
  },

  async expectSequenceDisplayed(sequence: string): Promise<void> {
    if (!/^(WO|HK|HW|LB|LG|BR)[- ]?\d+$/i.test(sequence)) {
      throw new Error('Expected a complete controlled work-order sequence');
    }
    const prefix = JSON.stringify(`${sequence},`);
    let card = await $(`android=new UiSelector().descriptionStartsWith(${prefix})`);
    if (!(await card.isDisplayed())) {
      await $(
        `android=new UiScrollable(new UiSelector().scrollable(true)).setMaxSearchSwipes(50).scrollIntoView(new UiSelector().descriptionStartsWith(${prefix}))`,
      ).isExisting();
      card = await $(`android=new UiSelector().descriptionStartsWith(${prefix})`);
    }
    await card.waitForDisplayed({
      timeout: 45_000,
      timeoutMsg: `QR scan did not show expected asset work order ${sequence}`,
    });
    await expect(card).toBeDisplayed();
    await expect(card).toHaveAttribute(
      'content-desc',
      expect.stringContaining(`${sequence}, OPEN,`),
    );
  },

  async openSequence(sequence: string): Promise<void> {
    await this.expectSequenceDisplayed(sequence);
    const card = await $(
      `android=new UiSelector().descriptionStartsWith(${JSON.stringify(`${sequence},`)})`,
    );
    await card.click();
  },

  async expectChecklistDisplayed(): Promise<void> {
    const checklist = await $(
      'android=new UiSelector().textMatches("^(Checklist|Smoke Test Checklist)$")',
    );
    await checklist.waitForDisplayed({
      timeout: 45_000,
      timeoutMsg: 'Work-order checklist did not open',
    });
    await expect(checklist).toBeDisplayed();
  },
};
