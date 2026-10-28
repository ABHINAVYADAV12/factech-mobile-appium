import { $, expect } from '@wdio/globals';

export const technicianIosComplaintScreen = {
  async waitForDisplayed(): Promise<void> {
    const openTab = $(
      '//XCUIElementTypeOther[starts-with(@name, "OPEN") or starts-with(@label, "OPEN")]',
    );
    await openTab.waitForDisplayed({ timeout: 20_000 });
  },

  async expectStatusTabs(): Promise<void> {
    for (const tab of ['OPEN', 'WIP', 'HOLD', 'CLOSED']) {
      const tabEl = $(
        `//XCUIElementTypeOther[starts-with(@name, "${tab}") or starts-with(@label, "${tab}")]`,
      );
      await expect(tabEl).toBeDisplayed();
    }
  },

  async openStatusTab(tab: 'OPEN' | 'WIP' | 'HOLD' | 'CLOSED'): Promise<void> {
    const tabEl = $(
      `//XCUIElementTypeOther[starts-with(@name, "${tab}") or starts-with(@label, "${tab}")] | //XCUIElementTypeStaticText[starts-with(@name, "${tab}") or starts-with(@label, "${tab}")]`,
    );
    await tabEl.waitForDisplayed({ timeout: 15_000 });
    await tabEl.click();
    await browser.pause(800);
  },

  async getTabCount(tab: 'OPEN' | 'WIP' | 'HOLD' | 'CLOSED'): Promise<number> {
    const tabEl = $(
      `//XCUIElementTypeOther[starts-with(@name, "${tab}") or starts-with(@label, "${tab}")]`,
    );
    await tabEl.waitForDisplayed({ timeout: 10_000 });
    const name = (await tabEl.getAttribute('name')) || (await tabEl.getAttribute('label')) || '';
    // Name typically looks like "OPEN, 60" or "OPEN 60" or "WIP 12"
    const match = name.match(/\b\d+\b/);
    return match ? parseInt(match[0], 10) : 0;
  },

  async togglePrimaryTab(target: 'Assigned to me' | 'Logged by me'): Promise<void> {
    const toggleEl = $(
      `//*[contains(@name, "${target}") or contains(@label, "${target}")]`,
    );
    await toggleEl.waitForDisplayed({ timeout: 15_000 });
    await toggleEl.click();
    await browser.pause(1000);
  },

  async verifyWipComplaintsLoaded(): Promise<void> {
    const cardEl = $(
      '//XCUIElementTypeOther[starts-with(@name, "#COMP") or starts-with(@label, "#COMP")] | //XCUIElementTypeStaticText[starts-with(@name, "#COMP") or starts-with(@label, "#COMP")]',
    );
    await cardEl.waitForDisplayed({ timeout: 15_000 });
    await expect(cardEl).toBeDisplayed();
  },

  async verifyEmptyState(expectedText: string = 'No Complaints Found'): Promise<void> {
    const emptyStateText = $(
      `//*[contains(@name, "${expectedText}") or contains(@label, "${expectedText}")]`,
    );
    await emptyStateText.waitForDisplayed({ timeout: 15_000 });
    await expect(emptyStateText).toBeDisplayed();
  },

  async hasComplaintCards(): Promise<boolean> {
    const cardEl = $(
      '//XCUIElementTypeOther[starts-with(@name, "#COMP") or starts-with(@label, "#COMP")] | //XCUIElementTypeStaticText[starts-with(@name, "#COMP") or starts-with(@label, "#COMP")]',
    );
    try {
      await cardEl.waitForDisplayed({ timeout: 6000 });
      return true;
    } catch {
      return false;
    }
  },

  async tapRaise(): Promise<void> {
    const raiseButton = $('~, Raise');
    const fallbackRaise = $(
      '//XCUIElementTypeOther[@name=", Raise" or contains(@name, "Raise")] | //XCUIElementTypeButton[@name=", Raise" or contains(@name, "Raise")]',
    );
    if (await raiseButton.isDisplayed().catch(() => false)) {
      await raiseButton.click();
    } else {
      await fallbackRaise.waitForDisplayed({ timeout: 15_000 });
      await fallbackRaise.click();
    }
    await browser.pause(1000);
  },

  async verifyCategoryGrid(): Promise<void> {
    const categorySearch = $(
      '//XCUIElementTypeTextField[contains(@placeholderValue, "Search Category") or contains(@value, "Search Category")] | //*[contains(@name, "Search Category") or contains(@label, "Search Category")]',
    );
    await categorySearch.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Search Category input or Category grid was not displayed',
    });
    await expect(categorySearch).toBeDisplayed();
  },

  async verifyCategoryList(): Promise<void> {
    await this.verifyCategoryGrid();
  },

  async selectCategory(category: string): Promise<void> {
    if (category.toLowerCase() === 'electricity') {
      // In the iOS React Native layout, the 2-column grid is grouped as a single accessible container.
      // Dynamically calculate tap coordinates based on Search Category input location
      const searchBox = $(
        '//XCUIElementTypeTextField[contains(@placeholderValue, "Search Category") or contains(@value, "Search Category")]',
      );
      if (await searchBox.isDisplayed().catch(() => false)) {
        const loc = await searchBox.getLocation();
        const size = await searchBox.getSize();
        // Column 1 (Electricity) card center
        const tapX = Math.round(loc.x + size.width * 0.25);
        const tapY = Math.round(loc.y + size.height + 70);
        await browser
          .action('pointer')
          .move({ x: tapX, y: tapY })
          .down()
          .pause(100)
          .up()
          .perform();
      } else {
        // Fallback to coordinates for iPhone 16 layout (x: 100, y: 260)
        await browser
          .action('pointer')
          .move({ x: 100, y: 260 })
          .down()
          .pause(100)
          .up()
          .perform();
      }
    } else {
      const catEl = $(`-ios predicate string:label CONTAINS "${category}"`);
      await catEl.waitForDisplayed({ timeout: 15_000 });
      await catEl.click();
    }
    await browser.pause(2000);
  },

  async verifySubCategoriesDisplayed(expectedSubCategory: string = 'Power Outage'): Promise<void> {
    const subCategorySearch = $(
      '//XCUIElementTypeTextField[contains(@placeholderValue, "Search Sub Category") or contains(@value, "Search Sub Category")] | //*[contains(@name, "Search Sub Category") or contains(@label, "Search Sub Category")]',
    );
    await subCategorySearch.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Search Sub Category field was not displayed',
    });
    await expect(subCategorySearch).toBeDisplayed();

    const subCategoryItem = $(
      `~P, ${expectedSubCategory}`,
    );
    const fallbackItem = $(
      `//XCUIElementTypeOther[@name="P, ${expectedSubCategory}" or contains(@name, "${expectedSubCategory}")] | //XCUIElementTypeStaticText[contains(@name, "${expectedSubCategory}")]`,
    );

    await browser.waitUntil(
      async () => {
        return (
          (await subCategoryItem.isDisplayed().catch(() => false)) ||
          (await fallbackItem.isDisplayed().catch(() => false))
        );
      },
      {
        timeout: 15_000,
        timeoutMsg: `Sub-category "${expectedSubCategory}" was not displayed`,
      },
    );
  },

  async selectSubCategory(subCategory: string = 'Power Outage'): Promise<void> {
    await browser.pause(1000);
    const subCategoryItem = $(
      `~P, ${subCategory}`,
    );
    const fallbackItem = $(
      `//XCUIElementTypeOther[@name="P, ${subCategory}" or contains(@name, "${subCategory}")] | //XCUIElementTypeStaticText[contains(@name, "${subCategory}")]`,
    );

    if (await subCategoryItem.waitForDisplayed({ timeout: 10_000 }).then(() => true).catch(() => false)) {
      await subCategoryItem.click();
    } else {
      await fallbackItem.waitForDisplayed({ timeout: 15_000 });
      await fallbackItem.click();
    }
    await browser.pause(2000);
  },

  async verifyCreationFormDisplayed(): Promise<void> {
    const formIndicator = $(
      '//*[contains(@name, "Create Issue") or contains(@label, "Create Issue") or contains(@name, "Describe the issue") or contains(@label, "Describe the issue") or contains(@name, "Search Location") or contains(@label, "Search Location")]',
    );
    await formIndicator.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: 'Complaint creation form was not displayed after selecting sub-category',
    });
    await expect(formIndicator).toBeDisplayed();
  },

  async getFirstComplaintId(): Promise<string> {
    const cardEl = $(
      '//XCUIElementTypeOther[starts-with(@name, "#COMP") or starts-with(@label, "#COMP")] | //XCUIElementTypeStaticText[starts-with(@name, "#COMP") or starts-with(@label, "#COMP")]',
    );
    await cardEl.waitForDisplayed({ timeout: 15_000 });
    const name = (await cardEl.getAttribute('name')) || (await cardEl.getText()) || '';
    const match = name.match(/#COMP\d+/);
    return match ? match[0] : name.trim();
  },

  async openFirstComplaintCard(): Promise<string> {
    const ticketId = await this.getFirstComplaintId();
    const cardEl = $(
      `//*[contains(@name, "${ticketId}") or contains(@label, "${ticketId}")]`,
    );
    await cardEl.waitForDisplayed({ timeout: 15_000 });
    await cardEl.click();
    await browser.pause(1000);
    return ticketId;
  },

  async verifyComplaintCardPresent(
    ticketId: string,
    maxScrolls: number = 1,
  ): Promise<boolean> {
    const cardEl = $(
      `//*[contains(@name, "${ticketId}") or contains(@label, "${ticketId}")]`,
    );

    for (let i = 0; i < maxScrolls; i++) {
      if (await cardEl.isDisplayed().catch(() => false)) {
        return true;
      }

      if (i < maxScrolls - 1) {
        const { width, height } = await browser.getWindowSize();
        const centerX = Math.round(width / 2);
        const startY = Math.round(height * 0.75);
        const endY = Math.round(height * 0.35);
        await browser
          .action('pointer')
          .move({ x: centerX, y: startY })
          .down()
          .pause(200)
          .move({ x: centerX, y: endY, duration: 600 })
          .up()
          .perform();
        await browser.pause(800);
      }
    }

    return await cardEl.isDisplayed().catch(() => false);
  },

  async verifyClosedComplaintDetailsReadOnly(): Promise<void> {
    // 1. Confirm ticket details view has loaded
    const detailsIndicator = $(
      '//XCUIElementTypeStaticText[contains(@name, "COMP") or contains(@label, "COMP")] | //XCUIElementTypeStaticText[contains(@name, "Details") or contains(@label, "Details")] | //XCUIElementTypeStaticText[contains(@name, "Status") or contains(@label, "Status")]',
    );
    await detailsIndicator.waitForDisplayed({ timeout: 15_000 });

    // 2. Action buttons for active tickets should be hidden or disabled
    const assignBtn = $(
      '//XCUIElementTypeOther[@name="Assign to Self" or @label="Assign to Self"] | //XCUIElementTypeButton[@name="Assign to Self"]',
    );
    const holdBtn = $(
      '//XCUIElementTypeOther[@name="Put on Hold" or @label="Put on Hold"] | //XCUIElementTypeButton[@name="Put on Hold"]',
    );
    const closeBtn = $(
      '//XCUIElementTypeOther[@name="Close Complaint" or @label="Close Complaint"] | //XCUIElementTypeButton[@name="Close Complaint"]',
    );

    await expect(assignBtn).not.toBeDisplayed();
    await expect(holdBtn).not.toBeDisplayed();
    await expect(closeBtn).not.toBeDisplayed();
  },

  async goBackToList(): Promise<void> {
    const backChevron = $(
      '//XCUIElementTypeStaticText[starts-with(@name, "#COMP")]/preceding-sibling::XCUIElementTypeOther[1] | //XCUIElementTypeOther[@name="" or @label=""] | //XCUIElementTypeButton[@name="Back" or @label="Back"]',
    );
    if (await backChevron.isDisplayed()) {
      await backChevron.click();
    } else {
      // Fallback: Use bottom navigation tab for Service Requests / Complaints
      const serviceRequestsTab = $(
        '//XCUIElementTypeButton[contains(@name, "ServiceRequests")]',
      );
      if (await serviceRequestsTab.isDisplayed()) {
        await serviceRequestsTab.click();
      }
    }
    await browser.pause(1000);
    await this.waitForDisplayed();
  },

  async pullToRefresh(): Promise<void> {
    try {
      await browser.execute('mobile: swipe', { direction: 'down' });
    } catch {
      // Dynamic device-independent pull calculation
      const { width, height } = await browser.getWindowSize();
      const centerX = Math.round(width / 2);
      const startY = Math.round(height * 0.25);
      const endY = Math.round(height * 0.70);
      await browser
        .action('pointer')
        .move({ x: centerX, y: startY })
        .down()
        .pause(200)
        .move({ x: centerX, y: endY, duration: 600 })
        .up()
        .perform();
    }
    await browser.pause(2000);
  },

  async selfAssignComplaint(): Promise<void> {
    const selfAssignBtn = $(
      '//XCUIElementTypeOther[contains(@name, "Self Assign Complaint") or contains(@label, "Self Assign Complaint")] | //XCUIElementTypeButton[contains(@name, "Self Assign") or contains(@label, "Self Assign")]',
    );
    await selfAssignBtn.waitForDisplayed({ timeout: 15_000 });
    await selfAssignBtn.click();
    await browser.pause(1000);

    // Check if native alert or custom modal dialog appears
    try {
      if (await browser.isAlertOpen()) {
        await browser.acceptAlert();
        await browser.pause(1500);
        return;
      }
    } catch {
      // Not a native alert, continue to check custom modal
    }

    const confirmBtn = $(
      '//XCUIElementTypeButton[@name="Yes" or @name="Confirm" or @name="OK" or @name="Assign"] | //XCUIElementTypeOther[@name="Yes" or @name="Confirm" or @name="OK" or @name="Assign"]',
    );
    if (await confirmBtn.isDisplayed()) {
      await confirmBtn.click();
      await browser.pause(1500);
    }
  },

  async unassignComplaint(): Promise<void> {
    const unassignBtn = $(
      '//XCUIElementTypeOther[contains(@name, "Unassign") or contains(@label, "Unassign")] | //XCUIElementTypeButton[contains(@name, "Unassign") or contains(@label, "Unassign")]',
    );
    await unassignBtn.waitForDisplayed({ timeout: 15_000 });
    await unassignBtn.click();
    await browser.pause(1000);

    // Check if native alert or custom modal dialog appears
    try {
      if (await browser.isAlertOpen()) {
        await browser.acceptAlert();
        await browser.pause(1500);
      }
    } catch {
      // Continue to check modal
    }

    const confirmBtn = $(
      '//XCUIElementTypeButton[@name="Yes" or @name="Confirm" or @name="OK" or @name="Unassign"] | //XCUIElementTypeOther[@name="Yes" or @name="Confirm" or @name="OK" or @name="Unassign"]',
    );
    if (await confirmBtn.isDisplayed()) {
      await confirmBtn.click();
      await browser.pause(1500);
    }

    // Step 4: Sometimes a secondary success acknowledgement popup (OK) appears
    try {
      if (await browser.isAlertOpen()) {
        await browser.acceptAlert();
        await browser.pause(1000);
      }
    } catch {
      // Continue
    }

    const okBtn = $(
      '//XCUIElementTypeButton[@name="OK" or @name="Ok"] | //XCUIElementTypeOther[@name="OK" or @name="Ok"]',
    );
    if (await okBtn.isDisplayed()) {
      await okBtn.click();
      await browser.pause(1000);
    }
  },

  async putComplaintOnHold(
    reason: string = 'Waiting for Material/Spare Parts',
    remarks: string = 'Waiting for Material/Spare Parts',
  ): Promise<void> {
    const holdBtn = $(
      '//XCUIElementTypeOther[contains(@name, "Hold") or contains(@label, "Hold")]',
    );
    await holdBtn.waitForDisplayed({ timeout: 15_000 });
    await holdBtn.click();

    // Wait for Put on Hold modal
    const modalTitle = $('//XCUIElementTypeStaticText[@name="Put on Hold"]');
    await modalTitle.waitForDisplayed({ timeout: 15_000 });

    // Wait for reasons loading indicator to disappear
    const loadingText = $('//XCUIElementTypeStaticText[@name="Loading reasons..."]');
    try {
      await loadingText.waitForDisplayed({ reverse: true, timeout: 15_000 });
    } catch {
      // Continue
    }

    // Select the reason option: try matching reason first, then fallback to first option or "Other"
    const matchedOption = $(
      `//XCUIElementTypeOther[contains(@name, "${reason}") or contains(@label, "${reason}")]`,
    );
    if (await matchedOption.isDisplayed()) {
      await matchedOption.click();
    } else {
      const fallbackReason = $(
        '//XCUIElementTypeOther[contains(@name, "Other") or contains(@label, "Other")] | //XCUIElementTypeStaticText[@name="Hold Reason *"]/following-sibling::XCUIElementTypeOther[1]',
      );
      await fallbackReason.waitForDisplayed({ timeout: 10_000 });
      await fallbackReason.click();
    }
    await browser.pause(800);

    // Enter Remarks if remarks field exists
    if (remarks) {
      const remarksField = $(
        '//XCUIElementTypeTextView[contains(@name, "remarks") or contains(@value, "remarks") or contains(@name, "Add remarks")] | //XCUIElementTypeTextView',
      );
      if (await remarksField.isDisplayed()) {
        await remarksField.setValue(remarks);
        const doneKey = $('~Done | ~Return');
        if (await doneKey.isDisplayed()) {
          await doneKey.click();
        }
      }
    }

    // Tap Confirm Put on Hold button
    const confirmHoldBtn = $(
      '//XCUIElementTypeOther[contains(@name, "Confirm Put on Hold") or contains(@label, "Confirm Put on Hold")]',
    );
    await confirmHoldBtn.waitForDisplayed({ timeout: 15_000 });
    await confirmHoldBtn.click();
    await browser.pause(2000);

    // Handle any native alert or secondary confirmation popup
    try {
      if (await browser.isAlertOpen()) {
        await browser.acceptAlert();
        await browser.pause(1000);
      }
    } catch {
      // Continue
    }

    const okBtn = $(
      '//XCUIElementTypeButton[@name="OK" or @name="Ok"] | //XCUIElementTypeOther[@name="OK" or @name="Ok"]',
    );
    if (await okBtn.isDisplayed()) {
      await okBtn.click();
      await browser.pause(1000);
    }
  },

  async resumeWorkComplaint(): Promise<void> {
    const resumeBtn = $(
      '//XCUIElementTypeOther[contains(@name, "Resume") or contains(@label, "Resume") or contains(@name, "Start Work") or contains(@label, "Start Work")] | //XCUIElementTypeButton[contains(@name, "Resume") or contains(@label, "Resume") or contains(@name, "Start Work") or contains(@label, "Start Work")]',
    );
    await resumeBtn.waitForDisplayed({ timeout: 15_000 });
    await resumeBtn.click();
    await browser.pause(1000);

    // Check if native alert or custom modal dialog appears
    try {
      if (await browser.isAlertOpen()) {
        await browser.acceptAlert();
        await browser.pause(1500);
      }
    } catch {
      // Continue to check modal
    }

    const confirmBtn = $(
      '//XCUIElementTypeButton[@name="Yes" or @name="Confirm" or @name="OK" or @name="Resume" or @name="Start Work"] | //XCUIElementTypeOther[@name="Yes" or @name="Confirm" or @name="OK" or @name="Resume" or @name="Start Work"]',
    );
    if (await confirmBtn.isDisplayed()) {
      await confirmBtn.click();
      await browser.pause(1500);
    }

    // Step 4: Sometimes a secondary success acknowledgement popup (OK) appears
    try {
      if (await browser.isAlertOpen()) {
        await browser.acceptAlert();
        await browser.pause(1000);
      }
    } catch {
      // Continue
    }

    const okBtn = $(
      '//XCUIElementTypeButton[@name="OK" or @name="Ok"] | //XCUIElementTypeOther[@name="OK" or @name="Ok"]',
    );
    if (await okBtn.isDisplayed()) {
      await okBtn.click();
      await browser.pause(1000);
    }
  },

  async closeComplaint(remarks?: string): Promise<void> {
    const closeBtn = $(
      '//XCUIElementTypeOther[contains(@name, "Close") or contains(@label, "Close")] | //XCUIElementTypeButton[contains(@name, "Close") or contains(@label, "Close")]',
    );
    await closeBtn.waitForDisplayed({ timeout: 15_000 });
    await closeBtn.click();
    await browser.pause(1000);

    // If remarks input field appears, type remarks
    if (remarks) {
      const remarksInput = $(
        '//XCUIElementTypeTextView | //XCUIElementTypeTextField[contains(@placeholderValue, "remark") or contains(@placeholderValue, "Remark") or contains(@placeholderValue, "comment") or contains(@placeholderValue, "Resolution")]',
      );
      if (await remarksInput.isDisplayed().catch(() => false)) {
        await remarksInput.setValue(remarks);
        await browser.pause(500);
      }
    }

    // Check if native alert or custom modal dialog appears
    try {
      if (await browser.isAlertOpen()) {
        await browser.acceptAlert();
        await browser.pause(1500);
      }
    } catch {
      // Continue to check modal
    }

    const confirmBtn = $(
      '//XCUIElementTypeButton[@name="OK" or @name="Ok" or @name="Yes" or @name="Confirm" or @name="Close"] | //XCUIElementTypeOther[@name="OK" or @name="Ok" or @name="Yes" or @name="Confirm" or @name="Close"]',
    );
    if (await confirmBtn.isDisplayed().catch(() => false)) {
      await confirmBtn.click();
      await browser.pause(1500);
    }

    // Check secondary success acknowledgement popup (OK) if any
    try {
      if (await browser.isAlertOpen()) {
        await browser.acceptAlert();
        await browser.pause(1000);
      }
    } catch {
      // Continue
    }

    const okBtn = $(
      '//XCUIElementTypeButton[@name="OK" or @name="Ok"] | //XCUIElementTypeOther[@name="OK" or @name="Ok"]',
    );
    if (await okBtn.isDisplayed().catch(() => false)) {
      await okBtn.click();
      await browser.pause(1000);
    }
  },

  async verifyComplaintDetails(): Promise<void> {
    const ticketHeader = $(
      '//XCUIElementTypeStaticText[starts-with(@name, "#COMP") or starts-with(@label, "#COMP")]',
    );
    await ticketHeader.waitForDisplayed({ timeout: 15_000 });
    await expect(ticketHeader).toBeDisplayed();

    // Verify sections such as Nature, Area, or Description
    const detailsSection = $(
      '//XCUIElementTypeStaticText[@name="Nature" or @name="Description" or @name="Area"]',
    );
    await detailsSection.waitForDisplayed({ timeout: 15_000 });
    await expect(detailsSection).toBeDisplayed();
  },

  async addComment(commentText: string): Promise<string> {
    const commentField = $(
      '//XCUIElementTypeTextField[@placeholderValue="Add a comment..." or contains(@value, "comment")]',
    );
    await commentField.waitForDisplayed({ timeout: 15_000 });
    await commentField.click();
    await commentField.setValue(commentText);
    await browser.pause(1000);

    // Read the actual text typed into the field before sending (to guard against dropped keys on slow emulator)
    const actualTyped =
      (await commentField.getValue()) ||
      (await commentField.getAttribute('value')) ||
      commentText;

    const sendBtn = $(
      '//XCUIElementTypeOther[@name="" or @label=""] | //XCUIElementTypeTextField[@placeholderValue="Add a comment..."]/../following-sibling::XCUIElementTypeOther[1]',
    );
    await sendBtn.waitForDisplayed({ timeout: 10_000 });
    await sendBtn.click();
    await browser.pause(2000);

    // Dismiss keyboard if still present
    if (await browser.isKeyboardShown().catch(() => false)) {
      try {
        await browser.hideKeyboard();
      } catch {
        // Continue
      }
    }

    return actualTyped;
  },

  async verifyCommentPosted(commentText: string): Promise<void> {
    // Extract distinctive leading keyword (e.g. "Parts received") to handle slow/partial typing on simulator
    const keyword =
      commentText.length > 14 ? commentText.slice(0, 14).trim() : commentText;

    const postedComment = $(
      `//XCUIElementTypeStaticText[contains(@name, "${keyword}") or contains(@label, "${keyword}") or contains(@value, "${keyword}")]`,
    );

    // Scroll down if not visible initially in the activity feed
    for (let i = 0; i < 3; i++) {
      if (await postedComment.isDisplayed().catch(() => false)) {
        break;
      }
      const { width, height } = await browser.getWindowSize();
      const centerX = Math.round(width / 2);
      const startY = Math.round(height * 0.70);
      const endY = Math.round(height * 0.30);
      await browser
        .action('pointer')
        .move({ x: centerX, y: startY })
        .down()
        .pause(200)
        .move({ x: centerX, y: endY, duration: 600 })
        .up()
        .perform();
      await browser.pause(800);
    }

    await postedComment.waitForDisplayed({ timeout: 15_000 });
    await expect(postedComment).toBeDisplayed();
  },
};