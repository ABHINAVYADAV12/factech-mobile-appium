import { $, expect } from '@wdio/globals';

export const technicianIosHomeScreen = {
  async waitForDisplayed(): Promise<void> {
    const screen = $('~Quick Access');
    await screen.waitForDisplayed({ timeout: 35_000 });
    await expect(screen).toBeDisplayed();
  },

  async expectTechnicianName(name?: string): Promise<void> {
    const selector = name
      ? `//XCUIElementTypeStaticText[contains(@name, "${name}")]`
      : '//XCUIElementTypeStaticText[starts-with(@name, "Hi ")]';
    const element = $(selector);
    await element.waitForDisplayed({ timeout: 15_000 });
    await expect(element).toBeDisplayed();
  },

  async expectQuickAccess(): Promise<void> {
    const quickAccess = $('~Quick Access');
    await quickAccess.waitForDisplayed({ timeout: 15_000 });
    await expect(quickAccess).toBeDisplayed();
  },

  async openOpenWorkOrders(): Promise<void> {
    const button = $(
      '//XCUIElementTypeOther[starts-with(@name, "Open Work Orders")]',
    );
    await button.waitForDisplayed({ timeout: 15_000 });
    await button.click();
  },

  async openUpcomingWork(): Promise<void> {
    const button = $(
      '//XCUIElementTypeOther[starts-with(@name, "Upcoming Work")]',
    );
    await button.waitForDisplayed({ timeout: 15_000 });
    await button.click();
  },

  async openOpenComplaints(): Promise<void> {
    const button = $(
      '//XCUIElementTypeOther[starts-with(@name, "Open Complaints")]',
    );
    await button.waitForDisplayed({ timeout: 15_000 });
    await button.click();
  },

  async openAttendance(): Promise<void> {
    const button = $('//XCUIElementTypeOther[starts-with(@name, "Attendance")]');
    await button.waitForDisplayed({ timeout: 15_000 });
    await button.click();
  },

  async scanQr(): Promise<void> {
    const button = $(
      '//XCUIElementTypeOther[contains(@name, "Scan QR")]',
    );
    await button.waitForDisplayed({ timeout: 15_000 });
    await button.click();
  },

  async scanNfc(): Promise<void> {
    const button = $(
      '//XCUIElementTypeOther[contains(@name, "Scan NFC")]',
    );
    await button.waitForDisplayed({ timeout: 15_000 });
    await button.click();
  },
};