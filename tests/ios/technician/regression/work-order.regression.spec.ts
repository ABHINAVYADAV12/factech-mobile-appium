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

    // Step 2: From Home dashboard, navigate into Open Work Orders
    await technicianIosHomeScreen.waitForDisplayed();
    await technicianIosHomeScreen.openOpenWorkOrders();

    // Step 3: Wait until the Work Order screen with its 3 tabs is ready
    await technicianIosWorkOrderScreen.waitForDisplayed();
  });

  // TC-03: Verify Applying and Resetting Work Order Status Filters
  it('TC-03 - Verify Applying and Resetting Work Order Status Filters', async () => {
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
});
