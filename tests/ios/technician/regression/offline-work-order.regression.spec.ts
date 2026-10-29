import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosWorkOrderScreen } from '../../../../src/screens/ios/technician/work-order.screen.js';
import { technicianIosWorkOrderInstructionScreen } from '../../../../src/screens/ios/technician/work-order-instruction.screen.js';
import { technicianIosProfileScreen } from '../../../../src/screens/ios/technician/profile.screen.js';
import { iosConnectivity } from '../../../../src/config/ios-connectivity.js';

describe('Technician iOS Offline Work Order - Regression', () => {
  beforeEach(async () => {
    // Reset session for a clean test state before each test case
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

  afterEach(async () => {
    if (iosConnectivity.disconnected) {
      iosConnectivity.restore();
    }
  });

  // TC-13: Verify Completed WO After Sync
  it('TC-13 - Verify Completed WO After Sync', async () => {
    const targetAsset = 'Formula Asset with nfc';
    const completionRemark = 'Completed offline';

    // Pre-sync: Fetch latest offline data while online to ensure cache is ready
    await technicianIosHomeScreen.expectQuickAccess();
    await technicianIosHomeScreen.openGoOffline();
    await technicianIosProfileScreen.waitForDisplayed();
    await technicianIosProfileScreen.fetchOfflineData();
    await technicianIosProfileScreen.expectSyncingData();
    await technicianIosProfileScreen.expectOfflineSyncComplete();
    await technicianIosProfileScreen.expectReadyToUse();

    // Return to Home dashboard
    await technicianIosHomeScreen.tapHomeBottomTab();
    await technicianIosHomeScreen.expectOfflineSyncCompletedState();

    // Step 1: Open scanner while online to load asset catalog
    await technicianIosWorkOrderScreen.openScannerScreen();

    // Disconnect internet for offline completion
    iosConnectivity.disconnect();
    await browser.pause(2000);

    let actualWoId = '';
    try {
      // Dynamically select asset, open first WO, and store its exact WO ID before completion
      actualWoId = await technicianIosWorkOrderScreen.selectAssetAndOpenWorkOrder(targetAsset);
      expect(actualWoId).not.toBe('');

      // Fill mandatory instructions (since assets under Formula Asset with nfc require instructions)
      await technicianIosWorkOrderInstructionScreen.fillMandatoryWorkOrderInstructions();

      await technicianIosWorkOrderScreen.enterCompletionRemark(completionRemark);
      await browser.pause(2000);
      await technicianIosWorkOrderScreen.dismissSuccessPopup();
    } finally {
      // Step 2: Reconnect internet
      iosConnectivity.restore();
      await browser.pause(2000);
    }

    // Step 3: Kill and reopen app to refresh network state and return cleanly to Home
    const bundleId = process.env.IOS_BUNDLE_ID || 'com.sumasamu.isocietyManagerAdmin';
    await browser.terminateApp(bundleId);
    await browser.pause(2000);
    await browser.activateApp(bundleId);
    await browser.pause(3000);

    // Wait for Home dashboard to be displayed
    await technicianIosHomeScreen.waitForDisplayed();

    // Step 4: Perform Sync
    await technicianIosHomeScreen.openGoOffline();
    await technicianIosProfileScreen.waitForDisplayed();
    await technicianIosProfileScreen.fetchOfflineData();
    await technicianIosProfileScreen.expectSyncingData();
    await technicianIosProfileScreen.expectOfflineSyncComplete();
    await technicianIosProfileScreen.expectReadyToUse();

    // Return to Home
    await technicianIosHomeScreen.tapHomeBottomTab();

    // Expected Result: Completion data is synchronized successfully
    // On the same scanned asset screen, verify target work order is displayed in the CLOSED section
    const closedWoId = await technicianIosWorkOrderScreen.verifyAssetWorkOrderClosed(
      targetAsset,
      actualWoId,
    );
    expect(closedWoId).toBe(actualWoId);
  });
});
