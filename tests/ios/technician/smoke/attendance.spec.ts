import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosAttendanceScreen } from '../../../../src/screens/ios/technician/attendance.screen.js';

describe('Technician iOS Attendance Smoke', () => {
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

  it('TC01 - Verify Mark Attendance Screen', async () => {
    // 1. Login to the application (done in beforeEach)

    // 2. Open the Attendance section
    await technicianIosHomeScreen.openAttendance();
    await technicianIosAttendanceScreen.waitForDisplayed();

    // 3. Select Mark Attendance
    await technicianIosAttendanceScreen.openMarkAttendance();

    // 4. Verify location, geofence status, current status, and Check IN/Check OUT options
    await technicianIosAttendanceScreen.verifyMarkAttendanceDetails();
  });

  it('TC04 - Verify My Attendance Records', async () => {
    // 1. Open the Attendance section
    await technicianIosHomeScreen.openAttendance();
    await technicianIosAttendanceScreen.waitForDisplayed();

    // 2. Select My Attendance
    await technicianIosAttendanceScreen.openMyAttendance();

    // 3. Select required month & 4. Verify the attendance summary and attendance logs
    await technicianIosAttendanceScreen.verifyMyAttendanceRecords();
  });
});
