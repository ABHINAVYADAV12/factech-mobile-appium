import { $, $$, expect, browser } from '@wdio/globals';

export const technicianIosWorkOrderInstructionScreen = {
  // --- Locators ---

  get checklistHeader() {
    return $(
      '//XCUIElementTypeStaticText[contains(@name, "Checklist") or contains(@label, "Checklist")]',
    );
  },

  get progressText() {
    return $('//XCUIElementTypeStaticText[contains(@name, "%") or contains(@label, "%")]');
  },

  get consumptionInput() {
    return $(
      '//XCUIElementTypeTextField[@value="Enter Numerical Value" or @placeholderValue="Enter Numerical Value" or contains(@placeholderValue, "Numerical Value") or contains(@value, "Numerical Value")]',
    );
  },

  get conditionTitle() {
    return $(
      '//*[contains(@name, "Rate Overall Equipment Condition") or contains(@label, "Rate Overall Equipment Condition")]',
    );
  },

  get conditionDropdown() {
    return $(
      '//XCUIElementTypeStaticText[contains(@name, "Rate Overall Equipment Condition")]/ancestor::XCUIElementTypeOther[1]//XCUIElementTypeOther[contains(@name, "Select an option")] | //XCUIElementTypeOther[XCUIElementTypeStaticText[contains(@name, "Rate Overall Equipment Condition")]]//XCUIElementTypeOther[contains(@name, "Select an option")] | (//XCUIElementTypeOther[@name=", Select an option, " or contains(@name, "Select an option")])[last()]',
    );
  },

  get dropdownFirstOption() {
    return $(
      '//XCUIElementTypeTable//XCUIElementTypeCell[1] | //XCUIElementTypeSheet//XCUIElementTypeButton[1] | //XCUIElementTypeScrollView[last()]//XCUIElementTypeOther[@accessible="true" and not(contains(@name, "Select")) and string-length(@name) > 1][1] | //*[@name="Good" or @name="Normal" or @name="Satisfactory" or @name="Average" or @name="Excellent" or @name="Working"]',
    );
  },

  get lastServicedDateButton() {
    return $(
      '//XCUIElementTypeOther[starts-with(@name, "Select Date,") or (contains(@name, "Select Date") and not(contains(@name, "Time")))]',
    );
  },

  get inspectionDateTimeButton() {
    return $(
      '//XCUIElementTypeOther[@name="Select Date/Time, 󰸗" or starts-with(@name, "Select Date/Time") or contains(@name, "Select Date/Time")]',
    );
  },

  get signButton() {
    return $(
      '//XCUIElementTypeOther[@name=", Sign" or contains(@name, "Sign")] | //XCUIElementTypeButton[contains(@name, "Sign")]',
    );
  },

  get signboardSaveButton() {
    return $('//XCUIElementTypeOther[@name="Save"]');
  },

  get markCompleteButton() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Mark as Complete") or contains(@label, "Mark as Complete") or @name="Complete"] | //XCUIElementTypeButton[contains(@name, "Mark as Complete") or contains(@label, "Mark as Complete") or @name="Complete"] | //XCUIElementTypeStaticText[contains(@name, "Mark as Complete") or contains(@label, "Mark as Complete")]',
    );
  },

  // --- Actions ---

  /**
   * Performs a gentle and paced scroll down to avoid skipping past UI items.
   */
  async gentleScrollDown(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await browser.execute('mobile: swipe', { direction: 'up' }).catch(() => {});
      await browser.pause(2000);
    }
  },

  /**
   * Safely dismisses the software keyboard if active.
   */
  async dismissKeyboard(): Promise<void> {
    try {
      // 1. Try clicking any displayed "Done" button from accessory toolbar
      const doneButtons = await $$('~Done');
      for (const btn of doneButtons) {
        if (await btn.isDisplayed().catch(() => false)) {
          await btn.click();
          await browser.pause(800);
          return;
        }
      }

      const anyDoneButtons = await $$('//*[@name="Done" or @label="Done"]');
      for (const btn of anyDoneButtons) {
        if (await btn.isDisplayed().catch(() => false)) {
          await btn.click();
          await browser.pause(800);
          return;
        }
      }

      // 2. Tap outside on the screen title / label to dismiss keyboard
      const titleLabel = $(
        '//XCUIElementTypeStaticText[contains(@name, "Consumption") or contains(@name, "Checklist") or contains(@name, "Smoke Test")]',
      );
      if (await titleLabel.isDisplayed().catch(() => false)) {
        await titleLabel.click();
        await browser.pause(800);
      }

      // 3. Coordinate tap on the top-right toolbar area of the numeric keypad
      if (await browser.isKeyboardShown().catch(() => false)) {
        const { width, height } = await browser.getWindowSize();
        await browser
          .performActions([
            {
              type: 'pointer',
              id: 'finger1',
              parameters: { pointerType: 'touch' },
              actions: [
                {
                  type: 'pointerMove',
                  duration: 0,
                  x: Math.round(width * 0.9),
                  y: Math.round(height * 0.72),
                },
                { type: 'pointerDown', button: 0 },
                { type: 'pointerUp', button: 0 },
              ],
            },
          ])
          .catch(() => {});
        await browser.releaseActions().catch(() => {});
        await browser.pause(800);
      }
    } catch {
      // Keyboard already dismissed or unhandled
    }
  },

  /**
   * Fills Item 3: Consumption mandatory numeric field.
   */
  async fillConsumption(value: string = '10'): Promise<void> {
    if (!(await this.consumptionInput.isDisplayed().catch(() => false))) {
      await this.gentleScrollDown(1);
    }

    if (await this.consumptionInput.isDisplayed().catch(() => false)) {
      await this.consumptionInput.click();
      await browser.pause(500);
      await this.consumptionInput.setValue(value);
      await browser.pause(500);
      await this.dismissKeyboard();
      await browser.pause(1000);
    }
  },

  /**
   * Scrolls gently down until Item 7 (Rate Overall Equipment Condition) is displayed.
   */
  async scrollToConditionItem(): Promise<void> {
    for (let swipe = 0; swipe < 3; swipe++) {
      if (await this.conditionTitle.isDisplayed().catch(() => false)) break;
      if (await this.conditionDropdown.isDisplayed().catch(() => false)) break;
      await this.gentleScrollDown(1);
    }
  },

  /**
   * Selects Item 7: Equipment condition from dropdown (taps first available option).
   */
  async selectEquipmentCondition(): Promise<void> {
    await this.scrollToConditionItem();

    if (await this.conditionDropdown.waitForDisplayed({ timeout: 10_000 }).catch(() => false)) {
      await this.conditionDropdown.click();
      await browser.pause(1500);

      if (await this.dropdownFirstOption.waitForDisplayed({ timeout: 8000 }).catch(() => false)) {
        await this.dropdownFirstOption.click();
        await browser.pause(1000);
      } else {
        const firstCell = $('//XCUIElementTypeCell');
        if (await firstCell.isDisplayed().catch(() => false)) {
          await firstCell.click();
          await browser.pause(1000);
        }
      }
    }
  },

  /**
   * Fills Item 8: Last Serviced Date if not already satisfied.
   */
  async fillLastServicedDate(): Promise<void> {
    if (await this.lastServicedDateButton.isDisplayed().catch(() => false)) {
      await this.lastServicedDateButton.click();
      await browser.pause(1000);

      const doneButtons = await $$('~Done');
      for (const btn of doneButtons) {
        if (await btn.isDisplayed().catch(() => false)) {
          await btn.click();
          await browser.pause(1000);
          break;
        }
      }
    }
  },

  /**
   * Fills Item 9: Inspection Date and Time.
   */
  async fillInspectionDateTime(): Promise<void> {
    if (!(await this.inspectionDateTimeButton.isDisplayed().catch(() => false))) {
      await this.gentleScrollDown(1);
    }

    if (
      await this.inspectionDateTimeButton.waitForDisplayed({ timeout: 10_000 }).catch(() => false)
    ) {
      await this.inspectionDateTimeButton.click();
      await browser.pause(1500);

      const doneButtons = await $$('~Done');
      let clicked = false;
      for (const btn of doneButtons) {
        if (await btn.isDisplayed().catch(() => false)) {
          await btn.click();
          clicked = true;
          await browser.pause(1000);
          break;
        }
      }

      if (!clicked) {
        const doneFallback = $(
          '//XCUIElementTypeButton[@name="Done" or @label="Done"] | //XCUIElementTypeOther[@name="Done"]',
        );
        if (await doneFallback.isDisplayed().catch(() => false)) {
          await doneFallback.click();
          await browser.pause(1000);
        }
      }
    }
  },

  /**
   * Captures Item 10: Technician Signature by moving/dragging cursor on the signboard canvas and saving.
   */
  async signTechnician(): Promise<void> {
    if (!(await this.signButton.isDisplayed().catch(() => false))) {
      await this.gentleScrollDown(1);
    }

    if (await this.signButton.waitForDisplayed({ timeout: 10_000 }).catch(() => false)) {
      await this.signButton.click();
      await browser.pause(2000);

      // Draw signature stroke by moving cursor across the canvas pad
      const { width, height } = await browser.getWindowSize();
      const startX = Math.round(width * 0.25);
      const startY = Math.round(height * 0.45);
      const endX = Math.round(width * 0.75);
      const endY = Math.round(height * 0.45);

      // Perform cursor drag gesture across pad
      await browser
        .execute('mobile: dragFromToForDuration', {
          fromX: startX,
          fromY: startY,
          toX: endX,
          toY: endY,
          duration: 1.0,
        })
        .catch(() => {});

      await browser.pause(500);

      // Fallback touch pointer action
      await browser
        .performActions([
          {
            type: 'pointer',
            id: 'finger1',
            parameters: { pointerType: 'touch' },
            actions: [
              { type: 'pointerMove', duration: 0, x: startX, y: startY },
              { type: 'pointerDown', button: 0 },
              { type: 'pause', duration: 150 },
              { type: 'pointerMove', duration: 400, x: endX, y: endY },
              { type: 'pause', duration: 150 },
              { type: 'pointerUp', button: 0 },
            ],
          },
        ])
        .catch(() => {});
      await browser.releaseActions().catch(() => {});
      await browser.pause(1200);

      // Tap Save button on signboard
      if (await this.signboardSaveButton.waitForDisplayed({ timeout: 8000 }).catch(() => false)) {
        await this.signboardSaveButton.click();
      } else {
        const fallbackSave = $('~Save');
        if (await fallbackSave.isDisplayed().catch(() => false)) {
          await fallbackSave.click();
        }
      }

      await browser.pause(2000);
    }
  },

  /**
   * Gently scrolls to reveal and asserts that "Mark as Complete" button is displayed/enabled.
   */
  async verifyMarkAsCompleteButton(): Promise<void> {
    let isMarkCompleteVisible = await this.markCompleteButton.isDisplayed().catch(() => false);
    for (let swipe = 0; swipe < 4 && !isMarkCompleteVisible; swipe++) {
      await this.gentleScrollDown(1);
      isMarkCompleteVisible = await this.markCompleteButton.isDisplayed().catch(() => false);
    }

    await this.markCompleteButton.waitForDisplayed({
      timeout: 25_000,
      timeoutMsg:
        '"Mark as Complete" button was not displayed after filling mandatory instructions',
    });
    await expect(this.markCompleteButton).toBeDisplayed();
  },

  /**
   * High-level flow: fills all mandatory checklist instructions and asserts "Mark as Complete" appears.
   * - No "Show" button clicking: instructions are already visible on the opened work order.
   * - Item 3: Consumption numeric input
   * - Item 7: Rate Equipment Condition dropdown (selects first option)
   * - Item 8: Last Serviced Date (confirmed if pre-filled, or sets via datepicker)
   * - Item 9: Inspection Date/Time (sets via datepicker Done)
   * - Item 10: Technician Signature (draws stroke by moving cursor and saves)
   * - Asserts "Mark as Complete" button is visible
   */
  async fillMandatoryWorkOrderInstructions(): Promise<void> {
    // Brief initial pause to let opened WO render
    await browser.pause(1000);

    // 1. Item 3: Consumption
    await this.fillConsumption('10');

    // 2. Item 7: Rate Condition (gentle scroll & select option)
    await this.selectEquipmentCondition();

    // 3. Item 8: Last Serviced Date
    await this.fillLastServicedDate();

    // 4. Item 9: Inspection Date/Time
    await this.fillInspectionDateTime();

    // 5. Item 10: Technician Signature
    await this.signTechnician();

    // 6. Assert "Mark as Complete" button appears
    await this.verifyMarkAsCompleteButton();
  },
};
