import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosWorkOrderScreen } from '../../../../src/screens/ios/technician/work-order.screen.js';

describe('Work Order Smoke Tests', () => {
  beforeEach(async () => {
    // Reset session for a clean test state
    await browser.reloadSession();

    const username = process.env.TECHNICIAN_USERNAME;
    const password = process.env.TECHNICIAN_PASSWORD;

    if (!username || !password) {
      throw new Error(
        'Missing TECHNICIAN_USERNAME or TECHNICIAN_PASSWORD',
      );
    }

    // Step 1: Login with technician credentials
    await technicianIosLoginScreen.waitForDisplayed();
    await technicianIosLoginScreen.login(username, password);

    // Step 2: From Home dashboard, navigate into Open Work Orders
    await technicianIosHomeScreen.waitForDisplayed();
    await technicianIosHomeScreen.openOpenWorkOrders();

    // Step 3: Wait until the Work Order screen with its 3 tabs is ready
    await technicianIosWorkOrderScreen.waitForDisplayed();
  });

  it('TC-01 - verifies Work Order tabs, card information and statuses', async () => {
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
    // Step 1: Open the filter modal sheet
    await technicianIosWorkOrderScreen.openFilterModal();

    // Step 2: Validate all 4 filter categories, all options, and footer actions
    await technicianIosWorkOrderScreen.verifyFilterScreenAndOptions();
  });

  it('TC-06 - Verify tapping Work Order card opens Asset Scanner', async () => {
    // 1. Click on the first visible WO or HK card
    const firstCard = await $(
      '//XCUIElementTypeOther[starts-with(@name, "WO-") or starts-with(@name, "HK-") or starts-with(@name, "LG-") or starts-with(@name, "LB-")]',
    );
    await firstCard.waitForDisplayed({ timeout: 10_000 });
    await firstCard.click();

    // 2. Handle camera permission dialog if prompted on first launch
    try {
      const allowBtn = await $('~Allow While Using App');
      if (await allowBtn.isDisplayed()) {
        await allowBtn.click();
        await browser.pause(500);
      }
    } catch {
      // Alert not shown
    }

    // 3. Verify scanner screen is displayed
    await browser.pause(1500);
    const scannerElement = await $(
      '//XCUIElementTypeOther[contains(@name, "Scan") or contains(@name, "QR") or contains(@name, "Asset")] | //XCUIElementTypeStaticText[contains(@name, "Scan") or contains(@name, "QR") or contains(@name, "Asset")]',
    );
    await expect(scannerElement).toBeDisplayed();
  });
});
