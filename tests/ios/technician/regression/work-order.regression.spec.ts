import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosWorkOrderScreen } from '../../../../src/screens/ios/technician/work-order.screen.js';

describe('Technician iOS Work Order - Regression', () => {
  beforeEach(async () => {
    // Reset session for a clean test state before each test case
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

    // Land on Home dashboard
    await technicianIosHomeScreen.waitForDisplayed();
  });

  // TC-03: Verify Applying and Resetting Work Order Status Filters
  it('TC-03 - Verify Applying and Resetting Work Order Status Filters', async () => {
    // Navigate into Open Work Orders
    await technicianIosHomeScreen.openOpenWorkOrders();
    await technicianIosWorkOrderScreen.waitForDisplayed();

    const statuses = [
      'OPEN',
      'STARTED',
      'COMPLETED',
      'HOLD',
      'CANCELLED',
      'REOPEN',
      'OVERDUE',
      'MISSED',
    ];

    for (const status of statuses) {
      // 1. Open Filter and select Status category option
      await technicianIosWorkOrderScreen.applyCategoryFilter('Status', status);

      // 2. Verify displayed records match the selected status or appropriate empty state
      const result = await technicianIosWorkOrderScreen.verifyFilteredCardsOrEmptyState(status);

      // 3. Tap Refresh once and verify the results or empty state remain consistent
      await technicianIosWorkOrderScreen.refreshList();
      const afterRefresh = await technicianIosWorkOrderScreen.verifyFilteredCardsOrEmptyState(status);

      // Assert consistency before and after refresh
      expect(afterRefresh.emptyState).toBe(result.emptyState);
    }

    // 4. Tap Reset and verify the default filter state is restored
    await technicianIosWorkOrderScreen.resetAndApplyFilters();

    // 5. Verify the Work Order list refreshes and displays the default OPEN tab records
    await technicianIosWorkOrderScreen.verifyStatusesWhileScrolling('OPEN');
  });

  // TC-04: Verify Applying and Resetting Work Order Flag Filters
  it('TC-04 - Verify Applying and Resetting Work Order Flag Filters', async () => {
    // Navigate into Open Work Orders
    await technicianIosHomeScreen.openOpenWorkOrders();
    await technicianIosWorkOrderScreen.waitForDisplayed();

    const flags = ['No Delay', 'Delayed', 'All'];

    for (const flag of flags) {
      // 1. Open Filter and select Flag category option
      await technicianIosWorkOrderScreen.applyCategoryFilter('Flag', flag);

      // 2. Verify displayed records or appropriate empty state
      const result = await technicianIosWorkOrderScreen.verifyFlagFilteredCardsOrEmptyState(
        flag as 'No Delay' | 'Delayed' | 'All',
      );

      // 3. Tap Refresh once and verify the results or empty state remain consistent
      await technicianIosWorkOrderScreen.refreshList();
      const afterRefresh = await technicianIosWorkOrderScreen.verifyFlagFilteredCardsOrEmptyState(
        flag as 'No Delay' | 'Delayed' | 'All',
      );

      expect(afterRefresh.emptyState).toBe(result.emptyState);
    }

    // 4. Tap Reset and verify the default filter state is restored
    await technicianIosWorkOrderScreen.resetAndApplyFilters();

    // 5. Verify the Work Order list refreshes and displays the default records
    await technicianIosWorkOrderScreen.verifyStatusesWhileScrolling('OPEN');
  });

  // TC-05: Verify Applying and Resetting Work Order Date Filters
  it('TC-05 - Verify Applying and Resetting Work Order Date Filters', async () => {
    // Navigate into Open Work Orders
    await technicianIosHomeScreen.openOpenWorkOrders();
    await technicianIosWorkOrderScreen.waitForDisplayed();

    const dateOptions = ['Today', 'Yesterday', 'All'];

    for (const dateOption of dateOptions) {
      // 1. Open Filter and select Date category option
      await technicianIosWorkOrderScreen.applyCategoryFilter('Date', dateOption);

      // 2. Verify displayed records or appropriate empty state
      const result = await technicianIosWorkOrderScreen.verifyDateFilteredCardsOrEmptyState(
        dateOption as 'Today' | 'Yesterday' | 'All',
      );

      // 3. Tap Refresh once and verify results or empty state remain consistent
      await technicianIosWorkOrderScreen.refreshList();
      const afterRefresh = await technicianIosWorkOrderScreen.verifyDateFilteredCardsOrEmptyState(
        dateOption as 'Today' | 'Yesterday' | 'All',
      );

      expect(afterRefresh.emptyState).toBe(result.emptyState);
    }

    // 4. Tap Reset and verify the default filter state is restored
    await technicianIosWorkOrderScreen.resetAndApplyFilters();

    // 5. Verify the Work Order list refreshes and displays the default records
    await technicianIosWorkOrderScreen.verifyStatusesWhileScrolling('OPEN');
  });

  // TC-10: Verify Completion Remark
  it('TC-10 - Verify Completion Remark', async () => {
    const targetAsset = 'Formula Asset with nfc';
    const targetWoId = 'WO-41754';
    const targetWoTitle = 'Smoke Test - WO PM';
    const completionRemark = 'My work is done';

    // Step 1: Open WO
    await technicianIosWorkOrderScreen.openWorkOrderViaAssetScan(
      targetAsset,
      targetWoId,
      targetWoTitle,
    );

    // Step 2: Enter completion remark & Step 3: Save/continue
    await technicianIosWorkOrderScreen.enterCompletionRemark(completionRemark);

    // Expected Result: Popup indicating successfully marked as complete
    await technicianIosWorkOrderScreen.verifySuccessfullyMarkedAsComplete();
  });

  // TC-11: Verify Mark WO as Complete
  it('TC-11 - Verify Mark WO as Complete', async () => {
    const targetAsset = 'Formula Asset with nfc';
    const targetWoId = 'WO-41539';
    const targetWoTitle = 'Smoke Test - WO PM';
    const completionRemark = 'My work is done';

    // Step 1: Open WO
    await technicianIosWorkOrderScreen.openWorkOrderViaAssetScan(
      targetAsset,
      targetWoId,
      targetWoTitle,
    );

    // Step 2, 3, 4: Complete required work, enter remark, tap Mark as Complete
    await technicianIosWorkOrderScreen.enterCompletionRemark(completionRemark);

    // Step 5: Verify success popup and confirm/dismiss
    await technicianIosWorkOrderScreen.verifySuccessfullyMarkedAsComplete();
    await technicianIosWorkOrderScreen.dismissSuccessPopup();

    // Expected Result: Transition from OPEN to CLOSED tab and verify WO ID is displayed
    await technicianIosWorkOrderScreen.verifyWorkOrderInClosedTab(targetWoId);
  });

  // TC-12: Verify Completed WO Removed from Open List
  it('TC-12 - Verify Completed WO Removed from Open List', async () => {
    const targetAsset = 'Formula Asset with nfc';
    const targetWoId = 'WO-40176';
    const targetWoTitle = 'Smoke Test - WO PM';
    const completionRemark = 'My work is done';

    // Step 1: Complete WO
    await technicianIosWorkOrderScreen.openWorkOrderViaAssetScan(
      targetAsset,
      targetWoId,
      targetWoTitle,
    );
    await technicianIosWorkOrderScreen.enterCompletionRemark(completionRemark);
    await technicianIosWorkOrderScreen.verifySuccessfullyMarkedAsComplete();
    await technicianIosWorkOrderScreen.dismissSuccessPopup();

    // Step 2: Return to Open WO list
    await technicianIosWorkOrderScreen.returnToOpenList();

    // Refresh the screen after mark as complete
    await technicianIosWorkOrderScreen.refreshList();

    // Expected Result: Completed WO is removed from the Open list
    await technicianIosWorkOrderScreen.verifyWorkOrderNotPresentInOpenList(targetWoId);
  });

  // TC-17: Verify Work Order Status Update
  it('TC-17 - Verify Work Order Status Update via Scan', async () => {
    const targetAsset = 'Formula Asset with nfc';
    const holdReason = 'Waiting for spare parts from vendor';

    // Step 1: Open the first available WO for the selected asset via Scan
    const targetWoId = await technicianIosWorkOrderScreen.openFirstWorkOrderViaAssetScan(targetAsset);

    // Step 2: Open Workorder status update modal
    await technicianIosWorkOrderScreen.openUpdateStatusModal();

    // Step 3: Select HOLD from dropdown
    await technicianIosWorkOrderScreen.selectStatusInModal('HOLD');

    // Assertion 1: Without reason we cannot update (modal remains open and blocks update)
    await technicianIosWorkOrderScreen.verifyCannotUpdateWithoutReason();

    // Step 4: Enter reason and submit update
    await technicianIosWorkOrderScreen.enterStatusUpdateReason(holdReason);
    await browser.pause(2000);
    await technicianIosWorkOrderScreen.submitStatusUpdate();
    // Step 5: Verify work order transitions into the HOLD filter
    await technicianIosWorkOrderScreen.verifyWorkOrderInHoldFilter(targetWoId );

    // Step 6: Open the same WO in HOLD section, click Update, then click History to verify status changed to HOLD
    await technicianIosWorkOrderScreen.verifyStatusInHistory(targetWoId || targetAsset);
  });
});


