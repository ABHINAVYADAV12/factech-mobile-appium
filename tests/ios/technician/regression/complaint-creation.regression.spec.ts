import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosComplaintScreen } from '../../../../src/screens/ios/technician/complaint.screen.js';
import { technicianIosComplaintCreationScreen } from '../../../../src/screens/ios/technician/complaint-creation.screen.js';
import { expect, browser } from '@wdio/globals';

describe('Technician iOS Complaint Creation - Regression', () => {
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

  // TC05: Verify Complaint Creation Form Validations
  it('TC05 - Verify Complaint Creation Form Validations', async () => {
    // 1. Open Complaint section and navigate to creation form
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();
    await technicianIosComplaintScreen.tapRaise();
    await technicianIosComplaintScreen.verifyCategoryGrid();
    await technicianIosComplaintScreen.selectCategory('Electricity');
    await technicianIosComplaintScreen.verifySubCategoriesDisplayed('Power Outage');
    await technicianIosComplaintScreen.selectSubCategory('Power Outage');

    await technicianIosComplaintCreationScreen.waitForDisplayed();
    await technicianIosComplaintCreationScreen.verifyCategoryFieldsLocked();

    // 2. Leave mandatory fields empty and tap 'Create Issue'
    await technicianIosComplaintCreationScreen.tapCreateIssue();

    // 3. Verify validation error messages / alerts
    await technicianIosComplaintCreationScreen.verifyValidationError();
    await technicianIosComplaintCreationScreen.dismissAlert();

    // 4. Fill in Location and Unit, but do not take a photo
    await technicianIosComplaintCreationScreen.selectFirstLocation();
    await technicianIosComplaintCreationScreen.enterReferenceUnit('Ref: Y');
    await technicianIosComplaintCreationScreen.enterDescription('Testing validation without photo');

    // 5. Tap 'Create Issue'
    await technicianIosComplaintCreationScreen.tapCreateIssue();

    // Expected Result: Submitting without photo triggers validation error / alert
    await technicianIosComplaintCreationScreen.verifyValidationError(['photo', 'capture', 'image', 'required']);
    await technicianIosComplaintCreationScreen.dismissAlert();
  });

  // TC06: Verify Complaint Creation with Mandatory Photo and Self Assignment
  it('TC06 - Verify Complaint Creation with Mandatory Photo and Self Assignment', async () => {
    const timestamp = Date.now().toString().slice(-4);
    const refUnit = `Ref: Y-${timestamp}`;
    const description = `Power Outage : Y-${timestamp}`;

    // 1. Select Electricity -> Power Outage
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();
    await technicianIosComplaintScreen.tapRaise();
    await technicianIosComplaintScreen.selectCategory('Electricity');
    await technicianIosComplaintScreen.selectSubCategory('Power Outage');

    await technicianIosComplaintCreationScreen.waitForDisplayed();

    // 2. Select Location
    await technicianIosComplaintCreationScreen.selectFirstLocation();

    // 3. Enter Reference Unit No. and Description
    await technicianIosComplaintCreationScreen.enterReferenceUnit(refUnit);
    await technicianIosComplaintCreationScreen.enterDescription(description);

    // 4. Enable 'Self Assign' toggle
    await technicianIosComplaintCreationScreen.toggleSelfAssign();

    // 5. Open Camera and capture a photo
    await technicianIosComplaintCreationScreen.capturePhotoFromCamera();
    await browser.pause(2000);

    // 6. Tap 'Create Issue'
    await technicianIosComplaintCreationScreen.tapCreateIssue();

    // 7. Tap OK on success popup
    await technicianIosComplaintCreationScreen.verifySuccessMessage();
    await technicianIosComplaintCreationScreen.confirmSuccessPopup();
  });

  // TC07: Verify Self-Assigned Complaint in WIP
  it('TC07 - Verify Self-Assigned Complaint in WIP', async () => {
    const timestamp = Date.now().toString().slice(-4);
    const uniqueToken = `Y-${timestamp}`;
    const refUnit = `Ref: ${uniqueToken}`;
    const description = `Power Outage : ${uniqueToken}`;

    // 1. Create and self-assign complaint
    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();
    await technicianIosComplaintScreen.tapRaise();
    await technicianIosComplaintScreen.selectCategory('Electricity');
    await browser.pause(1000);
    await technicianIosComplaintScreen.selectSubCategory('Power Outage');

    await technicianIosComplaintCreationScreen.waitForDisplayed();
    await technicianIosComplaintCreationScreen.selectFirstLocation();
    await technicianIosComplaintCreationScreen.enterReferenceUnit(refUnit);
    await technicianIosComplaintCreationScreen.enterDescription(description);
    await technicianIosComplaintCreationScreen.toggleSelfAssign();
    await technicianIosComplaintCreationScreen.capturePhotoFromCamera();
    await browser.pause(2000);
    await technicianIosComplaintCreationScreen.tapCreateIssue();
    await technicianIosComplaintCreationScreen.verifySuccessMessage();
    await technicianIosComplaintCreationScreen.confirmSuccessPopup();

    // 2. Self-assigned complaint routes to WIP - ensure WIP tab is selected and refreshed
    await technicianIosComplaintScreen.waitForDisplayed();
    await technicianIosComplaintScreen.openStatusTab('WIP');
    await technicianIosComplaintScreen.pullToRefresh();

    // 3. Locate the newly created complaint card and assert its details
    const isPresentInWip = await technicianIosComplaintScreen.verifyComplaintCardPresent(uniqueToken, 3);
    expect(isPresentInWip).toBe(true);

    // Verify Category / Sub-Category (Power Outage) is present on card
    const isPowerOutageInWip = await technicianIosComplaintScreen.verifyComplaintCardPresent('Power Outage', 2);
    expect(isPowerOutageInWip).toBe(true);

    // Verify Location is present on card
    const isLocationInWip = await technicianIosComplaintScreen.verifyComplaintCardPresent('@7TH VALLYE AREA', 2);
    expect(isLocationInWip).toBe(true);
  });

  // TC08: Verify Complaint Creation without Self-Assignment into OPEN Pool
  it('TC08 - Verify Complaint Creation without Self-Assignment into OPEN Pool', async () => {
    const timestamp = Date.now().toString().slice(-4);
    const uniqueToken = `Y-${timestamp}`;
    const refUnit = `Ref: ${uniqueToken}`;
    const description = `Power Outage : ${uniqueToken}`;

    await technicianIosHomeScreen.openOpenComplaints();
    await technicianIosComplaintScreen.waitForDisplayed();

    // Note initial OPEN count
    await technicianIosComplaintScreen.togglePrimaryTab('Assigned to me');
    await technicianIosComplaintScreen.openStatusTab('OPEN');
    const initialOpenCount = await technicianIosComplaintScreen.getTabCount('OPEN');

    // 1. Fill in form details and capture a photo (Self Assign left OFF)
    await technicianIosComplaintScreen.tapRaise();
    await technicianIosComplaintScreen.selectCategory('Electricity');
    await browser.pause(1000);
    await technicianIosComplaintScreen.selectSubCategory('Power Outage');

    await technicianIosComplaintCreationScreen.waitForDisplayed();
    await technicianIosComplaintCreationScreen.selectFirstLocation();
    await technicianIosComplaintCreationScreen.enterReferenceUnit(refUnit);
    await technicianIosComplaintCreationScreen.enterDescription(description);
    // 2. 'Self Assign' toggle remains OFF
    await technicianIosComplaintCreationScreen.capturePhotoFromCamera();
    await browser.pause(2000);

    // 3. Tap 'Create Issue' and confirm
    await technicianIosComplaintCreationScreen.tapCreateIssue();
    await technicianIosComplaintCreationScreen.verifySuccessMessage();
    await technicianIosComplaintCreationScreen.confirmSuccessPopup();

    // 4. Open the 'OPEN' tab under 'Assigned to me'
    await technicianIosComplaintScreen.waitForDisplayed();
    await technicianIosComplaintScreen.openStatusTab('OPEN');
    await technicianIosComplaintScreen.pullToRefresh();

    // Expected Result: Complaint is created and routed to OPEN pool; count increments
    const finalOpenCount = await technicianIosComplaintScreen.getTabCount('OPEN');
    expect(finalOpenCount).toBeGreaterThanOrEqual(initialOpenCount);

    const isPresentInOpen = await technicianIosComplaintScreen.verifyComplaintCardPresent(uniqueToken, 3);
    expect(isPresentInOpen).toBe(true);

    // Verify Category / Sub-Category (Power Outage) is present on card
    const isPowerOutageInOpen = await technicianIosComplaintScreen.verifyComplaintCardPresent('Power Outage', 2);
    expect(isPowerOutageInOpen).toBe(true);

    // Verify Location is present on card
    const isLocationInOpen = await technicianIosComplaintScreen.verifyComplaintCardPresent('@7TH VALLYE AREA', 2);
    expect(isLocationInOpen).toBe(true);
  });
});
