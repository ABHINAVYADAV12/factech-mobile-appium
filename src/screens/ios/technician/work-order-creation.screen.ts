import { $, $$, expect, browser } from '@wdio/globals';

export const technicianIosWorkOrderCreationScreen = {
  // --- Top Navigation Tabs ---

  get manualTab() {
    return $(
      '//XCUIElementTypeOther[@name="Manual" or @label="Manual"] | //XCUIElementTypeButton[@name="Manual" or @label="Manual"] | //XCUIElementTypeStaticText[@name="Manual" or @label="Manual"]',
    );
  },

  get templatesTab() {
    return $(
      '//XCUIElementTypeOther[@name="Templates" or @label="Templates"] | //XCUIElementTypeButton[@name="Templates" or @label="Templates"] | //XCUIElementTypeStaticText[@name="Templates" or @label="Templates"]',
    );
  },

  // --- Sub-Tabs under Manual (Work Order vs Breakdown) ---

  get workOrderModeButton() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Work Order") or contains(@label, "Work Order")] | //XCUIElementTypeButton[contains(@name, "Work Order") or contains(@label, "Work Order")]',
    );
  },

  get breakdownModeButton() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Breakdown") or contains(@label, "Breakdown")] | //XCUIElementTypeButton[contains(@name, "Breakdown") or contains(@label, "Breakdown")]',
    );
  },

  // --- Manual Work Order Form Fields ---

  get assetSearchField() {
    return $(
      '//XCUIElementTypeTextField[contains(@placeholderValue, "Search and select an asset") or contains(@value, "Search and select an asset")] | //XCUIElementTypeOther[contains(@name, "Search and select an asset") or contains(@label, "Search and select an asset")]',
    );
  },

  get typeDropdown() {
    return $(
      '(//*[(@name="Select" or @label="Select") and not(contains(@name, "date"))])[1] | //XCUIElementTypeStaticText[contains(@name, "TYPE")]/..',
    );
  },

  get priorityDropdown() {
    return $(
      '(//*[(@name="Select" or @label="Select") and not(contains(@name, "date"))])[last()] | //XCUIElementTypeStaticText[contains(@name, "PRIORITY")]/..',
    );
  },

  get nameField() {
    return $(
      '//XCUIElementTypeTextField[contains(@placeholderValue, "Enter work order name") or @value="Enter work order name" or contains(@value, "work order name")]',
    );
  },

  get dueDateField() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Select date") or contains(@label, "Select date")] | //XCUIElementTypeTextField[contains(@placeholderValue, "Select date") or contains(@value, "Select date")]',
    );
  },

  get estimatedTimeField() {
    return $(
      '//XCUIElementTypeTextField[contains(@placeholderValue, "2.5") or contains(@value, "2.5") or contains(@placeholderValue, "e.g.")]',
    );
  },

  get createWorkOrderButton() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Create Work Order") or contains(@label, "Create Work Order")] | //XCUIElementTypeButton[contains(@name, "Create Work Order") or contains(@label, "Create Work Order")]',
    );
  },

  // --- Breakdown Specific Fields ---

  get breakdownHoursField() {
    return $(
      '(//XCUIElementTypeStaticText[contains(@name, "BREAKDOWN HOURS") or contains(@label, "BREAKDOWN HOURS")]/following::XCUIElementTypeTextField)[1] | //XCUIElementTypeTextField[contains(@value, "Total breakdown hours") or contains(@placeholderValue, "Total breakdown hours") or contains(@value, "breakdown") or contains(@placeholderValue, "breakdown")]',
    );
  },

  get remarkField() {
    return $(
      '//XCUIElementTypeTextView[contains(@placeholderValue, "Add a remark") or contains(@value, "Add a remark") or contains(@name, "Add a remark")] | //XCUIElementTypeTextField[contains(@placeholderValue, "Add a remark") or contains(@value, "Add a remark")]',
    );
  },

  get addPhotoButton() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Add Photo") or contains(@label, "Add Photo")] | //XCUIElementTypeButton[contains(@name, "Add Photo") or contains(@label, "Add Photo")]',
    );
  },

  get createBreakdownButton() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Create Breakdown") or contains(@label, "Create Breakdown")] | //XCUIElementTypeButton[contains(@name, "Create Breakdown") or contains(@label, "Create Breakdown")] | //XCUIElementTypeStaticText[contains(@name, "Create Breakdown") or contains(@label, "Create Breakdown")] | //*[contains(@name, "Create Breakdown") or contains(@label, "Create Breakdown")]',
    );
  },

  // --- Templates Tab Elements ---

  get searchTemplatesField() {
    return $(
      '//XCUIElementTypeTextField[contains(@placeholderValue, "Search templates") or contains(@value, "Search templates") or contains(@name, "Search templates")] | //XCUIElementTypeSearchField[contains(@placeholderValue, "Search templates") or contains(@value, "Search templates") or contains(@name, "Search templates")] | //XCUIElementTypeOther[contains(@name, "Search templates") or contains(@label, "Search templates")] | //*[contains(@placeholderValue, "Search templates") or contains(@value, "Search templates")]',
    );
  },

  get firstTemplateCard() {
    return $(
      '//XCUIElementTypeOther[@name=", LB Daily Garbage Room COPY, , PM, , test"] | //XCUIElementTypeOther[contains(@name, "LB Daily Garbage Room COPY")] | //XCUIElementTypeOther[contains(@name, ", PM,")]',
    );
  },

  // --- Alert / Modal Popup Elements ---

  get alertOkButton() {
    return $(
      '//XCUIElementTypeButton[@name="OK" or @label="OK"] | //XCUIElementTypeOther[@name="OK" or @label="OK"] | //XCUIElementTypeStaticText[@name="OK" or @label="OK"] | //*[@name="OK" or @label="OK"]',
    );
  },

  get alertCloseButton() {
    return $(
      '//XCUIElementTypeButton[@name="✕" or @name="x" or @name="X" or contains(@name, "close")] | //XCUIElementTypeOther[@name="✕" or @name="x" or @name="X"]',
    );
  },

  // --- Actions ---

  /**
   * Asserts that the Work Order creation screen is loaded by verifying top tabs.
   */
  async waitForDisplayed(): Promise<void> {
    const indicator = $(
      '//XCUIElementTypeOther[@name="Manual" or @label="Manual"] | //XCUIElementTypeOther[@name="Templates" or @label="Templates"] | //XCUIElementTypeStaticText[contains(@name, "Manual")]',
    );
    await indicator.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: 'Work Order creation screen was not displayed',
    });
  },

  /**
   * Switches to the Manual tab.
   */
  async switchToManual(): Promise<void> {
    await this.manualTab.waitForDisplayed({ timeout: 10_000 });
    await this.manualTab.click();
    await browser.pause(1000);
  },

  /**
   * Switches to the Templates tab.
   */
  async switchToTemplates(): Promise<void> {
    await this.templatesTab.waitForDisplayed({ timeout: 10_000 });
    await this.templatesTab.click();
    await browser.pause(2000);
  },

  /**
   * Selects the 'Work Order' sub-tab under Manual.
   */
  async selectWorkOrderMode(): Promise<void> {
    await this.workOrderModeButton.waitForDisplayed({ timeout: 10_000 });
    await this.workOrderModeButton.click();
    await browser.pause(1000);
  },

  /**
   * Selects the 'Breakdown' sub-tab under Manual.
   */
  async selectBreakdownMode(): Promise<void> {
    await this.breakdownModeButton.waitForDisplayed({ timeout: 10_000 });
    await this.breakdownModeButton.click();
    await browser.pause(1000);
  },

  /**
   * Safely dismisses the keyboard if active.
   */
  async dismissKeyboard(): Promise<void> {
    const keyboard = $('//XCUIElementTypeKeyboard');
    if (!(await keyboard.isDisplayed().catch(() => false))) {
      return;
    }

    // 1. Try tapping the Return or Done button on the keyboard
    const returnOrDoneBtn = $(
      '//XCUIElementTypeKeyboard//XCUIElementTypeButton[@name="Return" or @name="return" or @name="Done" or @name="done" or @name="Search" or @name="Hide keyboard"] | //XCUIElementTypeButton[@name="Done" or @name="Return"]',
    );
    if (await returnOrDoneBtn.isDisplayed().catch(() => false)) {
      await returnOrDoneBtn.click();
      await browser.pause(500);
      if (!(await keyboard.isDisplayed().catch(() => false))) {
        return;
      }
    }

    // 2. Tap neutral form label or empty space to dismiss/blur numeric keypad
    try {
      const neutralLabel = $(
        '//XCUIElementTypeStaticText[contains(@name, "BREAKDOWN HOURS") or contains(@name, "REMARK") or contains(@name, "NAME") or contains(@name, "RR MANAGEMENT")]',
      );
      if (await neutralLabel.isDisplayed().catch(() => false)) {
        await neutralLabel.click();
        await browser.pause(500);
        if (!(await keyboard.isDisplayed().catch(() => false))) {
          return;
        }
      }
    } catch {
      // Ignore
    }

    // 3. Tap empty space on screen (e.g. x: 50, y: 120)
    try {
      await browser.execute('mobile: tap', { x: 50, y: 120 });
      await browser.pause(500);
      if (!(await keyboard.isDisplayed().catch(() => false))) {
        return;
      }
    } catch {
      // Ignore
    }

    // 4. Try Appium's mobile: hideKeyboard command
    try {
      await browser.execute('mobile: hideKeyboard', { strategy: 'tapOutside' });
      await browser.pause(500);
      if (!(await keyboard.isDisplayed().catch(() => false))) {
        return;
      }
    } catch {
      // Ignore
    }
  },

  /**
   * Scrolls the form back to the top.
   */
  async scrollToTop(): Promise<void> {
    for (let i = 0; i < 2; i++) {
      await browser.execute('mobile: swipe', { direction: 'down' }).catch(() => {});
      await browser.pause(500);
    }
  },

  /**
   * Searches and selects an asset (defaults to 'Formula Asset with nfc').
   */
  async selectAsset(assetName: string = 'Formula Asset with nfc'): Promise<void> {
    if (!(await this.assetSearchField.isDisplayed().catch(() => false))) {
      await this.scrollToTop();
    }
    await this.assetSearchField.waitForDisplayed({ timeout: 10_000 });
    await this.assetSearchField.click();
    await browser.pause(1000);

    const searchInput = $(
      '//XCUIElementTypeTextField[@placeholderValue="Search assets..." or contains(@placeholderValue, "Search and select") or contains(@placeholderValue, "Search")] | //XCUIElementTypeTextField',
    );
    if (await searchInput.isDisplayed().catch(() => false)) {
      await searchInput.setValue(assetName);
      await browser.pause(1500);
    }

    const matchingAsset = $(
      `//*[contains(@name, "${assetName}") or contains(@label, "${assetName}")]`,
    );
    await matchingAsset.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Asset "${assetName}" was not found in asset search list`,
    });
    await matchingAsset.click();
    await browser.pause(1500);
  },

  /**
   * Selects an option from the Type dropdown (defaults to 1st option: 'Planned').
   */
  async selectType(typeName: string = 'Planned'): Promise<void> {
    const optionSelector = `//*[(@name="${typeName}" or @label="${typeName}") or (contains(@name, "${typeName}") and not(contains(@name, "TYPE")))]`;
    let option = $(optionSelector);

    if (!(await option.isDisplayed().catch(() => false))) {
      const typeTrigger = $(
        '(//*[(@name="Select" or @label="Select") and not(contains(@name, "date"))])[1] | //XCUIElementTypeStaticText[contains(@name, "TYPE")]/..',
      );
      await typeTrigger.waitForDisplayed({ timeout: 10_000 });
      await typeTrigger.click();
      await browser.pause(1000);
    }

    option = $(optionSelector);
    await option.waitForDisplayed({
      timeout: 10_000,
      timeoutMsg: `Option "${typeName}" was not displayed in Type dropdown`,
    });
    await option.click();
    await browser.pause(1000);
  },

  /**
   * Selects an option from the Priority dropdown (defaults to 1st option: 'Normal').
   */
  async selectPriority(priorityName: string = 'Normal'): Promise<void> {
    const optionSelector = `//*[(@name="${priorityName}" or @label="${priorityName}") or (contains(@name, "${priorityName}") and not(contains(@name, "PRIORITY")))]`;
    let option = $(optionSelector);

    if (!(await option.isDisplayed().catch(() => false))) {
      const priorityTrigger = $(
        '//*[(@name="Select" or @label="Select") and not(contains(@name, "date"))] | //XCUIElementTypeStaticText[contains(@name, "PRIORITY")]/..',
      );
      await priorityTrigger.waitForDisplayed({ timeout: 10_000 });
      await priorityTrigger.click();
      await browser.pause(1000);
    }

    option = $(optionSelector);
    await option.waitForDisplayed({
      timeout: 10_000,
      timeoutMsg: `Option "${priorityName}" was not displayed in Priority dropdown`,
    });
    await option.click();
    await browser.pause(1000);
  },

  /**
   * Opens the Due Date picker wheel, advances to the next day generally (not hardcoded),
   * and scrolls down to dismiss the picker and reveal the Create Work Order button.
   */
  async selectDueDate(): Promise<void> {
    await this.dueDateField.waitForDisplayed({ timeout: 10_000 });
    await this.dueDateField.click();
    await browser.pause(1000);

    const dayWheel = $('(//XCUIElementTypePickerWheel)[1]');
    if (await dayWheel.waitForDisplayed({ timeout: 5000 }).catch(() => false)) {
      let selectedNext = false;
      try {
        await browser.execute('mobile: selectPickerWheelValue', {
          element: dayWheel,
          order: 'next',
          offset: 0.15,
        });
        selectedNext = true;
      } catch {
        // Fallback if selectPickerWheelValue is not supported
      }

      if (!selectedNext) {
        try {
          const currentVal =
            (await dayWheel.getValue().catch(() => '')) ||
            (await dayWheel.getText().catch(() => ''));
          const dayMatch = currentVal.match(/\d+/);
          if (dayMatch) {
            const nextDay = String(parseInt(dayMatch[0], 10) + 1);
            await dayWheel.addValue(nextDay);
            selectedNext = true;
          }
        } catch {
          // Fallback to drag
        }
      }

      if (!selectedNext) {
        try {
          const loc = await dayWheel.getLocation();
          const sz = await dayWheel.getSize();
          await browser.execute('mobile: dragFromToForDuration', {
            fromX: loc.x + sz.width / 2,
            fromY: loc.y + sz.height * 0.65,
            toX: loc.x + sz.width / 2,
            toY: loc.y + sz.height * 0.35,
            duration: 0.5,
          });
        } catch {
          // Ignore
        }
      }

      await browser.pause(800);
    }

    // Scroll down to dismiss picker and bring Create button into view
    await browser.execute('mobile: swipe', { direction: 'up' });
    await browser.pause(1000);
  },

  /**
   * Fills all mandatory fields for creating a Work Order.
   */
  async fillWorkOrderMandatoryFields(details?: {
    asset?: string;
    type?: string;
    priority?: string;
    name?: string;
  }): Promise<void> {
    const assetName = details?.asset || 'Formula Asset with nfc';
    const typeName = details?.type || 'Planned';
    const priorityName = details?.priority || 'Normal';
    const name = details?.name || `Auto WO ${Date.now().toString().slice(-4)}`;

    // 1. Asset selection
    await this.selectAsset(assetName);

    // 2. Type selection (default 1st option: 'Planned')
    await this.selectType(typeName);

    // 3. Priority selection (default 1st option: 'Normal')
    await this.selectPriority(priorityName);

    // 4. Name input
    await this.enterWorkOrderName(name);
    await this.dismissKeyboard();

    // 5. Due date selection (scrolls to next day and scrolls down to Create button)
    await this.selectDueDate();
  },

  /**
   * Enters the Work Order Name.
   */
  async enterWorkOrderName(name: string): Promise<void> {
    await this.nameField.waitForDisplayed({ timeout: 10_000 });
    await this.nameField.click();
    await this.nameField.setValue(name);
    await browser.pause(500);
    await this.dismissKeyboard();
  },

  /**
   * Enters the Breakdown Hours.
   */
  async enterBreakdownHours(hours: string = '2'): Promise<void> {
    const field = this.breakdownHoursField;
    await field.waitForDisplayed({
      timeout: 10_000,
      timeoutMsg: 'Breakdown hours field was not displayed',
    });
    await field.click();
    await browser.pause(500);
    await field.setValue(hours);
    await browser.pause(500);

    // Tap outside to blur and dismiss the numeric keypad
    const breakdownLabel = $(
      '//XCUIElementTypeStaticText[contains(@name, "BREAKDOWN HOURS") or contains(@label, "BREAKDOWN HOURS")]',
    );
    if (await breakdownLabel.isDisplayed().catch(() => false)) {
      await breakdownLabel.click().catch(() => {});
      await browser.pause(500);
    } else {
      await browser.execute('mobile: tap', { x: 50, y: 150 }).catch(() => {});
      await browser.pause(500);
    }

    await this.dismissKeyboard();
  },

  /**
   * Enters a breakdown remark.
   */
  async enterRemark(remark: string): Promise<void> {
    if (!(await this.remarkField.isDisplayed().catch(() => false))) {
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(500);
    }
    await this.remarkField.waitForDisplayed({ timeout: 10_000 });
    await this.remarkField.click();
    await this.remarkField.setValue(remark);
    await browser.pause(500);
    await this.dismissKeyboard();
  },

  /**
   * Fills all mandatory fields for creating a Breakdown.
   */
  async fillBreakdownMandatoryFields(details?: {
    asset?: string;
    type?: string;
    priority?: string;
    name?: string;
    hours?: string;
    remark?: string;
  }): Promise<void> {
    const assetName = details?.asset || 'Formula Asset with nfc';
    const typeName = details?.type || 'Planned';
    const priorityName = details?.priority || 'Normal';
    const name = details?.name || `Auto BD ${Date.now().toString().slice(-4)}`;
    const hours = details?.hours || '2';

    // 1. Asset selection
    await this.selectAsset(assetName);

    // 2. Type selection (default 1st option: 'Planned')
    await this.selectType(typeName);

    // 3. Priority selection (default 1st option: 'Normal')
    await this.selectPriority(priorityName);

    // 4. Name input
    await this.enterWorkOrderName(name);
    await this.dismissKeyboard();

    // 5. Due date selection (scrolls to next day and scrolls down)
    await this.selectDueDate();

    // 6. Breakdown hours input
    await this.enterBreakdownHours(hours);

    // 7. Optional remark
    if (details?.remark) {
      await this.enterRemark(details.remark);
    }
  },

  /**
   * Taps the 'Create Work Order' button.
   */
  async tapCreateWorkOrder(): Promise<void> {
    let isDisplayed = await this.createWorkOrderButton.isDisplayed().catch(() => false);
    for (let swipe = 0; swipe < 3 && !isDisplayed; swipe++) {
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(800);
      isDisplayed = await this.createWorkOrderButton.isDisplayed().catch(() => false);
    }
    await this.createWorkOrderButton.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Create Work Order button was not displayed',
    });
    await this.createWorkOrderButton.click();
    await browser.pause(1500);
  },

  /**
   * Taps the 'Create Breakdown' button.
   */
  async tapCreateBreakdown(): Promise<void> {
    let isDisplayed = await this.createBreakdownButton.isDisplayed().catch(() => false);
    for (let swipe = 0; swipe < 3 && !isDisplayed; swipe++) {
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(800);
      isDisplayed = await this.createBreakdownButton.isDisplayed().catch(() => false);
    }
    await this.createBreakdownButton.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Create Breakdown button was not displayed',
    });
    await this.createBreakdownButton.click();
    await browser.pause(1500);
  },

  /**
   * Clicks on a template from the Templates tab (either by keyword or the first available template).
   */
  async clickTemplate(keyword?: string): Promise<void> {
    await browser.pause(1000);

    const alertModal = $(
      '//*[contains(@name, "Are you sure you want to create WO from this PM") or contains(@label, "Are you sure you want to create WO from this PM")]',
    );

    if (keyword) {
      await this.searchTemplatesField.waitForDisplayed({ timeout: 10_000 });
      await this.searchTemplatesField.setValue(keyword);
      await browser.pause(1500);
      const matchingTemplate = $(
        `//XCUIElementTypeOther[contains(@name, "${keyword}") or contains(@label, "${keyword}")] | //XCUIElementTypeStaticText[contains(@name, "${keyword}") or contains(@label, "${keyword}")]`,
      );
      await matchingTemplate.waitForDisplayed({ timeout: 10_000 });
      await matchingTemplate.click();
    } else {
      const template = this.firstTemplateCard;

      await template.waitForDisplayed({
        timeout: 20_000,
        timeoutMsg: 'Template card was not displayed in Templates tab',
      });

      // 1. Click the template card container
      await template.click();
      await browser.pause(1000);

      // 2. If modal didn't appear on first click, fallback to coordinate tap
      if (!(await alertModal.isDisplayed().catch(() => false))) {
        const loc = await template.getLocation();
        const sz = await template.getSize();
        await browser.execute('mobile: tap', {
          x: Math.round(loc.x + sz.width / 2),
          y: Math.round(loc.y + sz.height / 2),
        });
        await browser.pause(1200);
      }
    }

    await browser.pause(1000);
  },

  // --- Alert Assertion & Handling Methods ---

  /**
   * Asserts the validation popup: "Please fill in all required fields." and dismisses it.
   */
  async verifyRequiredFieldsAlert(): Promise<void> {
    const alertMsg = $(
      '//XCUIElementTypeStaticText[contains(@name, "Please fill in all required fields") or contains(@label, "Please fill in all required fields")]',
    );
    await alertMsg.waitForDisplayed({
      timeout: 10_000,
      timeoutMsg: '"Please fill in all required fields." alert was not displayed',
    });
    await expect(alertMsg).toBeDisplayed();

    await this.alertOkButton.waitForDisplayed({ timeout: 5000 });
    await this.alertOkButton.click();
    await browser.pause(1000);
  },

  /**
   * Asserts the success popup: "Work order created!" and confirms it.
   */
  async verifyWorkOrderCreatedAlert(): Promise<void> {
    const alertMsg = $(
      '//XCUIElementTypeStaticText[contains(@name, "Work order created") or contains(@label, "Work order created")]',
    );
    await alertMsg.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: '"Work order created!" alert was not displayed',
    });
    await expect(alertMsg).toBeDisplayed();

    await this.alertOkButton.waitForDisplayed({ timeout: 5000 });
    await this.alertOkButton.click();
    await browser.pause(1500);
  },

  /**
   * Asserts the success popup: "Breakdown created!" and confirms it.
   */
  async verifyBreakdownCreatedAlert(): Promise<void> {
    const alertMsg = $(
      '//XCUIElementTypeStaticText[contains(@name, "Breakdown created") or contains(@label, "Breakdown created")]',
    );
    await alertMsg.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: '"Breakdown created!" alert was not displayed',
    });
    await expect(alertMsg).toBeDisplayed();

    await this.alertOkButton.waitForDisplayed({ timeout: 5000 });
    await this.alertOkButton.click();
    await browser.pause(1500);
  },

  /**
   * Asserts the confirmation popup: "Are you sure you want to create WO from this PM?" and confirms it.
   */
  async verifyTemplateConfirmationAlert(): Promise<void> {
    const alertMsg = $(
      '//XCUIElementTypeStaticText[contains(@name, "Are you sure you want to create WO from this PM") or contains(@label, "Are you sure you want to create WO from this PM")]',
    );
    await alertMsg.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: '"Are you sure you want to create WO from this PM?" alert was not displayed',
    });
    await expect(alertMsg).toBeDisplayed();

    // Confirm by tapping OK
    const okBtn = this.alertOkButton;
    await okBtn.waitForDisplayed({ timeout: 5000 });
    await okBtn.click();
    await browser.pause(1500);

    // If an additional success popup (e.g. "Work order created!") appears afterwards, dismiss it gracefully
    const successMsg = $(
      '//XCUIElementTypeStaticText[contains(@name, "created") or contains(@label, "created")]',
    );
    if (await successMsg.isDisplayed().catch(() => false)) {
      if (await okBtn.isDisplayed().catch(() => false)) {
        await okBtn.click().catch(() => {});
        await browser.pause(1000);
      }
    }
  },
};
