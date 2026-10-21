import { technicianIosLoginScreen } from '../../../../src/screens/ios/technician/login.screen.js';
import { technicianIosHomeScreen } from '../../../../src/screens/ios/technician/home.screen.js';
import { technicianIosAttendanceScreen } from '../../../../src/screens/ios/technician/attendance.screen.js';

describe('Technician iOS Attendance Regression', () => {
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

  it('TC02 - Verify Successful Check-In', async () => {
    // Set designated site geofence location (configured via env or defaults to site coordinates)
    await technicianIosAttendanceScreen.setGeofenceLocation();

    // 1. Open Mark Attendance
    await technicianIosHomeScreen.openAttendance();
    await technicianIosAttendanceScreen.waitForDisplayed();
    await technicianIosAttendanceScreen.openMarkAttendance();

    // 2. Verify Inside Geofence status
    await technicianIosAttendanceScreen.verifyInsideGeofence();

    // 3. Open Camera & 4. Capture photo
    await technicianIosAttendanceScreen.openCameraAndCaptureSelfie();

    // 5. Complete the check-in
    await technicianIosAttendanceScreen.tapCheckInButton();
    await browser.pause(2000);

    // Expected Result 1: Current status updates to Checked IN
    await technicianIosAttendanceScreen.verifyCheckedInStatus();

    // Expected Result 2: Get the exact recorded check-in timestamp from LAST LOG
    const recordedInTime = await technicianIosAttendanceScreen.getLastRecordedPunchTime('IN');
    console.log(`Recorded Check-IN time: ${recordedInTime}`);

    // Expected Result 3: Verify the same time is reflected at the first (top) position in My Attendance calendar logs
    await technicianIosAttendanceScreen.verifyFirstLogEntryMatchesRecordedTime(recordedInTime, 'IN');
  });

  it('TC03 - Verify Successful Check-Out', async () => {
    // Set designated site geofence location (configured via env or defaults to site coordinates)
    await technicianIosAttendanceScreen.setGeofenceLocation();

    // 1. Open Mark Attendance
    await technicianIosHomeScreen.openAttendance();
    await technicianIosAttendanceScreen.waitForDisplayed();
    await technicianIosAttendanceScreen.openMarkAttendance();

    // 2. Verify inside geofence
    await technicianIosAttendanceScreen.verifyInsideGeofence();

    // 3. Open Camera & 4. Capture photo
    await technicianIosAttendanceScreen.openCameraAndCaptureSelfie();

    // 5. Complete the check-out
    await technicianIosAttendanceScreen.tapCheckOutButton();
    await browser.pause(2000);

    // Expected Result 1: Current status updates to Checked OUT
    await technicianIosAttendanceScreen.verifyCheckedOutStatus();

    // Expected Result 2: Get the exact recorded check-out timestamp from LAST LOG
    const recordedOutTime = await technicianIosAttendanceScreen.getLastRecordedPunchTime('OUT');
    console.log(`Recorded Check-OUT time: ${recordedOutTime}`);

    // Expected Result 3: Verify the same time is reflected at the first (top) position in My Attendance calendar logs
    await technicianIosAttendanceScreen.verifyFirstLogEntryMatchesRecordedTime(recordedOutTime, 'OUT');
  });
});
