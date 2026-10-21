
import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosUpcomingWorkOrderScreen } from '../../../../src/screens/ios/technician/upcoming-work-order.screen.js';

describe('Technician iOS upcoming work orders smoke', () => {
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
    await technicianIosHomeScreen.openUpcomingWork();
  });

  // TC-01: Verify Upcoming Work Order section.
  it('TC-01 - displays the upcoming work order section', async () => {
    await technicianIosUpcomingWorkOrderScreen.waitForDisplayed();
  });

  // TC-02: Verify date selection using dates relative to today.
  it('TC-02 - selects a date range', async () => {
    await technicianIosUpcomingWorkOrderScreen.openFromDatePicker();
    await technicianIosUpcomingWorkOrderScreen.selectAvailableDate(0);
    await technicianIosUpcomingWorkOrderScreen.expectDatePickerClosed();

    await technicianIosUpcomingWorkOrderScreen.openToDatePicker();
    await technicianIosUpcomingWorkOrderScreen.selectAvailableDate(1);
    await technicianIosUpcomingWorkOrderScreen.expectDatePickerClosed();
  });

  // TC-03: Verify scheduled-time popup.
  it('TC-03 - verifies scheduled-time popup details', async () => {
    await technicianIosUpcomingWorkOrderScreen.openWorkOrder();
    await technicianIosUpcomingWorkOrderScreen.expectScheduledTimePopup();
    await technicianIosUpcomingWorkOrderScreen.closePopup();
  });

  // TC-04: Verify Upcoming status.
  it('TC-04 - verifies the upcoming work order status', async () => {
    await technicianIosUpcomingWorkOrderScreen.expectUpcomingStatus();
  });

  // TC-05: Verify the user returns to the list after the popup.
  it('TC-05 - prevents starting work before scheduled time', async () => {
    await technicianIosUpcomingWorkOrderScreen.verifyWorkCannotStartEarly();
  });
});
