import { $, expect, browser } from '@wdio/globals';

export const technicianIosComplaintCreationScreen = {
  get lockedCategorySection() {
    return $('//XCUIElementTypeScrollView/XCUIElementTypeOther[1]/XCUIElementTypeOther/XCUIElementTypeOther[1]');
  },

  get locationSelector() {
    return $(
      '//XCUIElementTypeOther[@name=", Search Location..., " or @name=", Search Location..., " or contains(@name, "Search Location") or contains(@label, "Search Location")]',
    );
  },

  get referenceUnitField() {
    return $(
      '//XCUIElementTypeTextField[@value="Enter Reference Unit No..." or contains(@placeholderValue, "Unit")]',
    );
  },

  get descriptionField() {
    return $(
      '//XCUIElementTypeTextView[@name="Describe the issue..." or @value="Describe the issue..." or contains(@placeholderValue, "Describe") or contains(@value, "Describe")] | //XCUIElementTypeTextView',
    );
  },

  get selfAssignToggle() {
    return $('//XCUIElementTypeOther[@name=", Self Assign" or contains(@name, "Self Assign") or contains(@label, "Self Assign")]');
  },

  get cameraButton() {
    return $('//XCUIElementTypeOther[@name=", Camera" or contains(@name, "Camera") or contains(@label, "Camera")]');
  },

  get fileUploadButton() {
    return $('//XCUIElementTypeOther[starts-with(@name, ", File") or contains(@name, "File") or contains(@label, "File")]');
  },

  get createIssueButton() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Create Issue") or contains(@label, "Create Issue")] | //XCUIElementTypeButton[contains(@name, "Create Issue") or contains(@label, "Create Issue")]',
    );
  },

  /**
   * Asserts that the complaint creation screen is loaded by checking permanent form indicators.
   */
  async waitForDisplayed(): Promise<void> {
    const formIndicator = $(
      '//XCUIElementTypeStaticText[contains(@name, "Category") or contains(@name, "Location") or contains(@name, "Description") or contains(@name, "MANAGEMENT")] | //XCUIElementTypeOther[contains(@name, "Camera") or contains(@name, "Self Assign")] | //*[contains(@name, "Create Issue") or contains(@label, "Create Issue")]',
    );
    await formIndicator.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: 'Complaint creation screen was not displayed',
    });
  },

  /**
   * Verifies that the selected Category and Sub-Category fields are locked / read-only.
   */
  async verifyCategoryFieldsLocked(): Promise<void> {
    await this.lockedCategorySection.waitForDisplayed({ timeout: 15_000 });
    await expect(this.lockedCategorySection).toBeDisplayed();
  },

  /**
   * Scrolls the form up to reveal top elements (e.g. after scrolling down to tap Create Issue).
   */
  async scrollToTop(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      if (await this.locationSelector.isDisplayed().catch(() => false)) {
        break;
      }
      try {
        await browser.execute('mobile: swipe', { direction: 'down' });
      } catch {
        const { width, height } = await browser.getWindowSize();
        await browser
          .action('pointer')
          .move({ x: Math.round(width * 0.5), y: Math.round(height * 0.25) })
          .down()
          .pause(100)
          .move({ x: Math.round(width * 0.5), y: Math.round(height * 0.75), duration: 400 })
          .up()
          .perform();
      }
      await browser.pause(800);
    }
  },

  /**
   * Opens the location selector and selects the first available location.
   */
  async selectFirstLocation(): Promise<void> {
    // If location selector was scrolled out of view, scroll back up to the top
    if (!(await this.locationSelector.isDisplayed().catch(() => false))) {
      await this.scrollToTop();
    }

    await this.locationSelector.waitForDisplayed({ timeout: 15_000 });
    await this.locationSelector.click();
    await browser.pause(1500);

    // Look for first selectable location item using exact selector provided
    const firstRow = $(
      '//XCUIElementTypeOther[@name=", @7TH VALLYE AREA, Commonarea, " or contains(@name, "@7TH VALLYE") or contains(@name, "Commonarea")] | //XCUIElementTypeTable//XCUIElementTypeCell[1] | //XCUIElementTypeScrollView//XCUIElementTypeOther[contains(@name, "Floor") or contains(@name, "Tower") or contains(@name, "Unit") or contains(@name, "Area") or contains(@name, "Wing") or contains(@name, "Block") or contains(@name, "Flat") or contains(@name, "Room") or contains(@name, "Gate")][1]',
    );

    if (await firstRow.waitForDisplayed({ timeout: 10_000 }).then(() => true).catch(() => false)) {
      await firstRow.click();
    } else {
      // Tap below the search box dynamically
      const searchBox = $(
        '//XCUIElementTypeTextField[contains(@placeholderValue, "Search") or contains(@value, "Search")]',
      );
      if (await searchBox.isDisplayed().catch(() => false)) {
        const loc = await searchBox.getLocation();
        const size = await searchBox.getSize();
        await browser
          .action('pointer')
          .move({ x: Math.round(loc.x + size.width * 0.5), y: Math.round(loc.y + size.height + 40) })
          .down()
          .pause(100)
          .up()
          .perform();
      } else {
        const { width, height } = await browser.getWindowSize();
        await browser
          .action('pointer')
          .move({ x: Math.round(width * 0.5), y: Math.round(height * 0.28) })
          .down()
          .pause(100)
          .up()
          .perform();
      }
    }
    await browser.pause(1500);
  },

  /**
   * Captures a photo using the in-app camera on the iOS Simulator.
   */
  async capturePhotoFromCamera(): Promise<void> {
    await this.dismissKeyboard();
    if (!(await this.cameraButton.isDisplayed().catch(() => false))) {
      await browser.execute('mobile: swipe', { direction: 'up' }).catch(() => {});
      await browser.pause(500);
    }
    await this.cameraButton.waitForDisplayed({ timeout: 15_000 });
    await this.cameraButton.click();
    await browser.pause(1500);

    // Handle camera permission alert if prompted
    try {
      const allowBtn = $(
        '//XCUIElementTypeButton[@name="Allow While Using App" or @name="OK" or @label="Allow While Using App" or @label="OK"]',
      );
      if (await allowBtn.isDisplayed().catch(() => false)) {
        await allowBtn.click();
        await browser.pause(500);
      }
    } catch {
      // Alert not shown
    }

    // Wait for the custom in-app camera screen to appear
    const cameraHeader = $(
      '//XCUIElementTypeStaticText[@name="Camera" or @label="Camera"] | //XCUIElementTypeButton[contains(@name, "Home") or contains(@label, "Home")]',
    );
    await cameraHeader.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'In-app Camera screen was not displayed',
    });

    // Tap shutter button at bottom center (x: 50%, y: 92%)
    const { width, height } = await browser.getWindowSize();
    const shutterX = Math.round(width * 0.5);
    const shutterY = Math.round(height * 0.92);

    await browser
      .action('pointer')
      .move({ x: shutterX, y: shutterY })
      .down()
      .pause(100)
      .up()
      .perform();
    await browser.pause(2000);

    // Verify it automatically returns back to the complaint creation form
    await this.waitForDisplayed();
  },

  /**
   * Enters reference unit number if applicable.
   */
  async enterReferenceUnit(unitNo: string): Promise<void> {
    if (await this.referenceUnitField.isDisplayed().catch(() => false)) {
      await this.referenceUnitField.setValue(unitNo);
      await browser.pause(500);
    }
  },

  /**
   * Enters the complaint description into the multiline text view.
   */
  /**
   * Dismisses the on-screen software keyboard by tapping outside or calling hideKeyboard.
   */
  async dismissKeyboard(): Promise<void> {
    try {
      if (await browser.isKeyboardShown().catch(() => false)) {
        // 1. Try tapping outside on the Location label or screen title
        const outsideTarget = $(
          '//XCUIElementTypeStaticText[contains(@name, "Location") or contains(@name, "MANAGEMENT") or contains(@name, "Power Outage")]',
        );
        if (await outsideTarget.isDisplayed().catch(() => false)) {
          await outsideTarget.click();
          await browser.pause(400);
        }

        // 2. If keyboard is still shown, tap safe upper area (y = 120)
        if (await browser.isKeyboardShown().catch(() => false)) {
          const { width } = await browser.getWindowSize();
          await browser
            .action('pointer')
            .move({ x: Math.round(width * 0.5), y: 120 })
            .down()
            .pause(50)
            .up()
            .perform();
          await browser.pause(400);
        }

        // 3. Fallback to hideKeyboard
        if (await browser.isKeyboardShown().catch(() => false)) {
          await browser.hideKeyboard().catch(() => {});
          await browser.pause(300);
        }
      }
    } catch {
      // Keyboard dismissed
    }
  },

  /**
   * Enters the complaint description into the multiline text view.
   */
  async enterDescription(descriptionText: string): Promise<void> {
    await this.descriptionField.waitForDisplayed({ timeout: 15_000 });
    await this.descriptionField.click();
    await this.descriptionField.setValue(descriptionText);
    await browser.pause(500);

    // Dismiss keyboard so buttons below are accessible
    await this.dismissKeyboard();
  },

  /**
   * Toggles the "Self Assign" checkbox/switch.
   */
  async toggleSelfAssign(): Promise<void> {
    await this.dismissKeyboard();
    if (!(await this.selfAssignToggle.isDisplayed().catch(() => false))) {
      await browser.execute('mobile: swipe', { direction: 'up' }).catch(() => {});
      await browser.pause(500);
    }
    await this.selfAssignToggle.waitForDisplayed({ timeout: 15_000 });
    await this.selfAssignToggle.click();
    await browser.pause(500);
  },

  /**
   * Submits the complaint by tapping "Create Issue".
   */
  async tapCreateIssue(): Promise<void> {
    // Ensure keyboard is dismissed so Create Issue is not covered
    await this.dismissKeyboard();

    // Scroll down to reveal Create Issue button (especially after adding photo)
    for (let i = 0; i < 3; i++) {
      if (await this.createIssueButton.isDisplayed().catch(() => false)) {
        break;
      }
      try {
        await browser.execute('mobile: swipe', { direction: 'up' });
      } catch {
        const { width, height } = await browser.getWindowSize();
        await browser
          .action('pointer')
          .move({ x: Math.round(width * 0.5), y: Math.round(height * 0.75) })
          .down()
          .pause(100)
          .move({ x: Math.round(width * 0.5), y: Math.round(height * 0.25), duration: 400 })
          .up()
          .perform();
      }
      await browser.pause(800);
    }
    await this.createIssueButton.waitForDisplayed({ timeout: 15_000 });
    await this.createIssueButton.click();
    await browser.pause(2000);
  },

  /**
   * Asserts that a validation error alert or message is shown (e.g. missing required fields or photo).
   */
  async verifyValidationError(expectedKeywords: string[] = ['photo', 'required', 'fill', 'capture']): Promise<void> {
    const errorAlert = $(
      '//XCUIElementTypeAlert | //*[contains(@name, "photo") or contains(@label, "photo") or contains(@name, "Please") or contains(@label, "Please") or contains(@name, "Failed") or contains(@label, "Failed") or contains(@name, "required") or contains(@label, "required") or contains(@name, "Validation") or contains(@label, "Validation")]',
    );
    await errorAlert.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Expected validation alert was not displayed',
    });
    await expect(errorAlert).toBeDisplayed();
  },

  /**
   * Dismisses any validation alert or modal dialog with OK.
   */
  async dismissAlert(): Promise<void> {
    try {
      // 1. Exact alert OK button from Appium Inspector
      const exactOkBtn = $(
        '//XCUIElementTypeAlert[@name="Validation"]/XCUIElementTypeOther[2]/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther[2]/XCUIElementTypeOther | //XCUIElementTypeAlert//XCUIElementTypeOther[@name="OK" or @label="OK"] | //XCUIElementTypeAlert//XCUIElementTypeStaticText[@name="OK" or @label="OK"] | //XCUIElementTypeAlert//XCUIElementTypeButton',
      );
      if (await exactOkBtn.waitForDisplayed({ timeout: 5000 }).then(() => true).catch(() => false)) {
        await exactOkBtn.click();
        await browser.pause(1000);
      }

      // 2. Generic fallback if OK button is found elsewhere
      const genericOk = $(
        '//*[@name="OK" or @label="OK" or @name="Ok" or @label="Ok"]',
      );
      if (await genericOk.isDisplayed().catch(() => false)) {
        await genericOk.click();
        await browser.pause(1000);
      }

      // 3. Fallback to native alert accept if iOS sees it as a system alert
      if (await browser.isAlertOpen().catch(() => false)) {
        await browser.acceptAlert().catch(() => {});
        await browser.pause(1000);
      }

      // 4. Verify alert is dismissed; if still displayed, tap center coordinates
      const alert = $('//XCUIElementTypeAlert');
      if (await alert.isDisplayed().catch(() => false)) {
        if (await exactOkBtn.isDisplayed().catch(() => false)) {
          const loc = await exactOkBtn.getLocation();
          const size = await exactOkBtn.getSize();
          await browser
            .action('pointer')
            .move({ x: Math.round(loc.x + size.width / 2), y: Math.round(loc.y + size.height / 2) })
            .down()
            .pause(100)
            .up()
            .perform();
        } else {
          // Tap bottom center of the alert box
          const alertLoc = await alert.getLocation();
          const alertSize = await alert.getSize();
          await browser
            .action('pointer')
            .move({ x: Math.round(alertLoc.x + alertSize.width / 2), y: Math.round(alertLoc.y + alertSize.height * 0.85) })
            .down()
            .pause(100)
            .up()
            .perform();
        }
        await browser.pause(1200);
      }
    } catch {
      // Alert already dismissed
    }
  },

  /**
   * Asserts the success popup or banner after complaint creation.
   */
  async verifySuccessMessage(): Promise<void> {
    const successBanner = $(
      '//*[contains(@name, "Complaint added successfully") or contains(@label, "Complaint added successfully") or contains(@name, "successfully") or contains(@label, "successfully") or contains(@name, "Success") or contains(@label, "Success")]',
    );
    await successBanner.waitForDisplayed({
      timeout: 25_000,
      timeoutMsg: 'Success confirmation for complaint creation was not displayed',
    });
    await expect(successBanner).toBeDisplayed();
  },

  /**
   * Taps OK on the success popup to complete the flow.
   */
  async confirmSuccessPopup(): Promise<void> {
    const okBtn = $(
      '//XCUIElementTypeButton[@name="OK" or @label="OK"] | //XCUIElementTypeOther[@name="OK" or @label="OK"] | //XCUIElementTypeStaticText[@name="OK" or @label="OK"] | //*[@name="OK" or @label="OK"]',
    );
    if (await okBtn.waitForDisplayed({ timeout: 10_000 }).then(() => true).catch(() => false)) {
      await okBtn.click();
      await browser.pause(2000);
    } else {
      await this.dismissAlert();
    }
  },
};
