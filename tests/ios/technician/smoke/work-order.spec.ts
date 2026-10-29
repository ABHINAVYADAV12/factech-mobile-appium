import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosProfileScreen } from '../../../../src/screens/ios/technician/profile.screen.js';
import { technicianIosWorkOrderScreen } from '../../../../src/screens/ios/technician/work-order.screen.js';

describe('Work Order Smoke Tests', () => {
  beforeEach(async () => {
    // Reset session for a clean test state
    await browser.reloadSession();

    const username = process.env.TECHNICIAN_USERNAME;
    const password = process.env.TECHNICIAN_PASSWORD;

    if (!username || !password) {
      throw new Error('Missing TECHNICIAN_USERNAME or TECHNICIAN_PASSWORD');
    }

    // Step 1: Login with technician credentials
    await technicianIosLoginScreen.waitForDisplayed();
    await technicianIosLoginScreen.login(username, password);

    // Land on Home dashboard
    await technicianIosHomeScreen.waitForDisplayed();
  });

  it('TC-01 - verifies Work Order tabs, card information and statuses', async () => {
    await technicianIosHomeScreen.openOpenWorkOrders();
    await technicianIosWorkOrderScreen.waitForDisplayed();

    // 1. Verify card format (ID prefix and non-empty status) on default OPEN tab
    await technicianIosWorkOrderScreen.verifyCardInformation();

    // 2. Validate all cards under OPEN tab (OPEN, STARTED, REOPENED, OVERDUE, MISSED)
    await technicianIosWorkOrderScreen.verifyStatusesWhileScrolling('OPEN');

    // 3. Validate all cards under HOLD tab (HOLD)
    await technicianIosWorkOrderScreen.verifyStatusesWhileScrolling('HOLD');

    // 4. Validate all cards under CLOSED tab (COMPLETED, CANCELLED)
    await technicianIosWorkOrderScreen.verifyStatusesWhileScrolling('CLOSED');
  });

  it('TC-02 - Verify Work Order Filter Screen and Options', async () => {
    await technicianIosHomeScreen.openOpenWorkOrders();
    await technicianIosWorkOrderScreen.waitForDisplayed();

    // Step 1: Open the filter modal sheet
    await technicianIosWorkOrderScreen.openFilterModal();

    // Step 2: Validate all 4 filter categories, all options, and footer actions
    await technicianIosWorkOrderScreen.verifyFilterScreenAndOptions();
  });

  it('TC-06 - Verify Work Order Sync', async () => {
    // Step 1: Login is completed (user is on Home dashboard)
    await technicianIosHomeScreen.expectQuickAccess();

    // Step 2: Click on "Go Offline" button on Home dashboard to redirect to profile/settings section
    await technicianIosHomeScreen.openGoOffline();
    await technicianIosProfileScreen.waitForDisplayed();

    // Step 3: Click "Sync Offline Data" / "Click to Fetch"
    await technicianIosProfileScreen.fetchOfflineData();

    // Assert "Syncing data" state
    await technicianIosProfileScreen.expectSyncingData();

    // Assert "Offline Sync Complete" pop-up / notification on upper screen
    await technicianIosProfileScreen.expectOfflineSyncComplete();

    // Assert button turns into "Ready to Use"
    await technicianIosProfileScreen.expectReadyToUse();

    // Step 4: Return to Home dashboard and verify:
    // - "Refresh" option in place of "Go Offline"
    // - "Ready" option in place of "Refresh"
    await technicianIosHomeScreen.tapHomeBottomTab();
    await technicianIosHomeScreen.expectOfflineSyncCompletedState();

    // Step 5: Open WO list
    await technicianIosHomeScreen.openOpenWorkOrders();
    await technicianIosWorkOrderScreen.waitForDisplayed();

    // Expected Result: Latest assigned WO data is synchronized and displayed
    await technicianIosWorkOrderScreen.firstWorkOrderCard.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: 'Latest assigned work order data was not synchronized/displayed after sync',
    });
    await expect(technicianIosWorkOrderScreen.firstWorkOrderCard).toBeDisplayed();

    // Validate that the synchronized cards show valid ID and status structure
    await technicianIosWorkOrderScreen.verifyCardInformation();
  });

  it('TC-09 - Verify WO Instructions', async () => {
    // Step 1: From Home, click on scanning button (Scan QR)
    await technicianIosHomeScreen.expectQuickAccess();
    await technicianIosHomeScreen.scanQr();

    // Handle camera permission dialog if prompted
    try {
      const allowBtn = $('~Allow While Using App');
      if (await allowBtn.isDisplayed().catch(() => false)) {
        await allowBtn.click();
        await browser.pause(500);
      }
    } catch {
      // Permission alert not presented
    }

    await browser.pause(2000);

    // Step 2: Click on "Select Asset" button at the top of scanner screen
    const selectAssetBtn = $(
      '//XCUIElementTypeOther[starts-with(@name, "Select Asset") or starts-with(@label, "Select Asset")]',
    );
    await selectAssetBtn.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: '"Select Asset" button was not displayed on scanner screen',
    });
    await selectAssetBtn.click();
    await browser.pause(2000);

    const targetAsset = 'Formula Asset with nfc';

    // Step 3: Type asset name in "Search assets..." field
    const searchField = $('//XCUIElementTypeTextField[@placeholderValue="Search assets..."]');
    await searchField.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Search assets input field was not displayed',
    });
    await searchField.setValue(targetAsset);
    await browser.pause(1500);

    // Step 4: Click on the matching asset item
    const matchingAsset = $(
      `//*[contains(@name, "${targetAsset}") or contains(@label, "${targetAsset}")]`,
    );
    await matchingAsset.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Asset "${targetAsset}" was not found in search results`,
    });
    await matchingAsset.click();
    await browser.pause(2500);

    // Step 5: Locate and click the first available Work Order card under the asset
    const firstWoCard = $(
      '//XCUIElementTypeOther[starts-with(@name, "WO-") or contains(@name, "WO-")] | //XCUIElementTypeOther[contains(@name, "PM") or contains(@name, "Smoke")] | //XCUIElementTypeScrollView//XCUIElementTypeOther[contains(@name, "WO-")][1]',
    );

    let isDisplayed = await firstWoCard.isDisplayed().catch(() => false);
    for (let swipe = 0; swipe < 6 && !isDisplayed; swipe++) {
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(1200);
      isDisplayed = await firstWoCard.isDisplayed().catch(() => false);
    }

    await firstWoCard.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: `No work order card was displayed for asset "${targetAsset}"`,
    });
    await firstWoCard.click();
    await browser.pause(2500);

    // Step 6: Tap Show/Instructions if instructions checklist is not already visible
    if (!(await technicianIosWorkOrderScreen.checklistHeader.isDisplayed().catch(() => false))) {
      const showInstructionsBtn = $(
        '//XCUIElementTypeOther[contains(@name, "Show") or contains(@label, "Show") or contains(@name, "Instructions") or contains(@label, "Instructions")]',
      );
      if (await showInstructionsBtn.isDisplayed().catch(() => false)) {
        await showInstructionsBtn.click();
        await browser.pause(1000);
      }
    }

    // Step 7: Expected Result - Configured WO instructions are displayed correctly
    await technicianIosWorkOrderScreen.verifyInstructionsDisplayed();

    // Verify progress indicator is displayed with valid total and percentage metrics
    const progress = await technicianIosWorkOrderScreen.getProgress();
    expect(progress.total).toBeGreaterThan(0);
    expect(progress.percentage).toBeGreaterThanOrEqual(0);
  });
});
