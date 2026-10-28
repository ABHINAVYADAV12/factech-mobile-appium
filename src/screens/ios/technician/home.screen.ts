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

  /**
   * Clicks the "Go Offline" button on the Home card to navigate to the Offline / Profile section.
   */
  async openGoOffline(): Promise<void> {
    const goOfflineBtn = $(
      '//XCUIElementTypeOther[starts-with(@name, "Go Offline") or contains(@name, "Refresh") or @label="Go Offline"] | //XCUIElementTypeStaticText[@name="Go Offline" or contains(@name, "Refresh")]',
    );
    await goOfflineBtn.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Go Offline / Refresh button was not displayed on Technician Home',
    });
    await goOfflineBtn.click();
    await browser.pause(1000);
  },

  /**
   * Taps the bottom navigation Home tab (leftmost icon) to return to Home dashboard.
   */
  async tapHomeBottomTab(): Promise<void> {
    const namedHome = $(
      '//XCUIElementTypeButton[@name="Home" or @label="Home"] | //XCUIElementTypeOther[@name="Home" or @label="Home"]',
    );
    if (await namedHome.isDisplayed().catch(() => false)) {
      await namedHome.click();
    } else {
      const { width, height } = await browser.getWindowSize();
      await browser
        .action('pointer')
        .move({ x: Math.round(width * 0.1), y: Math.round(height * 0.94) })
        .down()
        .pause(100)
        .up()
        .perform();
    }
    await this.waitForDisplayed();
  },

  /**
   * Verifies that after sync, the Home card displays:
   * 1. "Refresh" option in place of "Go Offline"
   * 2. "Ready" status option in place of "Refresh"
   */
  async expectOfflineSyncCompletedState(): Promise<void> {
    // 1. "Refresh" pill option visible in place of "Go Offline"
    const refreshPill = $(
      '//*[contains(@name, "Refresh") or contains(@label, "Refresh")]',
    );
    await refreshPill.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: '"Refresh" option was not displayed in place of "Go Offline"',
    });
    await expect(refreshPill).toBeDisplayed();

    // 2. "Ready" option visible in place of "Refresh"
    const readyStatus = $(
      '//*[contains(@name, "Ready") or contains(@label, "Ready")]',
    );
    await readyStatus.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: '"Ready" status option was not displayed in place of "Refresh"',
    });
    await expect(readyStatus).toBeDisplayed();
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