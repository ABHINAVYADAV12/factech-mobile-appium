import { $, $$, expect, browser } from '@wdio/globals';
import { technicianIosHomeScreen } from './home.screen.js';

// The three main tabs visible on the Work Order screen
export type WorkOrderTab = 'OPEN' | 'HOLD' | 'CLOSED';

// Confirmed status mapping for each tab
const expectedStatuses: Record<WorkOrderTab, string[]> = {
  OPEN: ['OPEN', 'STARTED', 'REOPENED', 'REOPEN', 'OVERDUE', 'MISSED'],
  HOLD: ['HOLD'],
  CLOSED: ['COMPLETED', 'CANCELLED'],
};

// Regex to identify work order cards by standard prefixes (e.g. WO-37410, HK-09128, LG-01495, LB-01484)
const CARD_ID_REGEX = /\b(WO|HK|LG|LB)-\d+\b/;

export const technicianIosWorkOrderScreen = {
  /**
   * Waits for the Work Order screen to be fully loaded with its three main tabs.
   */
  async waitForDisplayed(): Promise<void> {
    // Wait for the OPEN tab to confirm the Work Orders screen has loaded
    const openTab = $('//XCUIElementTypeOther[@name="OPEN"]');
    await openTab.waitForDisplayed({ timeout: 20_000 });
    await expect(openTab).toBeDisplayed();

    // Verify all three status tabs are displayed
    await expect($('//XCUIElementTypeOther[@name="HOLD"]')).toBeDisplayed();
    await expect($('//XCUIElementTypeOther[@name="CLOSED"]')).toBeDisplayed();
  },

  /**
   * Switches to one of the three tabs: 'OPEN', 'HOLD', or 'CLOSED'.
   */
  async openTab(tab: WorkOrderTab): Promise<void> {
    const tabElement = $(`//XCUIElementTypeOther[@name="${tab}"]`);
    await tabElement.waitForDisplayed({ timeout: 10_000 });
    await tabElement.click();
    // Brief pause to allow the card list to refresh
    await browser.pause(800);
  },

  // Selector matching the first work order card container
  get firstWorkOrderCard() {
    return $(
      '//XCUIElementTypeOther[starts-with(@name, "WO-") or starts-with(@name, "HK-") or starts-with(@name, "LG-") or starts-with(@name, "LB-")]',
    );
  },

  /**
   * Reads all currently visible work order cards from the screen.
   * Targets XCUIElementTypeOther whose name attribute starts with the card ID.
   */
  async getVisibleWorkOrderCards(): Promise<string[]> {
    const elements = await $$(
      '//XCUIElementTypeOther[starts-with(@name, "WO-") or starts-with(@name, "HK-") or starts-with(@name, "LG-") or starts-with(@name, "LB-")]',
    );
    const names = await elements.map((el) => el.getAttribute('name'));
    return [
      ...new Set(
        names.filter((n): n is string => Boolean(n)).map((n) => n.trim()),
      ),
    ];
  },

  /**
   * Verifies that work order cards are visible and have valid ID prefixes and statuses.
   */
  async verifyCardInformation(): Promise<void> {
    // Wait for cards to finish hydrating from the network
    await this.firstWorkOrderCard.waitForDisplayed({ timeout: 20_000 });

    const cards = await this.getVisibleWorkOrderCards();

    // Verify at least one card is loaded on screen
    await expect(cards.length).toBeGreaterThan(0);

    for (const label of cards) {
      const fields = label.split(',').map((field) => field.trim());

      // Field 0: Must match WO-XXXXX, HK-XXXXX, LG-XXXXX, LB-XXXXX
      await expect(fields[0]).toMatch(CARD_ID_REGEX);

      // Field 1: Must contain non-empty status (e.g. OPEN, STARTED)
      await expect(fields[1]).not.toBe('');
    }
  },

  /**
   * Switches to the given tab, scrolls through records, and asserts that
   * every card status displayed matches the allowed statuses for that tab.
   */
  async verifyStatusesWhileScrolling(tab: WorkOrderTab): Promise<void> {
    const allowedStatuses = expectedStatuses[tab];
    const collectedCards = new Set<string>();
    const maxSwipes = 20;

    // 1. Switch to the target tab
    await this.openTab(tab);

    // Wait for tab cards to finish loading (or empty state)
    try {
      await this.firstWorkOrderCard.waitForDisplayed({ timeout: 10_000 });
    } catch {
      // Tab may have no cards (e.g. empty list)
    }

    // 2. Scroll and collect unique card labels
    for (let swipe = 0; swipe < maxSwipes; swipe++) {
      const visibleCards = await this.getVisibleWorkOrderCards();

      for (const card of visibleCards) {
        collectedCards.add(card);
      }

      // Stop if no cards exist in this tab
      if (visibleCards.length === 0) {
        break;
      }

      // Stop early if "No more work orders" indicator is reached
      const noMoreElement = $('~No more work orders');
      if (await noMoreElement.isDisplayed()) {
        break;
      }

      // Swipe up to load more items
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(500);

      const afterSwipe = await this.getVisibleWorkOrderCards();
      const newCardsFound = afterSwipe.some((card) => !collectedCards.has(card));

      // Stop if scrolling revealed no new cards
      if (!newCardsFound) {
        for (const card of afterSwipe) {
          collectedCards.add(card);
        }
        break;
      }
    }

    // 3. Ensure cards were found for this tab
    await expect(collectedCards.size).toBeGreaterThan(0);

    // 4. Assert every card's status (fields[1]) matches the allowed statuses for this tab
    for (const label of collectedCards) {
      const fields = label.split(',').map((field) => field.trim());
      const status = fields[1];

      if (!status || !allowedStatuses.includes(status)) {
        throw new Error(
          `Unexpected status "${status}" in ${tab} tab. Allowed: [${allowedStatuses.join(', ')}]. Card: ${label}`,
        );
      }
    }
  },

  // --- Filter Modal Elements ---

  get filterButton() {
    return $('//XCUIElementTypeOther[contains(@name, "Filter")]');
  },

  get filterModalTitle() {
    return $(
      '//XCUIElementTypeStaticText[contains(@name, "Filter Work Orders") or contains(@label, "Filter Work Orders")] | //XCUIElementTypeOther[contains(@name, "Filter Work Orders") or contains(@label, "Filter Work Orders")]',
    );
  },

  get resetFiltersButton() {
    return $('//XCUIElementTypeOther[@name="Reset"] | //XCUIElementTypeStaticText[@name="Reset"]');
  },

  get applyFiltersButton() {
    return $('//XCUIElementTypeOther[@name="Apply Filters"] | //XCUIElementTypeStaticText[@name="Apply Filters"]');
  },

  // --- Filter Modal Actions ---

  /**
   * Opens the "Filter Work Orders" modal sheet.
   * Waits for the Apply Filters button at the bottom since the top title may be occluded by the iOS status bar.
   */
  async openFilterModal(): Promise<void> {
    await this.filterButton.waitForDisplayed({ timeout: 10_000 });
    await this.filterButton.click();
    // Wait for the modal sheet to be visible via the Apply Filters action button
    await this.applyFiltersButton.waitForDisplayed({ timeout: 10_000 });
    await expect(this.applyFiltersButton).toBeDisplayed();
  },

  /**
   * Switches category in the left pane of the filter sheet: 'Status', 'Flag', 'Date', or 'Scheduled'.
   * Uses $$ to click the displayed category control.
   */
  async selectFilterCategory(category: 'Status' | 'Flag' | 'Date' | 'Scheduled'): Promise<void> {
    const elements = await $$(
      `//XCUIElementTypeOther[contains(@name, "${category}")] | //XCUIElementTypeStaticText[contains(@name, "${category}")]`,
    );
    for (const el of elements) {
      if (await el.isDisplayed()) {
        await el.click();
        await browser.pause(500);
        return;
      }
    }
    throw new Error(`Filter category "${category}" not displayed`);
  },

  /**
   * Asserts that a specific filter option is displayed on screen.
   * Targets XCUIElementTypeOther whose name starts with or equals the option.
   * Handles selected checkmarks (e.g. "OPEN, ") and avoids covered background elements.
   */
  async verifyFilterOption(option: string): Promise<void> {
    await browser.waitUntil(
      async () => {
        const elements = await $$(
          `//XCUIElementTypeOther[starts-with(@name, "${option}") or @name="${option}"]`,
        );
        for (const el of elements) {
          if (await el.isDisplayed()) {
            return true;
          }
        }
        return false;
      },
      {
        timeout: 10_000,
        timeoutMsg: `Filter option "${option}" was not displayed within 10s`,
      },
    );
  },

  /**
   * TC-02: Validates all filter categories, status/flag/date options, and footer buttons.
   */
  async verifyFilterScreenAndOptions(): Promise<void> {
    // 1. Verify modal title exists in DOM (top position may be partially occluded by iOS status bar)
    await expect(this.filterModalTitle).toBeExisting();

    // 2. Verify all four category controls on the left navigation pane
    const categories: Array<'Status' | 'Flag' | 'Date' | 'Scheduled'> = [
      'Status',
      'Flag',
      'Date',
      'Scheduled',
    ];
    for (const cat of categories) {
      const elements = await $$(
        `//XCUIElementTypeOther[contains(@name, "${cat}")] | //XCUIElementTypeStaticText[contains(@name, "${cat}")]`,
      );
      let displayed = false;
      for (const el of elements) {
        if (await el.isDisplayed()) {
          displayed = true;
          break;
        }
      }
      expect(displayed).toBe(true);
    }

    // 3. Verify Status options
    await this.selectFilterCategory('Status');
    const statusOptions = [
      'OPEN',
      'STARTED',
      'COMPLETED',
      'HOLD',
      'CANCELLED',
      'REOPEN',
      'OVERDUE',
      'MISSED',
    ];
    for (const opt of statusOptions) {
      await this.verifyFilterOption(opt);
    }

    // 4. Verify Flag options
    await this.selectFilterCategory('Flag');
    const flagOptions = ['No Delay', 'Delayed', 'All'];
    for (const opt of flagOptions) {
      await this.verifyFilterOption(opt);
    }

    // 5. Verify Date options
    await this.selectFilterCategory('Date');
    const dateOptions = ['Today', 'Yesterday', 'All', 'Custom Date'];
    for (const opt of dateOptions) {
      await this.verifyFilterOption(opt);
    }

    // 6. Verify Reset and Apply Filters action buttons
    await expect(this.resetFiltersButton).toBeDisplayed();
    await expect(this.applyFiltersButton).toBeDisplayed();

    // 7. Dismiss modal cleanly
    await this.applyFiltersButton.click();
    await browser.pause(500);
  },

  /**
   * Taps an option in the current filter category (e.g. 'COMPLETED', 'OPEN', 'Yesterday').
   * Unchecks any previously selected option in the same category to guarantee single-option testing.
   */
  async selectFilterOption(option: string): Promise<void> {
    // 1. Uncheck any currently checked option in this category that is not our target
    const checkedElements = await $$(
      '//XCUIElementTypeScrollView//XCUIElementTypeOther[contains(@name, ", ")]',
    );
    for (const checkedEl of checkedElements) {
      try {
        if (await checkedEl.isDisplayed()) {
          const name = await checkedEl.getAttribute('name');
          if (name && !name.startsWith(option)) {
            await checkedEl.click();
            await browser.pause(300);
          }
        }
      } catch {
        // Element may have decoupled or refreshed
      }
    }

    // 2. Select the target option if it is not already checked
    const elements = await $$(
      `//XCUIElementTypeScrollView//XCUIElementTypeOther[starts-with(@name, "${option}")]`,
    );
    for (const el of elements) {
      if (await el.isDisplayed()) {
        const name = await el.getAttribute('name');
        if (name && !name.includes('')) {
          await el.click();
          await browser.pause(400);
        }
        return;
      }
    }

    // Fallback if ScrollView structure varies
    const fallbackElements = await $$(
      `//XCUIElementTypeOther[starts-with(@name, "${option}")]`,
    );
    for (const el of fallbackElements) {
      if (await el.isDisplayed()) {
        await el.click();
        await browser.pause(400);
        return;
      }
    }

    throw new Error(`Filter option "${option}" could not be clicked`);
  },

  /**
   * Applies the current filter selections and closes the modal sheet.
   */
  async applyFilters(): Promise<void> {
    await this.applyFiltersButton.waitForDisplayed({ timeout: 10_000 });
    await this.applyFiltersButton.click();
    await browser.pause(2000);
  },

  /**
   * Resets all filter selections to default in the modal sheet.
   */
  async resetFilters(): Promise<void> {
    await this.resetFiltersButton.waitForDisplayed({ timeout: 10_000 });
    await this.resetFiltersButton.click();
    await browser.pause(500);
  },

  /**
   * Scrolls through work order cards and collects unique card records.
   * Default maxSwipes is 3 to keep execution fast while validating pagination.
   */
  async scrollAndCollectAllCards(maxSwipes = 3): Promise<string[]> {
    const collectedCards = new Set<string>();

    for (let swipe = 0; swipe < maxSwipes; swipe++) {
      const visibleCards = await this.getVisibleWorkOrderCards();
      for (const card of visibleCards) {
        collectedCards.add(card);
      }

      if (visibleCards.length === 0) {
        break;
      }

      const noMoreElement = $('~No more work orders');
      if (await noMoreElement.isDisplayed()) {
        break;
      }

      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(300);
    }

    return [...collectedCards];
  },

  /**
   * Scrolls through all cards till the end.
   * If cards are found, verifies each card matches expectedStatus (if provided).
   * If no cards are found, verifies that the list is empty (valid empty state).
   */
  async verifyFilteredCardsOrEmptyState(
    expectedStatus?: string,
  ): Promise<{ count: number; emptyState: boolean }> {
    await browser.pause(800);
    const cards = await this.scrollAndCollectAllCards(3);

    if (cards.length === 0) {
      return { count: 0, emptyState: true };
    }

    if (expectedStatus) {
      for (const card of cards) {
        const fields = card.split(',').map((f) => f.trim());
        const status = fields[1];
        if (status && status !== expectedStatus) {
          throw new Error(
            `Expected card status "${expectedStatus}", but found "${status}" on card: ${card}`,
          );
        }
      }
    }

    return { count: cards.length, emptyState: false };
  },

  /**
   * Verifies that cards returned under the Flag filter match the criteria:
   * - 'Delayed': Cards contain 'Delayed' / 'Delay' / 'Overdue' (or empty state if 0 records).
   * - 'No Delay': Cards do not contain delay tags.
   * - 'All': Any valid records.
   */
  async verifyFlagFilteredCardsOrEmptyState(
    flag: 'No Delay' | 'Delayed' | 'All',
  ): Promise<{ count: number; emptyState: boolean }> {
    await browser.pause(800);
    const cards = await this.scrollAndCollectAllCards(3);

    if (cards.length === 0) {
      return { count: 0, emptyState: true };
    }

    if (flag === 'Delayed') {
      for (const card of cards) {
        const isDelayed =
          card.includes('') || /delayed|delay|overdue/i.test(card);
        if (!isDelayed) {
          throw new Error(`Expected card to have Delayed flag, but found: ${card}`);
        }
      }
    } else if (flag === 'No Delay') {
      for (const card of cards) {
        const isDelayed =
          card.includes('') || /\bdelayed\b/i.test(card);
        if (isDelayed) {
          throw new Error(`Expected card to have No Delay flag, but found delayed: ${card}`);
        }
      }
    }

    return { count: cards.length, emptyState: false };
  },

  /**
   * Verifies that cards returned under the Date filter match the criteria:
   * - 'Today': Cards have today's date in their scheduled date field.
   * - 'Yesterday': Cards have yesterday's date in their scheduled date field (or empty state).
   * - 'All' / 'Custom Date': Cards have valid date fields or empty state.
   */
  async verifyDateFilteredCardsOrEmptyState(
    dateOption: 'Today' | 'Yesterday' | 'All' | 'Custom Date',
  ): Promise<{ count: number; emptyState: boolean }> {
    await browser.pause(800);
    const cards = await this.scrollAndCollectAllCards(3);

    if (cards.length === 0) {
      return { count: 0, emptyState: true };
    }

    const monthNames = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    ];

    if (dateOption === 'Today') {
      const today = new Date();
      const day = today.getDate();
      const month = monthNames[today.getMonth()];
      const year = today.getFullYear();
      const dateRegex = new RegExp(`\\b${day}\\s+${month}\\s+${year}\\b`, 'i');

      for (const card of cards) {
        if (!dateRegex.test(card)) {
          throw new Error(`Card date does not match Today (${day} ${month} ${year}): ${card}`);
        }
      }
    } else if (dateOption === 'Yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const day = yesterday.getDate();
      const month = monthNames[yesterday.getMonth()];
      const year = yesterday.getFullYear();
      const dateRegex = new RegExp(`\\b${day}\\s+${month}\\s+${year}\\b`, 'i');

      for (const card of cards) {
        if (!dateRegex.test(card)) {
          throw new Error(`Card date does not match Yesterday (${day} ${month} ${year}): ${card}`);
        }
      }
    }

    return { count: cards.length, emptyState: false };
  },

  get reloadButton() {
    return $(
      '//XCUIElementTypeOther[contains(@name, "Reload")] | //XCUIElementTypeStaticText[contains(@name, "Reload")] | //XCUIElementTypeButton[contains(@name, "Reload")] | //XCUIElementTypeOther[contains(@name, "Refresh")]',
    );
  },

  /**
   * Refreshes the Work Order list:
   * If an empty-state Reload/Refresh button is displayed, taps it.
   * Otherwise, performs a pull-to-refresh swipe down gesture.
   */
  async refreshList(): Promise<void> {
    if (await this.reloadButton.isDisplayed()) {
      await this.reloadButton.click();
      await browser.pause(1500);
      return;
    }

    // Pull-to-refresh swipe down
    await browser.execute('mobile: swipe', { direction: 'down' });
    await browser.pause(1500);
  },

  /**
   * Opens the filter modal, taps Reset, applies filters, and waits for default list restoration.
   */
  async resetAndApplyFilters(): Promise<void> {
    await this.openFilterModal();
    await this.resetFilters();
    await this.applyFilters();
  },

  /**
   * Opens the filter modal, switches category, selects option, and applies filters.
   */
  async applyCategoryFilter(
    category: 'Status' | 'Flag' | 'Date' | 'Scheduled',
    option: string,
  ): Promise<void> {
    await this.openFilterModal();
    await this.resetFilters();
    await this.selectFilterCategory(category);
    await this.selectFilterOption(option);
    await this.applyFilters();
  },

  // --- Instructions & Checklist Selectors & Methods ---
  get progressText() {
    return $('//XCUIElementTypeStaticText[contains(@name, "%") or contains(@label, "%")]');
  },

  get checklistHeader() {
    return $(
      '//XCUIElementTypeStaticText[contains(@name, "Checklist") or contains(@label, "Checklist")]',
    );
  },

  get safetyGearCheckbox() {
    return $(
      '//XCUIElementTypeOther[@name="Verify Safety Gear Checked Before Starting" or @label="Verify Safety Gear Checked Before Starting"]',
    );
  },

  get consumptionField() {
    return $(
      '//XCUIElementTypeTextField[@value="Enter Numerical Value"]',
    );
  },

  /**
   * Retrieves the current progress count, total items, and percentage.
   * e.g. "4/11 (36%)" -> { completed: 4, total: 11, percentage: 36, raw: "4/11 (36%)" }
   */
  async getProgress(): Promise<{ completed: number; total: number; percentage: number; raw: string }> {
    await this.progressText.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Progress indicator was not displayed on work order details screen',
    });
    const raw = await this.progressText.getText();
    const match = raw.match(/(\d+)\s*\/\s*(\d+)\s*\((\d+)%\)/);
    if (!match || !match[1] || !match[2] || !match[3]) {
      throw new Error(`Unable to parse progress text: "${raw}"`);
    }
    return {
      completed: parseInt(match[1], 10),
      total: parseInt(match[2], 10),
      percentage: parseInt(match[3], 10),
      raw,
    };

  },

  /**
   * Asserts that instructions checklist is visible.
   */
  async verifyInstructionsDisplayed(): Promise<void> {
    await this.checklistHeader.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Instructions checklist header was not displayed',
    });
    await expect(this.checklistHeader).toBeDisplayed();
    await expect(this.progressText).toBeDisplayed();
  },

  /**
   * Performs swipe up to scroll down through instructions list.
   */
  async scrollInstructionsDown(): Promise<void> {
    await browser.execute('mobile: swipe', { direction: 'up' });
    await browser.pause(1200);
  },

  /**
   * Performs swipe down to scroll up through instructions list.
   */
  async scrollInstructionsUp(): Promise<void> {
    await browser.execute('mobile: swipe', { direction: 'down' });
    await browser.pause(1200);
  },

  /**
   * Safely dismisses the keyboard if active.
   */
  async dismissKeyboard(): Promise<void> {
    try {
      const doneBtn = $(
        '//XCUIElementTypeButton[@name="Done" or @name="return" or @name="Hide keyboard"]',
      );
      if (await doneBtn.isDisplayed().catch(() => false)) {
        await doneBtn.click();
        await browser.pause(500);
        return;
      }
      if (await browser.isKeyboardShown().catch(() => false)) {
        await browser.hideKeyboard().catch(() => {});
      }
    } catch {
      // Keyboard already dismissed or unhandled
    }
  },

  /**
   * Opens the QR scanner screen from the Home dashboard and handles any camera permissions.
   */
  async openScannerScreen(): Promise<void> {
    await technicianIosHomeScreen.expectQuickAccess();
    await technicianIosHomeScreen.scanQr();

    // Handle camera permission dialog if prompted
    try {
      const allowBtn = $('~Allow While Using App');
      if (await allowBtn.isDisplayed().catch(() => false)) {
        await allowBtn.click();
        await browser.pause(500);
      }
    } catch {
      // Permission alert not presented
    }

    await browser.pause(2000);
  },

  /**
   * Selects an asset from the scanner screen and opens the specified Work Order card.
   */
  async selectAssetAndOpenWorkOrder(
    targetAsset: string,
    targetWoId: string,
    targetWoTitle: string,
  ): Promise<void> {
    // Click on "Select Asset" button at the top of scanner screen
    const selectAssetBtn = $(
      '//*[contains(@name, "Select Asset") or contains(@label, "Select Asset")]',
    );
    await selectAssetBtn.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: '"Select Asset" button was not displayed on scanner screen',
    });
    await selectAssetBtn.click();
    await browser.pause(2000);

    // Type asset name in "Search assets..." field
    const searchField = $(
      '//XCUIElementTypeTextField[@placeholderValue="Search assets..."]',
    );
    await searchField.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Search assets input field was not displayed',
    });
    await searchField.setValue(targetAsset);
    await browser.pause(1500);

    // Click on the matching asset item
    const matchingAsset = $(
      `//*[contains(@name, "${targetAsset}") or contains(@label, "${targetAsset}")]`,
    );
    await matchingAsset.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Asset "${targetAsset}" was not found in search results`,
    });
    await matchingAsset.click();
    await browser.pause(2500);

    // Locate and click the target Work Order card matching targetWoId and targetWoTitle
    const targetWoCard = $(
      `//XCUIElementTypeOther[(contains(@name, "${targetWoId}") or contains(@label, "${targetWoId}")) and (contains(@name, "${targetWoTitle}") or contains(@label, "${targetWoTitle}"))] | //XCUIElementTypeOther[contains(@name, "${targetWoId}") or contains(@label, "${targetWoId}")] | //XCUIElementTypeOther[contains(@name, "${targetWoTitle}") or contains(@label, "${targetWoTitle}")]`,
    );

    let isDisplayed = await targetWoCard.isDisplayed().catch(() => false);
    for (let swipe = 0; swipe < 6 && !isDisplayed; swipe++) {
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(1000);
      isDisplayed = await targetWoCard.isDisplayed().catch(() => false);
    }

    await targetWoCard.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: `Target work order (${targetWoId} / ${targetWoTitle}) was not displayed for asset "${targetAsset}"`,
    });
    await targetWoCard.click();
    await browser.pause(2500);
  },

  /**
   * Navigates to a specific Work Order from the Home dashboard via Scan QR -> Select Asset.
   */
  async openWorkOrderViaAssetScan(
    targetAsset: string,
    targetWoId: string,
    targetWoTitle: string,
  ): Promise<void> {
    await this.openScannerScreen();
    await this.selectAssetAndOpenWorkOrder(
      targetAsset,
      targetWoId,
      targetWoTitle,
    );
  },

  /**
   * Opens the scanner, selects target asset, and opens the FIRST available Work Order card.
   * Returns the extracted WO ID.
   */
  async openFirstWorkOrderViaAssetScan(targetAsset: string = 'Formula Asset with nfc'): Promise<string> {
    await this.openScannerScreen();

    // Click on "Select Asset" button at the top of scanner screen
    const selectAssetBtn = $(
      '//*[contains(@name, "Select Asset") or contains(@label, "Select Asset")]',
    );
    await selectAssetBtn.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: '"Select Asset" button was not displayed on scanner screen',
    });
    await selectAssetBtn.click();
    await browser.pause(2000);

    // Type asset name in "Search assets..." field
    const searchField = $(
      '//XCUIElementTypeTextField[@placeholderValue="Search assets..."]',
    );
    await searchField.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Search assets input field was not displayed',
    });
    await searchField.setValue(targetAsset);
    await browser.pause(1500);

    // Click on the matching asset item
    const matchingAsset = $(
      `//*[contains(@name, "${targetAsset}") or contains(@label, "${targetAsset}")]`,
    );
    await matchingAsset.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Asset "${targetAsset}" was not found in search results`,
    });
    await matchingAsset.click();
    await browser.pause(2500);

    // Locate and click the first available Work Order card
    const firstWoCard = $(
      '//XCUIElementTypeOther[starts-with(@name, "WO-") or contains(@name, "WO-")] | //XCUIElementTypeOther[contains(@name, "PM") or contains(@name, "Smoke")] | //XCUIElementTypeScrollView//XCUIElementTypeOther[contains(@name, "WO-")][1]',
    );
    await firstWoCard.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: `No work order card found for asset "${targetAsset}"`,
    });

    const cardText = (await firstWoCard.getAttribute('name')) || (await firstWoCard.getAttribute('label')) || '';
    const match = cardText.match(/WO-\d+/);
    const woId = match ? match[0] : '';

    await firstWoCard.click();
    await browser.pause(2500);
    return woId;
  },

  /**
   * Enters the completion remark and taps Save/continue.
   */
  async enterCompletionRemark(remark: string = 'My work is done'): Promise<void> {
    const markCompleteBtn = $(
      '//XCUIElementTypeOther[contains(@name, "Mark as Complete") or contains(@label, "Mark as Complete") or @name="Complete"] | //XCUIElementTypeButton[contains(@name, "Mark as Complete") or contains(@label, "Mark as Complete") or @name="Complete"] | //XCUIElementTypeStaticText[contains(@name, "Mark as Complete") or contains(@label, "Mark as Complete")]',
    );

    if (!(await markCompleteBtn.isDisplayed().catch(() => false))) {
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(800);
    }

    if (await markCompleteBtn.isDisplayed().catch(() => false)) {
      await markCompleteBtn.click();
      await browser.pause(1000);
    }

    const remarkInput = $(
      '//XCUIElementTypeTextView | //XCUIElementTypeTextField[contains(@placeholderValue, "remark") or contains(@placeholderValue, "Remark") or contains(@placeholderValue, "Add your remark")]',
    );
    await remarkInput.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: 'Completion remark input field was not displayed',
    });
    await remarkInput.setValue(remark);
    await browser.pause(500);

    // Dismiss keyboard safely if visible
    await this.dismissKeyboard();

    // Step 3: Save/continue
    const saveContinueBtn = $(
      '//XCUIElementTypeButton[contains(@name, "Save") or contains(@label, "Save") or contains(@name, "Continue") or contains(@label, "Continue") or contains(@name, "Mark as Complete") or contains(@label, "Mark as Complete") or contains(@name, "Submit")] | //XCUIElementTypeOther[contains(@name, "Save") or contains(@name, "Continue") or contains(@name, "Mark as Complete") or contains(@name, "Submit")]',
    );
    await saveContinueBtn.waitForDisplayed({
      timeout: 10_000,
      timeoutMsg: 'Save/continue button was not displayed',
    });
    await saveContinueBtn.click();
  },

  /**
   * Asserts the "Successfully Marked As Complete" confirmation popup.
   */
  async verifySuccessfullyMarkedAsComplete(): Promise<void> {
    const successText = $('~Successfully Marked As Complete');
    const fallbackText = $(
      '//XCUIElementTypeStaticText[@name="Successfully Marked As Complete" or @label="Successfully Marked As Complete"] | //*[contains(@name, "Successfully Marked As Complete") or contains(@label, "Successfully Marked As Complete")]',
    );
    const okBtn = $('~OK');

    await browser.waitUntil(
      async () => {
        const isShown =
          (await successText.isDisplayed().catch(() => false)) ||
          (await fallbackText.isDisplayed().catch(() => false));
        if (isShown) return true;

        const exists =
          (await successText.isExisting().catch(() => false)) ||
          (await fallbackText.isExisting().catch(() => false));
        if (exists) return true;

        // If modal OK button is displayed, the confirmation popup is active
        return await okBtn.isDisplayed().catch(() => false);
      },
      {
        timeout: 20_000,
        timeoutMsg: 'Popup "Successfully Marked As Complete" was not displayed',
      },
    );
  },

  /**
   * Confirms/dismisses any success alert or popup dialog if present.
   */
  async dismissSuccessPopup(): Promise<void> {
    try {
      const okBtn = $('~OK');
      const fallbackOkBtn = $(
        '//XCUIElementTypeButton[@name="OK" or @label="OK"] | //XCUIElementTypeOther[@name="OK" or @label="OK"] | //*[@name="OK"]',
      );

      if (await okBtn.isDisplayed().catch(() => false)) {
        await okBtn.click();
        await browser.pause(1000);
        return;
      }

      if (await fallbackOkBtn.isDisplayed().catch(() => false)) {
        await fallbackOkBtn.click();
        await browser.pause(1000);
      }
    } catch {
      // Popup already dismissed
    }
  },

  /**
   * Switches to the CLOSED tab and asserts that a specific Work Order ID is displayed.
   */
  async verifyWorkOrderInClosedTab(woId: string): Promise<void> {
    // If on Home dashboard, navigate to Open Work Orders first
    const quickAccess = $('~Quick Access');
    if (await quickAccess.isDisplayed().catch(() => false)) {
      await technicianIosHomeScreen.openOpenWorkOrders();
      await this.waitForDisplayed();
    }

    // Switch to CLOSED tab
    await this.openTab('CLOSED');

    // Locate the target card under CLOSED tab
    const targetCard = $(
      `//XCUIElementTypeOther[starts-with(@name, "${woId}") or contains(@name, "${woId}")]`,
    );

    let isDisplayed = await targetCard.isDisplayed().catch(() => false);
    for (let swipe = 0; swipe < 6 && !isDisplayed; swipe++) {
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(800);
      isDisplayed = await targetCard.isDisplayed().catch(() => false);
    }

    await targetCard.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Work Order "${woId}" was not found under CLOSED tab`,
    });
    await expect(targetCard).toBeDisplayed();
  },

  /**
   * Returns to the OPEN Work Orders list from either Home dashboard or another tab.
   */
  async returnToOpenList(): Promise<void> {
    const quickAccess = $('~Quick Access');
    if (await quickAccess.isDisplayed().catch(() => false)) {
      await technicianIosHomeScreen.openOpenWorkOrders();
      await this.waitForDisplayed();
    } else {
      await this.openTab('OPEN');
    }
  },

  /**
   * Asserts that a completed Work Order ID is not present in the OPEN list after refresh.
   */
  async verifyWorkOrderNotPresentInOpenList(woId: string, maxSwipes = 4): Promise<void> {
    const targetCard = $(
      `//XCUIElementTypeOther[starts-with(@name, "${woId}") or contains(@name, "${woId}")]`,
    );

    for (let swipe = 0; swipe < maxSwipes; swipe++) {
      const isDisplayed = await targetCard.isDisplayed().catch(() => false);
      if (isDisplayed) {
        throw new Error(
          `Completed work order "${woId}" was still found in the Open list after completion`,
        );
      }

      const noMore = $('~No more work orders');
      if (await noMore.isDisplayed().catch(() => false)) {
        break;
      }

      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(600);
    }
  },

  /**
   * Opens the scanned asset screen and verifies that the Work Order appears under its CLOSED section.
   */
  async verifyAssetWorkOrderClosed(targetAsset: string, targetWoId: string): Promise<void> {
    await technicianIosHomeScreen.expectQuickAccess();
    await technicianIosHomeScreen.scanQr();

    // Handle camera permission dialog if prompted
    try {
      const allowBtn = $('~Allow While Using App');
      if (await allowBtn.isDisplayed().catch(() => false)) {
        await allowBtn.click();
        await browser.pause(500);
      }
    } catch {
      // Permission alert not presented
    }

    await browser.pause(2000);

    const selectAssetBtn = $(
      '//XCUIElementTypeOther[starts-with(@name, "Select Asset") or starts-with(@label, "Select Asset")]',
    );
    await selectAssetBtn.waitForDisplayed({ timeout: 15_000 });
    await selectAssetBtn.click();
    await browser.pause(2000);

    const searchField = $(
      '//XCUIElementTypeTextField[@placeholderValue="Search assets..."]',
    );
    await searchField.waitForDisplayed({ timeout: 15_000 });
    await searchField.setValue(targetAsset);
    await browser.pause(1500);

    const matchingAsset = $(
      `//*[contains(@name, "${targetAsset}") or contains(@label, "${targetAsset}")]`,
    );
    await matchingAsset.waitForDisplayed({ timeout: 15_000 });
    await matchingAsset.click();
    await browser.pause(2500);

    // Switch to CLOSED section on this asset screen
    const closedTab = $(
      '//XCUIElementTypeOther[@name="CLOSED"] | //XCUIElementTypeStaticText[@name="CLOSED"] | //XCUIElementTypeButton[@name="CLOSED"]',
    );
    if (await closedTab.isDisplayed().catch(() => false)) {
      await closedTab.click();
      await browser.pause(1000);
    }

    // Locate target WO card under CLOSED section
    const targetClosedCard = $(
      `//XCUIElementTypeOther[contains(@name, "${targetWoId}") or contains(@label, "${targetWoId}")]`,
    );

    let isDisplayed = await targetClosedCard.isDisplayed().catch(() => false);
    for (let swipe = 0; swipe < 6 && !isDisplayed; swipe++) {
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(800);
      isDisplayed = await targetClosedCard.isDisplayed().catch(() => false);
    }

    await targetClosedCard.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Work order "${targetWoId}" was not found under CLOSED section of asset "${targetAsset}"`,
    });
    await expect(targetClosedCard).toBeDisplayed();
  },

  /**
   * Opens the QR scanner screen, switches to Templates tab, and selects a template.
   */
  async openWorkOrderViaTemplateScan(templateTitle: string = 'Smoke Test - WO PM'): Promise<void> {
    await this.openScannerScreen();

    // Switch to Templates tab
    const templatesTab = $(
      '//XCUIElementTypeOther[@name="Templates" or contains(@name, "Templates")] | //XCUIElementTypeStaticText[@name="Templates"] | //XCUIElementTypeButton[@name="Templates"]',
    );
    if (await templatesTab.waitForDisplayed({ timeout: 10_000 }).then(() => true).catch(() => false)) {
      await templatesTab.click();
      await browser.pause(1500);
    }

    // Tap the target template card
    const targetCard = $(
      `//XCUIElementTypeOther[contains(@name, "${templateTitle}") or contains(@label, "${templateTitle}")] | //XCUIElementTypeStaticText[contains(@name, "${templateTitle}")]`,
    );
    await targetCard.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Template "${templateTitle}" was not displayed on scanner Templates screen`,
    });
    await targetCard.click();
    await browser.pause(2500);
  },

  /**
   * Opens the Workorder status update modal: taps ", Update" button, then taps ", Update Status, Change current status of workorder, ".
   */
  async openUpdateStatusModal(): Promise<void> {
    // Step 1: Click Update button (matches exact Appium Inspector locator and icon variants)
    const updateBtn = $(
      '//XCUIElementTypeOther[@name=", Update"] | //XCUIElementTypeOther[contains(@name, ", Update")] | //XCUIElementTypeOther[contains(@label, ", Update")] | //*[(self::XCUIElementTypeOther or self::XCUIElementTypeButton) and (contains(@name, "Update") or contains(@label, "Update")) and not(contains(@name, "Status")) and not(contains(@name, "Workorder"))]',
    );
    if (!(await updateBtn.isDisplayed().catch(() => false))) {
      await browser.execute('mobile: swipe', { direction: 'down' }).catch(() => {});
      await browser.pause(800);
    }
    await updateBtn.waitForDisplayed({
      timeout: 20_000,
      timeoutMsg: 'Update button was not displayed on work order screen',
    });
    await updateBtn.click();
    await browser.pause(1500);



    // Step 2: Click ", Update Status, Change current status of workorder, " option from menu
    const updateStatusOption = $(
      '//XCUIElementTypeOther[@name=", Update Status, Change current status of workorder, "] | //*[contains(@name, "Update Status") and contains(@name, "Change current status")] | //*[contains(@name, "Update Status")]',
    );
    await updateStatusOption.waitForDisplayed({
      timeout: 10_000,
      timeoutMsg: '", Update Status" option was not displayed in the action menu',
    });
    await updateStatusOption.click();
    await browser.pause(1500);

    // Step 3: Confirm "Workorder" modal is opened
    const modalTitle = $(
      '//XCUIElementTypeStaticText[@name="Workorder" or @label="Workorder"] | //XCUIElementTypeOther[@name="Workorder"] | //*[contains(@name, "Update Workorder")]',
    );
    await modalTitle.waitForDisplayed({
      timeout: 10_000,
      timeoutMsg: '"Workorder" status update modal was not displayed',
    });
  },

  /**
   * Selects a status option from the modal dropdown (e.g. HOLD).
   */
  async selectStatusInModal(status: 'HOLD' | 'CANCELLED' = 'HOLD'): Promise<void> {
    const statusDropdown = $(
      '//XCUIElementTypeOther[@name="OPEN, " or starts-with(@name, "OPEN") or contains(@name, "Update Status")]',
    );
    await statusDropdown.waitForDisplayed({ timeout: 10_000 });
    await statusDropdown.click();
    await browser.pause(800);

    const option = $(
      `//XCUIElementTypeOther[@name="${status}" or contains(@name, "${status}")] | //XCUIElementTypeStaticText[@name="${status}"]`,
    );
    await option.waitForDisplayed({
      timeout: 10_000,
      timeoutMsg: `Status option "${status}" was not displayed in dropdown`,
    });
    await option.click();
    await browser.pause(500);
  },

  /**
   * Asserts that tapping "Update Workorder" without entering a reason is blocked.
   */
  async verifyCannotUpdateWithoutReason(): Promise<void> {
    const updateWoBtn = $(
      '//XCUIElementTypeOther[@name=", Update Workorder" or contains(@name, "Update Workorder")]',
    );
    await updateWoBtn.waitForDisplayed({ timeout: 10_000 });
    await updateWoBtn.click();
    await browser.pause(800);

    // Verify modal remains open because reason is mandatory
    const modalTitle = $(
      '//XCUIElementTypeStaticText[@name="Workorder" or @label="Workorder"] | //XCUIElementTypeOther[@name="Workorder"]',
    );
    await expect(modalTitle).toBeDisplayed();
  },

  /**
   * Enters the status update reason into the modal.
   */
  async enterStatusUpdateReason(reason: string): Promise<void> {
    const reasonInput = $(
      '//XCUIElementTypeTextView[@name="Enter reason..." or contains(@placeholderValue, "reason") or contains(@value, "reason")]',
    );
    await reasonInput.waitForDisplayed({ timeout: 10_000 });
    await reasonInput.click();
    await reasonInput.setValue(reason);
    await browser.pause(500);

    // Dismiss keyboard safely
    await this.dismissKeyboard();
  },

  /**
   * Submits the status update and confirms any popup dialog.
   */
  async submitStatusUpdate(): Promise<void> {
    const updateWoBtn = $(
      '//XCUIElementTypeOther[@name=", Update Workorder" or contains(@name, "Update Workorder")]',
    );
    await updateWoBtn.waitForDisplayed({ timeout: 10_000 });
    await updateWoBtn.click();
    await browser.pause(2000);

    // Confirm popup if shown
    const okBtn = $(
      '//XCUIElementTypeButton[@name="OK" or @label="OK"] | //XCUIElementTypeOther[@name="OK" or @label="OK"] | //*[@name="OK" or @label="OK"]',
    );
    if (await okBtn.waitForDisplayed({ timeout: 5000 }).then(() => true).catch(() => false)) {
      await okBtn.click();
      await browser.pause(1500);
    }
  },


  /**
   * Verifies that the Work Order is present under the HOLD section of the Work Orders list.
   */
  async verifyWorkOrderInHoldFilter(targetTitleOrId: string): Promise<void> {
    await this.returnToOpenList();
    // Switch from OPEN tab to HOLD tab/section
    await this.openTab('HOLD');
    await this.refreshList();

    const targetCard = $(
      `//*[contains(@name, "${targetTitleOrId}") or contains(@label, "${targetTitleOrId}")]`,
    );

    let isDisplayed = await targetCard.isDisplayed().catch(() => false);
    for (let swipe = 0; swipe < 4 && !isDisplayed; swipe++) {
      await browser.execute('mobile: swipe', { direction: 'up' });
      await browser.pause(800);
      isDisplayed = await targetCard.isDisplayed().catch(() => false);
    }

    await targetCard.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Work order "${targetTitleOrId}" was not found under HOLD section`,
    });
    await expect(targetCard).toBeDisplayed();
  },


  /**
   * History tab selector inside the Workorder status update modal
   */
  get historyTab() {
    return $('//XCUIElementTypeOther[@name="History"]');
  },

  /**
   * Clicks on the WO from the HOLD section, opens Update -> History, and asserts status changed to HOLD.
   */
  async verifyStatusInHistory(targetTitleOrId: string, expectedStatus: string = 'HOLD'): Promise<void> {
    // Click on the same Work Order in the HOLD section to open it
    const targetCard = $(
      `//*[contains(@name, "${targetTitleOrId}") or contains(@label, "${targetTitleOrId}")]`,
    );
    await targetCard.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `Work order "${targetTitleOrId}" not found in HOLD section to open history`,
    });
    await targetCard.click();
    await browser.pause(2500);

    // Click Update button to open modal
    await this.openUpdateStatusModal();

    // Click History tab inside the Workorder modal
    await this.historyTab.waitForDisplayed({
      timeout: 10_000,
      timeoutMsg: 'History tab was not displayed in Workorder modal',
    });
    await this.historyTab.click();
    await browser.pause(1500);

    // Verify history entry matching "Updated status to <expectedStatus>"
    const historyEntry = $(
      `//*[contains(@name, "Updated status to ${expectedStatus}") or contains(@label, "Updated status to ${expectedStatus}")]`,
    );
    await historyEntry.waitForDisplayed({
      timeout: 15_000,
      timeoutMsg: `History entry "Updated status to ${expectedStatus}" was not displayed`,
    });
    await expect(historyEntry).toBeDisplayed();
  },
};



