import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosComplaintScreen } from '../../../../src/screens/ios/technician/complaint.screen.js';
import { $ } from '@wdio/globals';
describe('Technician iOS Complaint Smoke', () => {
  beforeEach(async () => {
    await browser.reloadSession();

    const username = process.env.TECHNICIAN_USERNAME;
    const password = process.env.TECHNICIAN_PASSWORD;

    if (!username || !password) {
      throw new Error(
        'Missing TECHNICIAN_USERNAME or TECHNICIAN_PASSWORD',
      );
    }

    await technicianIosLoginScreen.waitForDisplayed();
    await technicianIosLoginScreen.login(username, password);

    await technicianIosHomeScreen.waitForDisplayed();
  });

  it('TC01 - Verify Complaint Section and Status Tabs', async () => {
    // 1. Login as Staff (done in beforeEach)

    // 2. Open the Complaint section
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // 3. Verify the Open, WIP, Hold and Closed tabs
    await technicianIosComplaintScreen.expectStatusTabs();

    // 4. Open the WIP tab
    await technicianIosComplaintScreen.openStatusTab('WIP');

    // Expected Result: Complaint section loads successfully and displays the available status tabs and WIP complaints
    await technicianIosComplaintScreen.verifyWipComplaintsLoaded();
  });

  it('TC02 - Verify Primary Toggle Switch (Assigned to Me vs Logged by Me)', async () => {
    // 1. Open the Complaint section
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // 2. Note counts under 'Assigned to me'
    const openAssigned = await technicianIosComplaintScreen.getTabCount('OPEN');

    // 3. Tap the 'Logged by me' tab
    await technicianIosComplaintScreen.togglePrimaryTab('Logged by me');

    // 4. Verify sub-tab counters update
    const openLogged = await technicianIosComplaintScreen.getTabCount('OPEN');
    expect(openLogged).not.toBeNaN();

    // 5. Open WIP tab and verify only self-logged tickets are shown
    await technicianIosComplaintScreen.openStatusTab('WIP');
    const wipCount = await technicianIosComplaintScreen.getTabCount('WIP');
    if (wipCount === 0) {
      await technicianIosComplaintScreen.verifyEmptyState('No Complaints Found');
    }

    // Switch back to restore assigned tickets view
    await technicianIosComplaintScreen.togglePrimaryTab('Assigned to me');
  });

  it('TC03 - Verify Empty State Display on Zero Records', async () => {
    // 1. Open the Complaint section
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // 2. Tap the HOLD tab under 'Assigned to me'
    await technicianIosComplaintScreen.openStatusTab('HOLD');

    // 3. Verify the screen display renders empty state
    await technicianIosComplaintScreen.verifyEmptyState('No Complaints Found');
  });

  it('TC15 - Verify Closed Complaint Read-Only State and Pull-to-Refresh', async () => {
    // 1. Open Complaint section
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // 2. Open CLOSED tab
    await technicianIosComplaintScreen.openStatusTab('CLOSED');

    // 3. Tap any completed card
    await technicianIosComplaintScreen.openFirstComplaintCard();

    // 4. Verify details are read-only and action buttons (Assign, Hold, Close) are disabled/hidden
    await technicianIosComplaintScreen.verifyClosedComplaintDetailsReadOnly();

    // 5. Go back to list
    await technicianIosComplaintScreen.goBackToList();

    // 6. Perform a downward pull-to-refresh swipe
    await technicianIosComplaintScreen.pullToRefresh();

    // 7. Verify Complaint section and tabs remain displayed cleanly
    await technicianIosComplaintScreen.expectStatusTabs();
  });
});