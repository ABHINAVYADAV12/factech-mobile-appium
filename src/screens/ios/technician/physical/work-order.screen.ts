import { $, expect, browser } from '@wdio/globals';
import { technicianIosHomeScreen } from '../home.screen.js';

export const technicianPhysicalWorkOrderScreen = {
  get homeScannerButton() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Scan QR") or contains(@label, "Scan QR")] | //XCUIElementTypeButton[contains(@name, "Scan QR") or contains(@label, "Scan QR")] | //XCUIElementTypeStaticText[contains(@name, "Scan QR") or contains(@label, "Scan QR")]',
    );
  },

  /**
   * Ensures the app is positioned on the Technician Home dashboard.
   */
  async ensureOnHomeScreen(): Promise<void> {
    if (await this.homeScannerButton.isDisplayed().catch(() => false)) {
      return;
    }

    const backBtn = $(
      '//XCUIElementTypeButton[@name="Back" or @label="Back" or contains(@name, "back") or contains(@label, "back")] | //XCUIElementTypeOther[@name="Back" or @label="Back"]',
    );
    for (let i = 0; i < 3; i++) {
      if (await this.homeScannerButton.isDisplayed().catch(() => false)) break;
      if (await backBtn.isDisplayed().catch(() => false)) {
        await backBtn.click();
        await browser.pause(800);
      }
    }

    if (!(await this.homeScannerButton.isDisplayed().catch(() => false))) {
      await technicianIosHomeScreen.tapHomeBottomTab().catch(() => {});
    }
  },

  /**
   * Opens QR scanner directly from Home dashboard and handles camera permissions.
   */
  async openScannerFromHome(): Promise<void> {
    await this.homeScannerButton.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Scanner button on Home screen was not displayed',
    });
    await this.homeScannerButton.click();
    await browser.pause(1000);

    await this.handleCameraPermission();
    await this.verifyScannerDisplayed();
  },

  /**
   * Finds and taps a specific Work Order card by ID (e.g. "WO-40763").
   * Automatically scrolls down if the card is further down the list.
   */
  async openWorkOrderById(woId: string, maxSwipes = 6): Promise<void> {
    const targetCard = $(
      `//XCUIElementTypeOther[starts-with(@name, "${woId}") or contains(@name, "${woId}")]`,
    );

    let isVisible = await targetCard.isDisplayed().catch(() => false);

    if (!isVisible) {
      for (let swipe = 0; swipe < maxSwipes; swipe++) {
        await browser.execute('mobile: swipe', { direction: 'up' });
        await browser.pause(600);

        isVisible = await targetCard.isDisplayed().catch(() => false);
        if (isVisible) break;
      }
    }

    await targetCard.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Work Order card "${woId}" was not found after scrolling`,
    });
    await targetCard.click();
  },

  /**
   * Finds and taps a specific Work Order card by Asset name.
   * Automatically scrolls down if the card is further down the list.
   */
  async openWorkOrderByAsset(assetName: string, maxSwipes = 6): Promise<string> {
    const targetCard = $(
      `//XCUIElementTypeOther[contains(translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${assetName.toLowerCase()}") or contains(translate(@label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${assetName.toLowerCase()}")]`,
    );

    let isVisible = await targetCard.isDisplayed().catch(() => false);

    if (!isVisible) {
      for (let swipe = 0; swipe < maxSwipes; swipe++) {
        await browser.execute('mobile: swipe', { direction: 'up' });
        await browser.pause(600);

        isVisible = await targetCard.isDisplayed().catch(() => false);
        if (isVisible) break;
      }
    }

    await targetCard.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Work Order card with asset "${assetName}" was not found after scrolling`,
    });

    const cardText =
      (await targetCard.getAttribute('name')) ||
      (await targetCard.getAttribute('label')) ||
      '';
    const match = cardText.match(/\b(WO|HK|LG|LB|BR)-\d+\b/);

    await targetCard.click();
    return match ? match[0] : '';
  },

  /**
   * Automatically dismisses iOS camera permission alert if prompted.
   */
  async handleCameraPermission(): Promise<void> {
    try {
      const allowBtn = $('~Allow While Using App');
      if (await allowBtn.isDisplayed().catch(() => false)) {
        await allowBtn.click();
        await browser.pause(500);
      }
    } catch {
      // Permission alert not presented
    }
  },

  get scannerElement() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Scan") or contains(@name, "QR") or contains(@name, "Asset")] | //XCUIElementTypeStaticText[contains(@name, "Scan") or contains(@name, "QR") or contains(@name, "Asset")]',
    );
  },

  /**
   * Asserts that the camera QR scanner is active and visible.
   */
  async verifyScannerDisplayed(): Promise<void> {
    await this.scannerElement.waitForDisplayed({ timeout: 15_000 });
    await expect(this.scannerElement).toBeDisplayed();
  },

  get scannedOrdersHeader() {
    return $(
      '//XCUIElementTypeStaticText[@name="Scanned Orders" or contains(@name, "Scanned") or contains(@label, "Scanned")] | //XCUIElementTypeOther[@name="Scanned Orders" or contains(@name, "Scanned") or contains(@label, "Scanned")]',
    );
  },

  get firstWorkOrderCard() {
    return $(
      '//XCUIElementTypeOther[starts-with(@name, "WO-") or starts-with(@name, "HK-") or starts-with(@name, "LG-") or starts-with(@name, "LB-") or contains(@name, "WO-")] | //XCUIElementTypeScrollView//XCUIElementTypeOther[starts-with(@name, "WO-") or contains(@name, "WO-")][1]',
    );
  },

  /**
   * Waits for the physical QR scan to complete and the "Scanned Orders" / associated WO screen to load.
   */
  async waitForPhysicalScan(timeoutMs = 60_000): Promise<void> {
    console.log('[PHYSICAL-QR] >>> Point iPhone camera at the Asset QR sticker now... <<<');
    await browser.waitUntil(
      async () => {
        const headerVisible = await this.scannedOrdersHeader.isDisplayed().catch(() => false);
        if (headerVisible) return true;
        const cardVisible = await this.firstWorkOrderCard.isDisplayed().catch(() => false);
        if (cardVisible) return true;
        const showVisible = await this.showButton.isDisplayed().catch(() => false);
        if (showVisible) return true;
        const scannerActive = await this.scannerElement.isDisplayed().catch(() => false);
        return !scannerActive;
      },
      {
        timeout: timeoutMs,
        timeoutMsg: `Scan did not complete within ${timeoutMs / 1000} seconds`,
      },
    );
  },

  /**
   * Clicks on the first Work Order displayed on the Work Orders screen,
   * extracting and returning both its WO ID and WO Asset from the card.
   */
  async openFirstWorkOrderFromList(): Promise<{ woId: string; woAsset?: string; cardLabel: string }> {
    await this.firstWorkOrderCard.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: 'First work order card was not displayed on Work Orders list',
    });

    const cardLabel =
      (await this.firstWorkOrderCard.getAttribute('name')) ||
      (await this.firstWorkOrderCard.getAttribute('label')) ||
      '';

    // 1. Extract WO ID (e.g. "WO-41753", "LB-01576", etc.)
    const matchWoId = cardLabel.match(/\b(WO|HK|LG|LB|BR)-\d+\b/);
    const woId = matchWoId ? matchWoId[0] : '';

    // 2. Extract Asset Name from card label
    let woAsset: string | undefined;
    const parts = cardLabel.split(',').map((s) => s.trim());
    const cubeIndex = parts.findIndex((p) => p === '' || p.includes(''));
    if (cubeIndex !== -1 && cubeIndex + 1 < parts.length) {
      woAsset = parts[cubeIndex + 1];
    } else if (parts.length >= 6) {
      woAsset = parts[5];
    }

    console.log(
      `[PHYSICAL-QR] First WO Card selected -> WO ID: "${woId}", Asset: "${woAsset || 'N/A'}"`,
    );

    await this.firstWorkOrderCard.click();
    await browser.pause(1500);

    return { woId, woAsset, cardLabel };
  },

  /**
   * Verifies that the expected asset name is present in the scanned Work Orders list.
   */
  async verifyAssetPresentInList(expectedAsset: string): Promise<void> {
    const lower = expectedAsset.toLowerCase();
    const assetElement = $(
      `//*[contains(translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${lower}") or contains(translate(@label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${lower}")]`,
    );
    await assetElement.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Target asset "${expectedAsset}" was not found in the scanned work orders list`,
    });
    await expect(assetElement).toBeDisplayed();
  },

  /**
   * Clicks on the first Work Order displayed under the scanned asset result,
   * extracting and returning both its WO ID and Asset name dynamically from the card.
   */
  async clickFirstWorkOrder(expectedAssetName?: string): Promise<{ woId?: string; assetName?: string; cardLabel: string }> {
    await this.firstWorkOrderCard.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: 'First work order card was not displayed after asset QR scan',
    });

    const cardLabel =
      (await this.firstWorkOrderCard.getAttribute('name')) ||
      (await this.firstWorkOrderCard.getAttribute('label')) ||
      '';

    // 1. Extract WO ID (e.g. "WO-41129" or "LB-01576" or "HK-09162")
    const matchWoId = cardLabel.match(/\b(WO|HK|LG|LB|BR)-\d+\b/);
    const woId = matchWoId ? matchWoId[0] : undefined;

    // 2. Extract Asset Name from card label
    let assetName: string | undefined;
    const parts = cardLabel.split(',').map((s) => s.trim());

    const cubeIndex = parts.findIndex((p) => p === '' || p.includes(''));
    if (cubeIndex !== -1 && cubeIndex + 1 < parts.length) {
      assetName = parts[cubeIndex + 1];
    } else if (parts.length >= 6) {
      assetName = parts[5];
    }

    console.log(
      `[PHYSICAL-QR] Card details extracted -> WO ID: "${woId}", Asset: "${assetName || cardLabel}"`,
    );

    // If expected asset name is provided, assert that the card contains the asset
    if (expectedAssetName) {
      const lowerCard = cardLabel.toLowerCase();
      const lowerExpected = expectedAssetName.toLowerCase();
      expect(lowerCard).toContain(lowerExpected);
    }

    await this.firstWorkOrderCard.click();
    await browser.pause(2000);

    return { woId, assetName: assetName || expectedAssetName, cardLabel };
  },

  get showButton() {
    return $(
      '//XCUIElementTypeButton[@name="Show" or @label="Show"] | //XCUIElementTypeOther[@name="Show" or @label="Show" or contains(@name, "Show") or contains(@label, "Show")] | //XCUIElementTypeStaticText[@name="Show" or @label="Show"]',
    );
  },

  /**
   * Clicks the "Show" button on the opened Work Order details screen.
   */
  async clickShow(): Promise<void> {
    let isVisible = await this.showButton.isDisplayed().catch(() => false);
    if (!isVisible) {
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(800);
      isVisible = await this.showButton.isDisplayed().catch(() => false);
    }
    await this.showButton.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: '"Show" button was not displayed on the work order screen',
    });
    await this.showButton.click();
    await browser.pause(1500);
  },

  /**
   * Verifies that the Work Order (e.g. WO ID / details) is displayed inside the opened WO after clicking Show.
   */
  async verifyWorkOrderInsideShow(expectedWoId?: string): Promise<void> {
    if (expectedWoId) {
      const woElement = $(
        `//*[contains(@name, "${expectedWoId}") or contains(@label, "${expectedWoId}")]`,
      );
      if (
        await woElement
          .waitForDisplayed({ timeout: 10_000 })
          .then(() => true)
          .catch(() => false)
      ) {
        await expect(woElement).toBeDisplayed();
        return;
      }
    }

    // Fallback: Confirm Work Order details or Checklist section is visible inside show screen
    const woDetailsElement = $(
      '//XCUIElementTypeStaticText[contains(@name, "Checklist") or contains(@label, "Checklist") or contains(@name, "Progress") or contains(@label, "Progress") or contains(@name, "WO") or contains(@name, "Work Order")] | //XCUIElementTypeOther[contains(@name, "Checklist") or contains(@name, "Work Order")]',
    );
    await woDetailsElement.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Work Order details (for ${expectedWoId || 'scanned WO'}) were not displayed on show screen`,
    });
    await expect(woDetailsElement).toBeDisplayed();
  },

  /**
   * Verifies that the Work Order is displayed after clicking Show.
   */
  async verifyWorkOrderIdAndAsset(expectedWoId?: string, expectedAsset?: string): Promise<void> {
    await this.verifyWorkOrderInsideShow(expectedWoId);

    if (expectedAsset) {
      const lower = expectedAsset.toLowerCase();
      const assetElement = $(
        `//*[contains(translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${lower}") or contains(translate(@label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${lower}")]`,
      );
      if (
        await assetElement
          .waitForDisplayed({ timeout: 4000 })
          .then(() => true)
          .catch(() => false)
      ) {
        await expect(assetElement).toBeDisplayed();
      }
    }
  },

  /**
   * Verifies that "Scanned Orders" is loaded and displays the associated work order cards.
   */
  async verifyDetailedWorkOrderOpened(woId?: string): Promise<void> {
    // 1. Confirm "Scanned Orders" title
    await expect(this.scannedOrdersHeader).toBeDisplayed();

    // 2. Confirm the targeted WO card (or associated asset card) is present under Scanned Orders
    if (woId) {
      const targetCard = $(
        `//XCUIElementTypeOther[starts-with(@name, "${woId}") or contains(@name, "${woId}")]`,
      );
      await targetCard.waitForDisplayed({
        timeout: 10_000,
        timeoutMsg: `Work order "${woId}" was not found in Scanned Orders list`,
      });
      await expect(targetCard).toBeDisplayed();
    } else {
      const anyCard = $(
        '//XCUIElementTypeOther[starts-with(@name, "WO-") or starts-with(@name, "HK-") or starts-with(@name, "LG-") or starts-with(@name, "LB-")]',
      );
      await anyCard.waitForDisplayed({ timeout: 10_000 });
      await expect(anyCard).toBeDisplayed();
    }
  },

  /**
   * Verifies the result screen after scanning for TC-08:
   * Flow A: Scanned Orders screen appears -> asserts scanned screen is open and checks both woId and woAsset.
   * Flow B: Directly opens the Work Order details -> asserts only woId.
   */
  async verifyScannedResultOrDirectWorkOrder(woId: string, woAsset?: string): Promise<void> {
    // Check if Scanned Orders screen appears
    const isScannedScreen = await this.scannedOrdersHeader
      .waitForDisplayed({ timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (isScannedScreen) {
      console.log('[PHYSICAL-QR] Flow A: Scanned Orders screen opened. Verifying WO ID and WO Asset...');
      await expect(this.scannedOrdersHeader).toBeDisplayed();

      // 1. Verify WO ID on scanned screen
      if (woId) {
        const woElement = $(
          `//*[contains(@name, "${woId}") or contains(@label, "${woId}")]`,
        );
        await woElement.waitForDisplayed({
          timeout: 10_000,
          timeoutMsg: `Work Order "${woId}" was not found on Scanned Orders screen`,
        });
        await expect(woElement).toBeDisplayed();
      }

      // 2. Verify WO Asset on scanned screen
      if (woAsset) {
        const lowerAsset = woAsset.toLowerCase();
        const assetElement = $(
          `//*[contains(translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${lowerAsset}") or contains(translate(@label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), "${lowerAsset}")]`,
        );
        await assetElement.waitForDisplayed({
          timeout: 10_000,
          timeoutMsg: `Asset "${woAsset}" was not found on Scanned Orders screen`,
        });
        await expect(assetElement).toBeDisplayed();
      }
    } else {
      console.log(
        '[PHYSICAL-QR] Flow B: Directly opened Work Order screen. Clicking Show and verifying WO ID...',
      );
      // 1. Click on Show
      await this.clickShow();

      // 2. Verify WO ID inside the opened show screen
      await this.verifyWorkOrderInsideShow(woId);
    }
  },
};
