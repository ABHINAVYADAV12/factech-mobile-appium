import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosComplaintScreen } from '../../../../src/screens/ios/technician/complaint.screen.js';
import { $, browser } from '@wdio/globals';

describe('Technician iOS Complaint Regression', () => {
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

  it('TC09 - Verify Staff Can Self-Assign an Open Complaint', async () => {
    // 1. Open the Complaint section
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // 2. Open 'Assigned to me' -> 'OPEN' tab
    await technicianIosComplaintScreen.togglePrimaryTab('Assigned to me');
    await technicianIosComplaintScreen.openStatusTab('OPEN');

    const initialOpenCount = await technicianIosComplaintScreen.getTabCount('OPEN');
    const initialWipCount = await technicianIosComplaintScreen.getTabCount('WIP');

    if (initialOpenCount === 0) {
      await technicianIosComplaintScreen.verifyEmptyState('No Complaints Found');
      return;
    }

    // 3. Locate and open the first unassigned complaint card in OPEN pool, capturing its ticket ID
    const targetTicketId = await technicianIosComplaintScreen.openFirstComplaintCard();

    // 4. Tap 'Self Assign Complaint' and confirm popup
    await technicianIosComplaintScreen.selfAssignComplaint();

    // 5. Navigate back to Complaint list
    await technicianIosComplaintScreen.goBackToList();

    // 6. Perform pull-to-refresh to update badge counts & lists
    await technicianIosComplaintScreen.pullToRefresh();

    // 7. Verify the exact ticket is removed from OPEN pool
    const isStillInOpen = await technicianIosComplaintScreen.verifyComplaintCardPresent(targetTicketId);
    expect(isStillInOpen).toBe(false);

    // 8. Open WIP tab and verify the EXACT same ticket is now present in WIP pool
    await technicianIosComplaintScreen.openStatusTab('WIP');
    const isNowInWip = await technicianIosComplaintScreen.verifyComplaintCardPresent(targetTicketId);
    expect(isNowInWip).toBe(true);
  });

  it('TC10 - Verify Staff Can Unassign a Complaint Back to OPEN Pool', async () => {
    // 1. Open the Complaint section
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // 2. Open 'Assigned to me' -> 'WIP' tab
    await technicianIosComplaintScreen.togglePrimaryTab('Assigned to me');
    await technicianIosComplaintScreen.openStatusTab('WIP');

    const initialWipCount = await technicianIosComplaintScreen.getTabCount('WIP');
    if (initialWipCount === 0) {
      await technicianIosComplaintScreen.verifyEmptyState('No Complaints Found');
      return;
    }

    // 3. Open the first assigned complaint card from WIP tab, capturing its ticket ID
    const targetTicketId = await technicianIosComplaintScreen.openFirstComplaintCard();

    // 4. Tap 'Unassign' action button, confirm popup, and acknowledge OK
    await technicianIosComplaintScreen.unassignComplaint();

    // 5. Navigate back to Complaint list
    await technicianIosComplaintScreen.goBackToList();

    // 6. Perform pull-to-refresh to update badge counts & lists
    await technicianIosComplaintScreen.pullToRefresh();

    // 7. Verify the complaint is removed from WIP pool
    await technicianIosComplaintScreen.openStatusTab('WIP');
    const isStillInWip = await technicianIosComplaintScreen.verifyComplaintCardPresent(targetTicketId);
    expect(isStillInWip).toBe(false);

    // 8. Navigate to OPEN tab and verify the complaint now appears under OPEN pool
    await technicianIosComplaintScreen.openStatusTab('OPEN');
    const isNowInOpen = await technicianIosComplaintScreen.verifyComplaintCardPresent(targetTicketId);
    expect(isNowInOpen).toBe(true);
  });

  it('TC11 - Verify Moving an Active Complaint from WIP to HOLD', async () => {
    // 1. Open Complaint section
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // 2. Open 'Assigned to me' -> 'WIP' tab
    await technicianIosComplaintScreen.openStatusTab('WIP');

    const hasComplaints = await technicianIosComplaintScreen.hasComplaintCards();
    const initialWipCount = await technicianIosComplaintScreen.getTabCount('WIP');
    const initialHoldCount = await technicianIosComplaintScreen.getTabCount('HOLD');

    // If there is no complaint in WIP, verify empty state and return
    if (!hasComplaints) {
      await technicianIosComplaintScreen.verifyEmptyState('No Complaints Found');
      return;
    }

    // 3. Open an assigned complaint from WIP tab, capturing its ticket ID
    const targetTicketId = await technicianIosComplaintScreen.openFirstComplaintCard();

    // 4. Tap 'Put on Hold', select reason and enter remarks
    await technicianIosComplaintScreen.putComplaintOnHold(
      'Waiting for Material/Spare Parts',
      'Waiting for Material/Spare Parts',
    );

    // 5. Navigate back to list and refresh
    await technicianIosComplaintScreen.goBackToList();
    await technicianIosComplaintScreen.pullToRefresh();

    // 6. Verify the complaint is removed from WIP pool and WIP count decrements by 1
    await technicianIosComplaintScreen.openStatusTab('WIP');
    const isStillInWip =
      await technicianIosComplaintScreen.verifyComplaintCardPresent(targetTicketId);
    expect(isStillInWip).toBe(false);

    const finalWipCount = await technicianIosComplaintScreen.getTabCount('WIP');
    expect(finalWipCount).toBe(initialWipCount - 1);

    // 7. Navigate to HOLD tab and verify the complaint now appears under HOLD pool and HOLD count increments by 1
    await technicianIosComplaintScreen.openStatusTab('HOLD');
    const isNowInHold =
      await technicianIosComplaintScreen.verifyComplaintCardPresent(targetTicketId);
    expect(isNowInHold).toBe(true);

    const finalHoldCount = await technicianIosComplaintScreen.getTabCount('HOLD');
    expect(finalHoldCount).toBe(initialHoldCount + 1);
  });

  it('TC12 - Verify Resuming Work on a Complaint from HOLD to WIP', async () => {
    // 1. Open Complaint section
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // 2. Navigate to the HOLD tab
    await technicianIosComplaintScreen.openStatusTab('HOLD');

    const hasComplaints = await technicianIosComplaintScreen.hasComplaintCards();
    const initialHoldCount = await technicianIosComplaintScreen.getTabCount('HOLD');
    const initialWipCount = await technicianIosComplaintScreen.getTabCount('WIP');

    // If there is no complaint on HOLD, verify empty state and return
    if (!hasComplaints) {
      await technicianIosComplaintScreen.verifyEmptyState('No Complaints Found');
      return;
    }

    // 3. Open the complaint placed on hold, capturing its ticket ID
    const targetTicketId = await technicianIosComplaintScreen.openFirstComplaintCard();

    // 4. Tap 'Resume Work' (or Start Work) and confirm prompt
    await technicianIosComplaintScreen.resumeWorkComplaint();

    // 5. Navigate back to list and refresh
    await technicianIosComplaintScreen.goBackToList();
    await technicianIosComplaintScreen.pullToRefresh();

    // 6. Verify complaint moves out of HOLD and HOLD count decrements by 1
    await technicianIosComplaintScreen.openStatusTab('HOLD');
    const isStillInHold =
      await technicianIosComplaintScreen.verifyComplaintCardPresent(targetTicketId);
    expect(isStillInHold).toBe(false);

    const finalHoldCount = await technicianIosComplaintScreen.getTabCount('HOLD');
    expect(finalHoldCount).toBe(initialHoldCount - 1);

    // 7. Open the WIP tab and verify complaint re-appears in WIP list with logged-in Staff assignment and WIP count increments by 1
    await technicianIosComplaintScreen.openStatusTab('WIP');
    const isNowInWip =
      await technicianIosComplaintScreen.verifyComplaintCardPresent(targetTicketId);
    expect(isNowInWip).toBe(true);

    const finalWipCount = await technicianIosComplaintScreen.getTabCount('WIP');
    expect(finalWipCount).toBe(initialWipCount + 1);
  });

  it('TC13 - Verify Complaint Details and Add Comment', async () => {
    // 1. Open Complaint section
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // 2. Open 'Assigned to me' -> 'WIP' tab
    await technicianIosComplaintScreen.openStatusTab('WIP');

    const hasComplaints = await technicianIosComplaintScreen.hasComplaintCards();
    if (!hasComplaints) {
      await technicianIosComplaintScreen.verifyEmptyState('No Complaints Found');
      return;
    }

    // 3. Open a complaint card from the WIP tab
    const targetTicketId = await technicianIosComplaintScreen.openFirstComplaintCard();

    // 4. Verify complaint details, timestamps, and history
    await technicianIosComplaintScreen.verifyComplaintDetails();

    // 5. Enter text in 'Add a comment' and tap 'Send'
    const testComment = 'Parts received, starting electrical repair';
    const actualTyped = await technicianIosComplaintScreen.addComment(testComment);

    // 6. Verify comment is posted immediately to the activity feed
    await technicianIosComplaintScreen.verifyCommentPosted(actualTyped);
  });

  it('TC14 - Verify Closing a Complaint with Resolution Remarks', async () => {
    // 1. Open Complaint section
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // 2. Open 'Assigned to me' -> 'WIP' tab
    await technicianIosComplaintScreen.openStatusTab('WIP');

    const hasComplaints = await technicianIosComplaintScreen.hasComplaintCards();
    const initialWipCount = await technicianIosComplaintScreen.getTabCount('WIP');
    const initialClosedCount = await technicianIosComplaintScreen.getTabCount('CLOSED');

    if (!hasComplaints) {
      await technicianIosComplaintScreen.verifyEmptyState('No Complaints Found');
      return;
    }

    const targetTicketId = await technicianIosComplaintScreen.openFirstComplaintCard();

    // 4. Tap 'Close Complaint' / enter remarks / confirm popup
    await technicianIosComplaintScreen.closeComplaint('Resolved and tested successfully');

    // 5. If still on details screen, navigate back to list
    const backChevron = $(
      '//XCUIElementTypeOther[@name="" or @label=""] | //XCUIElementTypeButton[@name="Back" or @label="Back"]',
    );
    if (await backChevron.isDisplayed().catch(() => false)) {
      await technicianIosComplaintScreen.goBackToList();
    }

    // 6. Refresh WIP list and verify ticket is removed
    await technicianIosComplaintScreen.pullToRefresh();
    await browser.pause(2000);

    const isStillInWip =
      await technicianIosComplaintScreen.verifyComplaintCardPresent(targetTicketId);
    expect(isStillInWip).toBe(false);

    const finalWipCount =
      await technicianIosComplaintScreen.getTabCount('WIP');
    expect(finalWipCount).toBe(initialWipCount - 1);

    // 7. Open CLOSED tab and verify ticket is present and CLOSED count increments
    await technicianIosComplaintScreen.openStatusTab('CLOSED');
    await browser.pause(1500);

    const finalClosedCount =
      await technicianIosComplaintScreen.getTabCount('CLOSED');
    expect(finalClosedCount).toBe(initialClosedCount + 1);
  });
});
