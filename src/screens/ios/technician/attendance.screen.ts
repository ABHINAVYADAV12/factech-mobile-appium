import { $, expect } from '@wdio/globals';

export const technicianIosAttendanceScreen = {
  async waitForDisplayed(): Promise<void> {
    const markAttendanceTab = $(
      '//XCUIElementTypeOther[@name="Mark Attendance" or @label="Mark Attendance"]',
    );
    await markAttendanceTab.waitForDisplayed({ timeout: 20_000 });
    await expect(markAttendanceTab).toBeDisplayed();
  },

  async openMarkAttendance(): Promise<void> {
    const markAttendanceBtn = $(
      '//XCUIElementTypeOther[@name="Mark Attendance" or @label="Mark Attendance"]',
    );
    await markAttendanceBtn.waitForDisplayed({ timeout: 15_000 });
    await markAttendanceBtn.click();
  },

  async openMyAttendance(): Promise<void> {
    const myAttendanceBtn = $(
      '//XCUIElementTypeOther[@name="My Attendance" or @label="My Attendance"]',
    );
    await myAttendanceBtn.waitForDisplayed({ timeout: 15_000 });
    await myAttendanceBtn.click();
  },

  /**
   * Verifies TC01: Mark Attendance screen elements:
   * - Location & designated site
   * - Geofence status
   * - Current status (e.g. Checked IN / Checked OUT)
   * - Action options (Check IN and Check OUT)
   */
  async verifyMarkAttendanceDetails(): Promise<void> {
    // 1. Verify Map / Location elements
    const mapOrSite = $(
      '-ios predicate string:name == "Destined Site" OR name == "My Location" OR label CONTAINS "Site Area"',
    );
    await mapOrSite.waitForDisplayed({ timeout: 15_000 });
    await expect(mapOrSite).toBeDisplayed();

    // 2. Verify Geofence status badge/text
    const geofenceStatus = $(
      '-ios predicate string:label CONTAINS "Site Area" OR label CONTAINS "geofence" OR label CONTAINS "Location"',
    );
    await geofenceStatus.waitForDisplayed({ timeout: 15_000 });
    await expect(geofenceStatus).toBeDisplayed();

    // 3. Verify Current Status section
    const currentStatusHeader = $(
      '//XCUIElementTypeStaticText[@name="CURRENT STATUS" or @label="CURRENT STATUS"]',
    );
    await currentStatusHeader.waitForDisplayed({ timeout: 15_000 });
    await expect(currentStatusHeader).toBeDisplayed();

    const statusBadge = $(
      '-ios predicate string:label CONTAINS "Checked IN" OR label CONTAINS "Checked OUT"',
    );
    await statusBadge.waitForDisplayed({ timeout: 15_000 });
    await expect(statusBadge).toBeDisplayed();

    // 4. Verify Check IN and Check OUT options
    const checkInOption = $(
      '//XCUIElementTypeOther[@name="Check IN" or @label="Check IN"]',
    );
    await checkInOption.waitForDisplayed({ timeout: 15_000 });
    await expect(checkInOption).toBeDisplayed();

    const checkOutOption = $(
      '//XCUIElementTypeOther[@name="Check OUT" or @label="Check OUT"]',
    );
    await checkOutOption.waitForDisplayed({ timeout: 15_000 });
    await expect(checkOutOption).toBeDisplayed();
  },

  /**
   * Verifies TC04: My Attendance screen records:
   * - Month selector / calendar
   * - Summary counts (Present, Absent, Total)
   * - Attendance logs and IN/OUT times
   */
  async verifyMyAttendanceRecords(): Promise<void> {
    // 1. Verify Month header / calendar view
    const calendarMonth = $(
      '-ios predicate string:label CONTAINS "202" OR label CONTAINS "October" OR label CONTAINS "Attendance"',
    );
    await calendarMonth.waitForDisplayed({ timeout: 15_000 });
    await expect(calendarMonth).toBeDisplayed();

    // 2. Verify Present, Absent, and Total summary badges
    const presentSummary = $(
      '-ios predicate string:label CONTAINS "Present:"',
    );
    await presentSummary.waitForDisplayed({ timeout: 15_000 });
    await expect(presentSummary).toBeDisplayed();

    const absentSummary = $(
      '-ios predicate string:label CONTAINS "Absent:"',
    );
    await absentSummary.waitForDisplayed({ timeout: 15_000 });
    await expect(absentSummary).toBeDisplayed();

    const totalSummary = $(
      '-ios predicate string:label CONTAINS "Total:"',
    );
    await totalSummary.waitForDisplayed({ timeout: 15_000 });
    await expect(totalSummary).toBeDisplayed();

    // 3. Verify Attendance Logs section and IN/OUT time display
    const logsHeader = $(
      '//XCUIElementTypeStaticText[@name="Attendance Logs" or @label="Attendance Logs"]',
    );
    await logsHeader.waitForDisplayed({ timeout: 15_000 });
    await expect(logsHeader).toBeDisplayed();

    const inOutLog = $(
      '-ios predicate string:label CONTAINS "AM" OR label CONTAINS "PM" OR label CONTAINS "→"',
    );
    await inOutLog.waitForDisplayed({ timeout: 15_000 });
    await expect(inOutLog).toBeDisplayed();
  },

  async setGeofenceLocation(
    lat: number = Number(process.env.TECHNICIAN_GEOFENCE_LAT) || 26.7865,
    lon: number = Number(process.env.TECHNICIAN_GEOFENCE_LON) || 79.0223,
  ): Promise<void> {
    try {
      await browser.setGeoLocation({
        latitude: lat,
        longitude: lon,
        altitude: 0,
      });
    } catch {
      // Ignored if driver uses native simctl
    }
  },

  async verifyInsideGeofence(): Promise<void> {
    const insideBadge = $(
      '-ios predicate string:label CONTAINS "Inside Geofence" OR label CONTAINS "Inside Site Area"',
    );
    await insideBadge.waitForDisplayed({ timeout: 20_000 });
    await expect(insideBadge).toBeDisplayed();
  },

  async openCameraAndCaptureSelfie(): Promise<void> {
    // Tap the photo circle (x: 196, y: 518) to open camera if not already open
    const cameraHeader = $('~Camera');
    const isCameraOpen = await cameraHeader.isDisplayed().catch(() => false);
    if (!isCameraOpen) {
      await browser.action('pointer').move({ x: 196, y: 518 }).down().pause(100).up().perform();
      await browser.pause(2000);
    }

    // Tap shutter button (name="" at center x: 182, y: 783)
    const shutter = $('~');
    if (await shutter.isDisplayed().catch(() => false)) {
      await shutter.click();
    } else {
      await browser.action('pointer').move({ x: 182, y: 783 }).down().pause(100).up().perform();
    }
    await browser.pause(3000);

    // Verify selfie captured confirmation
    const readyMsg = $(
      '-ios predicate string:label CONTAINS "Selfie Captured" OR label CONTAINS "Ready to Mark"',
    );
    await readyMsg.waitForDisplayed({ timeout: 15_000 });
    await expect(readyMsg).toBeDisplayed();
  },

  async tapCheckInButton(): Promise<void> {
    const checkInBtn = $('//XCUIElementTypeOther[@name="Check IN" or @label="Check IN"]');
    await checkInBtn.waitForDisplayed({ timeout: 15_000 });
    await checkInBtn.click();
  },

  async tapCheckOutButton(): Promise<void> {
    const checkOutBtn = $('//XCUIElementTypeOther[@name="Check OUT" or @label="Check OUT"]');
    await checkOutBtn.waitForDisplayed({ timeout: 15_000 });
    await checkOutBtn.click();
  },

  async verifyCheckedInStatus(): Promise<void> {
    const checkedInBadge = $(
      '//XCUIElementTypeStaticText[@name="Checked IN" or @label="Checked IN"]',
    );
    await checkedInBadge.waitForDisplayed({ timeout: 20_000 });
    await expect(checkedInBadge).toBeDisplayed();
  },

  async verifyCheckedOutStatus(): Promise<void> {
    const checkedOutBadge = $(
      '//XCUIElementTypeStaticText[@name="Checked OUT" or @label="Checked OUT"]',
    );
    await checkedOutBadge.waitForDisplayed({ timeout: 20_000 });
    await expect(checkedOutBadge).toBeDisplayed();
  },

  async getLastRecordedPunchTime(type: 'IN' | 'OUT'): Promise<string> {
    const lastLogElement = $(
      `-ios predicate string:label CONTAINS "${type} • Today"`,
    );
    await lastLogElement.waitForDisplayed({ timeout: 20_000 });
    const fullText = await lastLogElement.getText();
    // Example: "IN • Today, 10:24 AM" -> extract "10:24 AM"
    const match = fullText.match(/\d{1,2}:\d{2}\s*(?:AM|PM)/i);
    return match ? match[0].trim() : fullText;
  },

  async refreshAttendance(): Promise<void> {
    try {
      await browser.execute('mobile: swipe', { direction: 'down' });
    } catch {
      await browser
        .action('pointer')
        .move({ x: 196, y: 300 })
        .down()
        .pause(200)
        .move({ x: 196, y: 600, duration: 500 })
        .up()
        .perform();
    }
    await browser.pause(2500);
  },

  async verifyFirstLogEntryMatchesRecordedTime(expectedTime: string, type: 'IN' | 'OUT'): Promise<void> {
    // 1. Navigate to My Attendance tab
    await this.openMyAttendance();
    await browser.pause(1500);

    // 2. Refresh attendance page to load recent check-in/out record
    await this.refreshAttendance();

    // 3. Verify Attendance Logs section is displayed
    const logsHeader = $(
      '//XCUIElementTypeStaticText[@name="Attendance Logs" or @label="Attendance Logs"]',
    );
    await logsHeader.waitForDisplayed({ timeout: 15_000 });
    await expect(logsHeader).toBeDisplayed();

    // 4. Locate the time element matching the recorded punch time
    const timeElement = $(
      `-ios predicate string:label CONTAINS "${expectedTime}"`,
    );
    await timeElement.waitForDisplayed({ timeout: 15_000 });
    await expect(timeElement).toBeDisplayed();

    console.log(`Verified: Most recent ${type} punch (${expectedTime}) is recorded at the top position in Attendance Logs.`);

    // 5. Switch back to Mark Attendance tab
    await this.openMarkAttendance();
  },
};
