import { browser } from '@wdio/globals';
import { technicianPhysicalLoginScreen } from '../../../../src/screens/ios/technician/physical/login.screen.js';
import { technicianPhysicalWorkOrderScreen } from '../../../../src/screens/ios/technician/physical/work-order.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosWorkOrderScreen } from '../../../../src/screens/ios/technician/work-order.screen.js';

describe('Technician Physical iOS - Work Order Hardware Tests', () => {
  const TARGET_ASSET ='test';

  beforeEach(async () => {
    // Preserve session on physical device with noReset: true
    const username = process.env.TECHNICIAN_USERNAME;
    const password = process.env.TECHNICIAN_PASSWORD;

    // Step 1: Ensure authenticated (smoothly resumes if already on Home)
    await technicianPhysicalLoginScreen.ensureAuthenticated(username, password);

    // Step 2: Ensure on Home dashboard before each test
    await technicianPhysicalWorkOrderScreen.ensureOnHomeScreen();
  });

  it('TC-07 - Verify Asset QR Scan', async () => {
    // 1. Open QR scanner directly clicking on scanner button present on home screen
    await technicianPhysicalWorkOrderScreen.openScannerFromHome();

    // 2. Scan Asset QR - Wait for physical scan (up to 60s)
    await technicianPhysicalWorkOrderScreen.waitForPhysicalScan(60_000);

    // 3. Verify target asset is present in the scanned WO list
    await technicianPhysicalWorkOrderScreen.verifyAssetPresentInList(TARGET_ASSET);

    // 4. Click first WO belonging to the target asset and extract its WO ID
    const { woId } =
      await technicianPhysicalWorkOrderScreen.clickFirstWorkOrder(TARGET_ASSET);

    // 5. Click on Show
    await technicianPhysicalWorkOrderScreen.clickShow();

    // 6. Verify WO inside the opened show screen
    await technicianPhysicalWorkOrderScreen.verifyWorkOrderInsideShow(woId);
  });

  it('TC-08 - Verify Scanned WO Details', async () => {
    // 1. From Home dashboard, navigate into Open Work Orders
    await technicianIosHomeScreen.openOpenWorkOrders();
    await technicianIosWorkOrderScreen.waitForDisplayed();

    // 2. Click first WO appearing on WO screen, store its WO ID and WO Asset
    const { woId, woAsset } =
      await technicianPhysicalWorkOrderScreen.openFirstWorkOrderFromList();

    // 3. Handle camera permission dialog if prompted on physical device
    await technicianPhysicalWorkOrderScreen.handleCameraPermission();

    // 4. Verify camera scanner screen is displayed
    await technicianPhysicalWorkOrderScreen.verifyScannerDisplayed();

    // 5. Scan Asset QR - Wait for physical scan (up to 60s)
    await technicianPhysicalWorkOrderScreen.waitForPhysicalScan(60_000);

    // 6. Verify result screen:
    // Flow A: Scanned screen opened -> check WO ID and WO Asset on scanned screen
    // Flow B: Direct WO opened without scanned screen -> check WO ID
    await technicianPhysicalWorkOrderScreen.verifyScannedResultOrDirectWorkOrder(
      woId,
      woAsset,
    );
  });
});